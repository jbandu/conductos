import { db } from '../../services/knowledgeService.js';
import { generateEmbedding } from '../../services/embeddingService.js';

const PLAYBOOK_CATEGORIES = {
  intake: {
    title: 'Complaint Intake',
    playbooks: [
      {
        title: 'Handling Verbal Complaint',
        scenario: 'Complainant prefers to share details verbally rather than in writing',
        recommended_approach: "Offer to transcribe the complaint in the complainant's presence, read it back for confirmation, and have them sign it.",
        do_list: [
          'Assure confidentiality before taking verbal account',
          'Document exactly what was said without interpretation',
          'Read back the transcription and get written confirmation',
          'Explain that written record is required for formal processing'
        ],
        dont_list: [
          'Discourage verbal complaints outright',
          'Add your interpretation to the written record',
          'Rush the complainant'
        ],
        legal_references: ['Section 9'],
        difficulty_level: 'basic'
      },
      {
        title: 'Complaint Against Senior Executive',
        scenario: 'Complainant names a CXO or board member as the respondent',
        recommended_approach: 'Follow protocol while ensuring IC independence. May need to involve external member as lead. Document any attempts at influence.',
        do_list: [
          'Treat case with same process as any other',
          'Consider having External Member lead the inquiry',
          'Document any communication from senior stakeholders',
          'Ensure complainant knows about escalation to Board if needed'
        ],
        dont_list: [
          'Discuss the case with other senior executives',
          'Allow HR Head to influence if they report to respondent',
          "Fast-track or slow-track based on respondent's position"
        ],
        legal_references: ['Section 4', 'Section 11'],
        difficulty_level: 'advanced'
      }
    ]
  }
};

export async function ingestPlaybooks() {
  for (const [category, data] of Object.entries(PLAYBOOK_CATEGORIES)) {
    for (const playbook of data.playbooks) {
      const textForEmbedding = `${playbook.title}. ${playbook.scenario}. ${playbook.recommended_approach}`;
      const embedding = await generateEmbedding(textForEmbedding);

      await db.insert('playbooks', {
        category,
        title: playbook.title,
        scenario: playbook.scenario,
        recommended_approach: playbook.recommended_approach,
        do_list: playbook.do_list,
        dont_list: playbook.dont_list,
        legal_references: playbook.legal_references,
        difficulty_level: playbook.difficulty_level,
        embedding
      });
    }
  }

  console.log('Playbook ingestion complete');
}

if (process.env.RUN_INGEST === 'true') {
  ingestPlaybooks().catch((error) => {
    console.error('Playbook ingestion failed', error);
    process.exit(1);
  });
}
