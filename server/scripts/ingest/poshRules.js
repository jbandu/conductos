import { db } from '../../services/knowledgeService.js';
import { generateEmbedding } from '../../services/embeddingService.js';

const POSH_RULES = [
  { rule_number: 'Rule 7', title: 'Fees for members', text: 'Placeholder text for PoSH Rules Rule 7.' },
  { rule_number: 'Rule 8', title: 'Procedure for disposal of complaints', text: 'Placeholder text for PoSH Rules Rule 8.' }
];

export async function ingestPoSHRules() {
  const document = await db.insert('legal_documents', {
    document_type: 'rules',
    title: 'The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Rules, 2013',
    citation: 'G.S.R. 769(E)',
    effective_date: '2013-12-09',
    full_text: POSH_RULES.map((rule) => rule.text).join('\n')
  });

  for (const rule of POSH_RULES) {
    const embedding = await generateEmbedding(rule.text);
    await db.insert('legal_sections', {
      document_id: document.id,
      section_number: rule.rule_number,
      section_title: rule.title,
      section_text: rule.text,
      section_type: 'section',
      embedding,
      metadata: { source: 'rules' }
    });
  }

  console.log('PoSH Rules ingestion complete');
}

if (process.env.RUN_INGEST === 'true') {
  ingestPoSHRules().catch((error) => {
    console.error('PoSH Rules ingestion failed', error);
    process.exit(1);
  });
}
