import Anthropic from '@anthropic-ai/sdk';
import pool from '../../db/pg-init.js';
import { generateEmbedding } from '../embeddingService.js';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function firstRow(result) {
  return result?.rows?.[0] || null;
}

function mergePatternResults(similarRows, characteristicRows) {
  const merged = new Map();

  similarRows.forEach((row) => {
    merged.set(row.id, {
      ...row,
      combined_score: Number(row.similarity || 0),
      matching_factors: row.matching_factors || []
    });
  });

  characteristicRows.forEach((row) => {
    const existing = merged.get(row.id);
    const score = Number(row.characteristic_score || 0);
    if (existing) {
      existing.combined_score = (existing.combined_score || 0) + score;
      existing.matching_factors = row.matching_factors || existing.matching_factors || [];
      merged.set(row.id, existing);
    } else {
      merged.set(row.id, {
        ...row,
        combined_score: score,
        matching_factors: row.matching_factors || []
      });
    }
  });

  return Array.from(merged.values()).sort((a, b) => (b.combined_score || 0) - (a.combined_score || 0));
}

export class PatternAnalysisEngine {
  async analyzeCase(caseId) {
    const caseResult = await pool.query(
      `SELECT c.*, (
        SELECT json_agg(h.* ORDER BY h.changed_at)
        FROM status_history h
        WHERE h.case_id = c.id
      ) AS history
      FROM cases c
      WHERE c.id = $1`,
      [caseId]
    );
    const caseData = firstRow(caseResult);

    if (!caseData) {
      throw new Error('Case not found');
    }

    const analysisPrompt = `Analyze this PoSH complaint and extract structured characteristics.

## Complaint Details
- Description: ${caseData.description}
- Incident Date: ${caseData.incident_date}
- Filed Date: ${caseData.created_at}
- Anonymous: ${caseData.is_anonymous}
- Conciliation Requested: ${caseData.conciliation_requested}

Extract the following in JSON format:
{
  "incident_types": ["verbal", "physical", "quid_pro_quo", "hostile_environment"],
  "severity_indicators": [],
  "location_type": "office|offsite|virtual|travel|mixed",
  "relationship_dynamic": "peer|supervisor|subordinate|client|vendor|unknown",
  "witness_availability": "multiple|single|none|unknown",
  "evidence_strength": "strong|moderate|weak|unknown",
  "key_phrases": [],
  "risk_assessment": {
    "escalation_risk": 0,
    "timeline_risk": 0,
    "complexity_score": 0,
    "retaliation_risk": 0
  },
  "reasoning": ""
}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [{ role: 'user', content: analysisPrompt }]
    });

    const contentBlock = response.content?.[0];
    const analysisText = contentBlock?.type === 'text' ? contentBlock.text : '';
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    const analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    const embeddingText = `${caseData.description || ''} ${(analysis.key_phrases || []).join(' ')}`;
    const embedding = await generateEmbedding(embeddingText);

    await pool.query(
      `INSERT INTO case_characteristics (
        case_id, incident_type, severity_indicators, location_type,
        relationship_dynamic, witness_availability, evidence_strength,
        escalation_risk, timeline_risk, complexity_score, retaliation_risk,
        embedding, key_phrases
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (case_id) DO UPDATE SET
        incident_type = EXCLUDED.incident_type,
        severity_indicators = EXCLUDED.severity_indicators,
        location_type = EXCLUDED.location_type,
        relationship_dynamic = EXCLUDED.relationship_dynamic,
        witness_availability = EXCLUDED.witness_availability,
        evidence_strength = EXCLUDED.evidence_strength,
        escalation_risk = EXCLUDED.escalation_risk,
        timeline_risk = EXCLUDED.timeline_risk,
        complexity_score = EXCLUDED.complexity_score,
        retaliation_risk = EXCLUDED.retaliation_risk,
        embedding = EXCLUDED.embedding,
        key_phrases = EXCLUDED.key_phrases,
        updated_at = NOW()`,
      [
        caseId,
        analysis.incident_types,
        analysis.severity_indicators,
        analysis.location_type,
        analysis.relationship_dynamic,
        analysis.witness_availability,
        analysis.evidence_strength,
        analysis.risk_assessment?.escalation_risk ?? 50,
        analysis.risk_assessment?.timeline_risk ?? 50,
        analysis.risk_assessment?.complexity_score ?? 50,
        analysis.risk_assessment?.retaliation_risk ?? 50,
        JSON.stringify(embedding),
        analysis.key_phrases
      ]
    );

    return {
      caseId,
      characteristics: analysis,
      embedding,
      analyzedAt: new Date()
    };
  }

  async findSimilarPatterns(caseId, limit = 5) {
    const charsResult = await pool.query('SELECT * FROM case_characteristics WHERE case_id = $1', [caseId]);
    const chars = firstRow(charsResult);

    if (!chars) {
      throw new Error('Case not analyzed yet. Run analyzeCase first.');
    }

    const similarity = await pool.query(
      `SELECT p.*, 1 - (cc.embedding <=> p.embedding) AS similarity
       FROM case_patterns p
       CROSS JOIN case_characteristics cc
       WHERE cc.case_id = $1
       ORDER BY cc.embedding <=> p.embedding
       LIMIT $2`,
      [caseId, limit]
    );

    const characteristicMatches = await pool.query(
      `SELECT p.*, (
        CASE WHEN p.characteristics->>'relationship_dynamic' = $2 THEN 0.2 ELSE 0 END +
        CASE WHEN p.characteristics->>'location_type' = $3 THEN 0.1 ELSE 0 END +
        CASE WHEN p.characteristics->'incident_types' ?| $4 THEN 0.3 ELSE 0 END
      ) AS characteristic_score
      FROM case_patterns p
      WHERE p.characteristics->>'relationship_dynamic' = $2
         OR p.characteristics->>'location_type' = $3
         OR p.characteristics->'incident_types' ?| $4
      ORDER BY characteristic_score DESC
      LIMIT $5`,
      [caseId, chars.relationship_dynamic, chars.location_type, chars.incident_type || [], limit]
    );

    const merged = mergePatternResults(similarity.rows, characteristicMatches.rows).slice(0, limit);

    for (const pattern of merged) {
      await pool.query(
        `INSERT INTO case_similarities (case_id, similar_pattern_id, similarity_score, matching_factors)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (case_id, similar_pattern_id) DO NOTHING`,
        [caseId, pattern.id, pattern.combined_score || 0, pattern.matching_factors || []]
      );
    }

    return merged;
  }

  async getRiskAssessment(caseId) {
    const chars = firstRow(await pool.query('SELECT * FROM case_characteristics WHERE case_id = $1', [caseId]));
    const caseData = firstRow(
      await pool.query(
        `SELECT *, (deadline_date - CURRENT_DATE) AS days_remaining
         FROM cases WHERE id = $1`,
        [caseId]
      )
    );

    const risks = {
      escalation: { score: chars?.escalation_risk ?? 50, factors: [], mitigations: [] },
      timeline: { score: chars?.timeline_risk ?? 50, factors: [], mitigations: [] },
      complexity: { score: chars?.complexity_score ?? 50, factors: [], mitigations: [] },
      retaliation: { score: chars?.retaliation_risk ?? 50, factors: [], mitigations: [] }
    };

    if (caseData?.days_remaining !== null && caseData?.days_remaining !== undefined) {
      if (caseData.days_remaining < 30) {
        risks.timeline.score = Math.min(100, risks.timeline.score + 30);
        risks.timeline.factors.push(`Only ${caseData.days_remaining} days remaining`);
      }
      if (caseData.days_remaining < 15) {
        risks.timeline.score = Math.min(100, risks.timeline.score + 20);
        risks.timeline.factors.push('Critical: Less than 15 days to deadline');
        risks.timeline.mitigations.push('Consider expedited proceedings');
      }
    }

    if (chars?.relationship_dynamic === 'supervisor') {
      risks.escalation.score = Math.min(100, risks.escalation.score + 15);
      risks.escalation.factors.push('Power imbalance: supervisor-subordinate');
      risks.retaliation.score = Math.min(100, risks.retaliation.score + 20);
      risks.retaliation.factors.push('Higher retaliation risk due to reporting structure');
      risks.retaliation.mitigations.push('Consider interim measures per Section 12');
    }

    if (chars?.evidence_strength === 'weak') {
      risks.complexity.score = Math.min(100, risks.complexity.score + 20);
      risks.complexity.factors.push('Limited evidence available');
      risks.complexity.mitigations.push('Focus on circumstantial evidence and witness testimony');
    }

    const avgRisk =
      (risks.escalation.score + risks.timeline.score + risks.complexity.score + risks.retaliation.score) / 4;

    let overallLevel = 'medium';
    if (avgRisk < 30) overallLevel = 'low';
    else if (avgRisk < 50) overallLevel = 'medium';
    else if (avgRisk < 75) overallLevel = 'high';
    else overallLevel = 'critical';

    return {
      caseId,
      overallLevel,
      overallScore: Math.round(avgRisk),
      risks,
      recommendedActions: this.generateRecommendedActions(risks, caseData || {}),
      assessedAt: new Date()
    };
  }

  generateRecommendedActions(risks, caseData) {
    const actions = [];
    const daysRemaining = caseData?.days_remaining;

    if (risks.timeline.score > 70) {
      actions.push({
        priority: 'high',
        category: 'timeline',
        action: 'Schedule inquiry sessions immediately',
        reason: `${daysRemaining ?? 'Limited'} days remaining to deadline`,
        deadline: daysRemaining ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null
      });
    }

    if (risks.retaliation.score > 60) {
      actions.push({
        priority: 'high',
        category: 'protection',
        action: 'Implement interim protection measures',
        reason: 'High retaliation risk identified',
        legalBasis: 'Section 12 of PoSH Act'
      });
    }

    if (risks.complexity.score > 70) {
      actions.push({
        priority: 'medium',
        category: 'investigation',
        action: 'Consider engaging external expert',
        reason: 'Complex case may benefit from specialist input'
      });
    }

    if (risks.escalation.score > 60) {
      actions.push({
        priority: 'medium',
        category: 'management',
        action: 'Brief senior leadership on case sensitivity',
        reason: 'Elevated escalation risk'
      });
    }

    return actions;
  }

  async getCaseBenchmarks(organizationId) {
    const benchmarks = firstRow(
      await pool.query(
        `SELECT 
          COUNT(*) AS total_cases,
          AVG(CASE WHEN status = 'closed' THEN EXTRACT(EPOCH FROM (updated_at - created_at)) / 86400 ELSE NULL END) AS avg_resolution_days,
          COUNT(*) FILTER (WHERE status = 'closed' AND updated_at - created_at <= INTERVAL '90 days') * 100.0 /
            NULLIF(COUNT(*) FILTER (WHERE status = 'closed'), 0) AS compliance_rate,
          COUNT(*) FILTER (WHERE conciliation_requested) * 100.0 / NULLIF(COUNT(*), 0) AS conciliation_rate,
          COUNT(*) FILTER (WHERE is_anonymous) * 100.0 / NULLIF(COUNT(*), 0) AS anonymous_rate
        FROM cases
        WHERE organization_id = $1`,
        [organizationId]
      )
    );

    const industryBenchmarks = {
      avg_resolution_days: 58,
      compliance_rate: 89,
      conciliation_rate: 35,
      anonymous_rate: 28
    };

    return {
      organization: {
        totalCases: Number(benchmarks?.total_cases || 0),
        avgResolutionDays: Math.round(benchmarks?.avg_resolution_days || 0),
        complianceRate: Math.round(benchmarks?.compliance_rate || 0),
        conciliationRate: Math.round(benchmarks?.conciliation_rate || 0),
        anonymousRate: Math.round(benchmarks?.anonymous_rate || 0)
      },
      industry: industryBenchmarks,
      comparison: {
        resolutionSpeed:
          (benchmarks?.avg_resolution_days || 0) < industryBenchmarks.avg_resolution_days ? 'faster' : 'slower',
        compliance:
          (benchmarks?.compliance_rate || 0) > industryBenchmarks.compliance_rate ? 'above' : 'below'
      }
    };
  }
}
