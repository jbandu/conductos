import { db } from '../../services/knowledgeService.js';

const TEMPLATE_SEEDS = [
  {
    template_type: 'notice_to_respondent',
    title: 'Notice to Respondent',
    description: 'Formal notice informing respondent of the complaint and their rights.',
    template_content: 'Dear [RESPONDENT NAME],\n\nYou are hereby notified...',
    required_fields: { respondent_name: true, response_deadline: true },
    legal_basis: ['Section 11'],
    version: 1
  },
  {
    template_type: 'mom_inquiry',
    title: 'Minutes of Meeting - Inquiry',
    description: 'Template for recording inquiry session MoM.',
    template_content: 'Case: {{case_code}}\nDate: {{date}}\nAttendees: {{attendees}}\nSummary: {{summary}}',
    required_fields: { case_code: true, date: true },
    legal_basis: ['Section 11'],
    version: 1
  }
];

export async function ingestTemplates() {
  for (const template of TEMPLATE_SEEDS) {
    await db.insert('templates', template);
  }

  console.log('Template ingestion complete');
}

if (process.env.RUN_INGEST === 'true') {
  ingestTemplates().catch((error) => {
    console.error('Template ingestion failed', error);
    process.exit(1);
  });
}
