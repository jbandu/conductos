import pool from '../db/pg-init.js';
import { generateEmbedding } from '../services/embeddingService.js';

const CASE_PATTERNS = [
  {
    pattern_name: 'Senior Executive - Quid Pro Quo',
    pattern_type: 'risk',
    characteristics: {
      relationship_dynamic: 'supervisor',
      incident_types: ['quid_pro_quo'],
      seniority_level: 'executive'
    },
    frequency: 127,
    typical_outcomes: {
      substantiated: 0.68,
      unsubstantiated: 0.22,
      inconclusive: 0.1
    },
    avg_resolution_days: 72,
    success_factors: [
      'Early involvement of external member',
      'Board-level awareness',
      'Strong documentation of quid pro quo elements',
      'Protection of complainant from retaliation'
    ],
    risk_factors: [
      'Organizational pressure to suppress',
      'Power imbalance affecting witnesses',
      'Retaliation through performance reviews',
      'Delayed reporting due to fear'
    ],
    recommended_approach:
      'Involve external member as co-lead. Ensure Board Audit Committee informed. Document interference attempts. Consider interim reporting line changes per Section 12.',
    common_pitfalls: [
      'Allowing HR Head to lead when they report to respondent',
      'Not documenting informal pressure or interference',
      'Rushing to conciliation without proper assessment',
      'Inadequate interim protection measures'
    ],
    confidence: 0.89
  },
  {
    pattern_name: 'Peer-Level Hostile Environment',
    pattern_type: 'resolution',
    characteristics: {
      relationship_dynamic: 'peer',
      incident_types: ['hostile_environment', 'verbal'],
      workplace_setting: 'open_office'
    },
    frequency: 342,
    typical_outcomes: {
      conciliated: 0.45,
      substantiated: 0.35,
      unsubstantiated: 0.15,
      withdrawn: 0.05
    },
    avg_resolution_days: 45,
    success_factors: [
      'Clear witness statements',
      'Pattern documentation over time',
      'Open to conciliation if first offense',
      'Workplace culture assessment'
    ],
    risk_factors: [
      'He-said-she-said situations',
      'Collegial atmosphere masking harassment',
      'Bystander reluctance to testify',
      'Normalizing of inappropriate behavior'
    ],
    recommended_approach:
      'Assess if conciliation appropriate (first offense, genuine remorse). Focus on behavior pattern documentation. Interview bystanders. Consider awareness training for team.',
    common_pitfalls: [
      'Dismissing as office banter',
      'Not documenting recurring incidents',
      'Pressuring complainant to conciliate',
      'Not addressing team dynamics'
    ],
    confidence: 0.85
  },
  {
    pattern_name: 'Client/Vendor Harassment',
    pattern_type: 'investigation',
    characteristics: {
      relationship_dynamic: 'external',
      respondent_type: 'client_vendor',
      incident_types: ['verbal', 'quid_pro_quo']
    },
    frequency: 89,
    typical_outcomes: {
      action_taken: 0.72,
      no_action_possible: 0.18,
      ongoing: 0.1
    },
    avg_resolution_days: 60,
    success_factors: [
      'Clear organizational policy on external harassment',
      'Management support for action',
      'Documentation of business impact',
      'Swift protective measures'
    ],
    risk_factors: [
      'Business relationship pressure',
      'Limited jurisdiction over external party',
      'Complainant fear of career impact',
      'Management reluctance to act'
    ],
    recommended_approach:
      'Document incident thoroughly. Escalate to management immediately. Implement protective measures (different client assignment). Consider formal complaint to client organization.',
    common_pitfalls: [
      'Prioritizing business relationship over employee safety',
      'Not having clear external harassment policy',
      'Delayed action due to business concerns',
      'Making complainant continue working with harasser'
    ],
    confidence: 0.78
  },
  {
    pattern_name: 'Repeat Offender Pattern',
    pattern_type: 'risk',
    characteristics: {
      prior_complaints: true,
      complaint_count: { min: 2 },
      different_complainants: true
    },
    frequency: 45,
    typical_outcomes: {
      substantiated: 0.82,
      terminated: 0.45,
      demoted: 0.25,
      warning: 0.12
    },
    avg_resolution_days: 55,
    success_factors: [
      'Access to prior complaint records',
      'Pattern recognition across cases',
      'Strong documentation',
      'Management will to act'
    ],
    risk_factors: [
      'Protection due to seniority or performance',
      'Prior cases handled informally',
      'Different complainants unaware of pattern',
      'HR reluctance to escalate'
    ],
    recommended_approach:
      'Review all prior complaints. Document pattern clearly. Recommend stricter action based on repeat behavior. Consider termination recommendation per service rules.',
    common_pitfalls: [
      'Not connecting cases handled by different IC compositions',
      'Giving benefit of doubt repeatedly',
      'Treating each case in isolation',
      'Not checking respondent history at intake'
    ],
    confidence: 0.92
  },
  {
    pattern_name: 'Anonymous - Department Cluster',
    pattern_type: 'investigation',
    characteristics: {
      is_anonymous: true,
      department_specific: true,
      multiple_complaints: true
    },
    frequency: 67,
    typical_outcomes: {
      identified_complainant: 0.35,
      environmental_action: 0.55,
      unable_to_proceed: 0.1
    },
    avg_resolution_days: 75,
    success_factors: [
      'Discreet environmental assessment',
      'Management cooperation',
      'Supportive HR intervention',
      'Creating safe reporting channels'
    ],
    risk_factors: [
      'Cannot proceed to formal inquiry',
      'Possible false/malicious complaints',
      'Alerting potential respondent',
      'Department defensiveness'
    ],
    recommended_approach:
      'Conduct confidential environmental assessment. Review department culture. Implement awareness training. Create safe channels for formal complaint if complainant ready.',
    common_pitfalls: [
      'Ignoring anonymous complaints',
      'Alerting department before assessment',
      'Not following up on patterns',
      'Dismissing without investigation'
    ],
    confidence: 0.75
  }
];

