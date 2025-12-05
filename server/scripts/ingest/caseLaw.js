import { db } from '../../services/knowledgeService.js';
import { generateEmbedding } from '../../services/embeddingService.js';

const LANDMARK_CASES = [
  {
    case_name: 'Vishaka v. State of Rajasthan',
    citation: 'AIR 1997 SC 3011',
    court: 'Supreme Court of India',
    decided_date: '1997-08-13',
    relevance_score: 10,
    facts_summary: 'A social worker was attacked while preventing child marriage. The judgment created binding workplace sexual harassment guidelines.',
    issues: [
      'Whether sexual harassment at workplace violates fundamental rights',
      'What guidelines should apply in absence of legislation'
    ],
    holdings: [
      'Sexual harassment violates Articles 14, 15, 19(1)(g), and 21',
      'Vishaka Guidelines to be followed until legislation enacted'
    ],
    ratio_decidendi: 'Employers have a duty to prevent sexual harassment at workplace. Courts can craft binding guidance to enforce constitutional rights.',
    sections_interpreted: ['Article 14', 'Article 15', 'Article 19(1)(g)', 'Article 21']
  },
  {
    case_name: 'Medha Kotwal Lele v. Union of India',
    citation: '(2013) 1 SCC 297',
    court: 'Supreme Court of India',
    decided_date: '2012-10-19',
    relevance_score: 10,
    facts_summary: 'PIL seeking implementation of Vishaka Guidelines and legislation on workplace sexual harassment.',
    holdings: [
      'Vishaka Guidelines have force of law under Article 141',
      'Complaints Committee must be constituted in all establishments',
      'States must set up sufficient Local Complaints Committees'
    ],
    ratio_decidendi: 'Vishaka Guidelines remain binding and must be strictly followed. Non-compliance can attract contempt proceedings.'
  }
];

export async function ingestCaseLaw() {
  for (const caseData of LANDMARK_CASES) {
    const fullText = `${caseData.facts_summary} ${caseData.holdings?.join(' ') || ''} ${caseData.ratio_decidendi}`;
    const embedding = await generateEmbedding(fullText);

    const document = await db.insert('legal_documents', {
      document_type: 'case_law',
      title: caseData.case_name,
      citation: caseData.citation,
      effective_date: caseData.decided_date,
      full_text: fullText,
      metadata: { court: caseData.court }
    });

    await db.insert('case_law', {
      document_id: document.id,
      ...caseData,
      embedding
    });
  }

  console.log('Case law ingestion complete');
}

if (process.env.RUN_INGEST === 'true') {
  ingestCaseLaw().catch((error) => {
    console.error('Case law ingestion failed', error);
    process.exit(1);
  });
}
