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
      action_taken: 68,
      resigned_during_inquiry: 22,
      inconclusive: 10
    },
    avg_resolution_days: 72,
    success_factors: [
      'Early involvement of external member',
      'Board-level awareness',
      'Strong documentation of quid pro quo elements'
    ],
    risk_factors: [
      'Organizational pressure to suppress',
      'Power imbalance affecting witnesses',
      'Retaliation through performance reviews'
    ],
    recommended_approach:
      'Involve external member as co-lead. Ensure Board Audit Committee is informed. Document any interference attempts. Consider interim reporting line changes per Section 12.',
    common_pitfalls: [
      'Allowing HR Head to lead when they report to respondent',
      'Not documenting informal pressure',
      'Rushing to protect organizational reputation'
    ],
    confidence: 0.89
  },
  {
    pattern_name: 'Hostile Environment - Prolonged',
    pattern_type: 'investigation',
    characteristics: {
      incident_types: ['hostile_environment'],
      duration: 'prolonged',
      witness_availability: 'multiple'
    },
    frequency: 234,
    typical_outcomes: {
      action_taken: 52,
      policy_changes: 31,
      no_action: 17
    },
    avg_resolution_days: 65,
    success_factors: [
      'Pattern documentation across incidents',
      'Multiple corroborating witnesses',
      'Clear timeline establishment'
    ],
    risk_factors: [
      'Normalization of behavior in team',
      'Complainant fatigue during long inquiry',
      'Evidence scattered across time'
    ],
    recommended_approach:
      'Create comprehensive timeline first. Interview witnesses about specific incidents. Look for pattern rather than single event. Consider systemic recommendations.',
    common_pitfalls: [
      'Treating as isolated incidents',
      'Not connecting dots across timeline',
      'Ignoring bystander testimony'
    ],
    confidence: 0.92
  },
  {
    pattern_name: 'Client/Vendor Harassment',
    pattern_type: 'complexity',
    characteristics: {
      relationship_dynamic: 'client',
      incident_types: ['verbal', 'physical'],
      location_type: 'offsite'
    },
    frequency: 89,
    typical_outcomes: {
      client_relationship_modified: 45,
      internal_policy_change: 35,
      no_action_possible: 20
    },
    avg_resolution_days: 78,
    success_factors: [
      'Clear documentation at time of incident',
      'Employer support for complainant',
      'Swift interim measures'
    ],
    risk_factors: [
      'Business relationship pressure',
      'Limited jurisdiction over external party',
      'Evidence outside organization control'
    ],
    recommended_approach:
      "Focus on employer's duty under Section 19. Document organizational response. Recommend client engagement protocols. Consider safety measures for complainant.",
    common_pitfalls: [
      'Prioritizing client relationship over employee safety',
      "Not documenting employer's response",
      'Assuming no action possible'
    ],
    confidence: 0.85
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
        confidence, embedding
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      ON CONFLICT (pattern_name) DO NOTHING`,
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