async function seedPatterns() {
  for (const pattern of CASE_PATTERNS) {
    const embeddingText = `${pattern.pattern_name} ${pattern.recommended_approach} ${(pattern.risk_factors || []).join(' ')}`;
    const embedding = await generateEmbedding(embeddingText);

    await pool.query(
      `INSERT INTO case_patterns (
        pattern_name, pattern_type, characteristics, frequency,
        typical_outcomes, avg_resolution_days, success_factors,
        risk_factors, recommended_approach, common_pitfalls,
        confidence, embedding, last_updated
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
      ON CONFLICT (pattern_name) DO UPDATE SET
        pattern_type = EXCLUDED.pattern_type,
        characteristics = EXCLUDED.characteristics,
        frequency = EXCLUDED.frequency,
        typical_outcomes = EXCLUDED.typical_outcomes,
        avg_resolution_days = EXCLUDED.avg_resolution_days,
        success_factors = EXCLUDED.success_factors,
        risk_factors = EXCLUDED.risk_factors,
        recommended_approach = EXCLUDED.recommended_approach,
        common_pitfalls = EXCLUDED.common_pitfalls,
        confidence = EXCLUDED.confidence,
        embedding = EXCLUDED.embedding,
        last_updated = NOW()`,
      [
        pattern.pattern_name,
        pattern.pattern_type,
        JSON.stringify(pattern.characteristics),
        pattern.frequency,
        JSON.stringify(pattern.typical_outcomes),
        pattern.avg_resolution_days,
        pattern.success_factors,
        pattern.risk_factors,
        pattern.recommended_approach,
        pattern.common_pitfalls,
        pattern.confidence,
        JSON.stringify(embedding)
      ]
    );
  }

  console.log(`Seeded ${CASE_PATTERNS.length} case patterns`);
  process.exit(0);
}

seedPatterns().catch((error) => {
  console.error('Failed to seed patterns', error);
  process.exit(1);
});
