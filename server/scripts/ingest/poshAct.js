import { db } from '../../services/knowledgeService.js';
import { generateEmbedding } from '../../services/embeddingService.js';

const POSH_ACT_STRUCTURE = {
  title: 'The Sexual Harassment of Women at Workplace (Prevention, Prohibition and Redressal) Act, 2013',
  citation: 'Act No. 14 of 2013',
  effective_date: '2013-12-09',
  chapters: [
    {
      number: 'I',
      title: 'Preliminary',
      sections: [
        { number: '1', title: 'Short title, extent and commencement' },
        { number: '2', title: 'Definitions', subsections: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's'] }
      ]
    },
    {
      number: 'II',
      title: 'Constitution of Internal Complaints Committee',
      sections: [
        { number: '4', title: 'Constitution of Internal Complaints Committee' }
      ]
    },
    {
      number: 'III',
      title: 'Constitution of Local Complaints Committee',
      sections: [
        { number: '5', title: 'Constitution and jurisdiction of Local Complaints Committee' },
        { number: '6', title: 'Composition and tenure of Local Complaints Committee' },
        { number: '7', title: 'Grants and audit' },
        { number: '8', title: 'Vacancies, etc., not to invalidate proceedings' }
      ]
    },
    {
      number: 'IV',
      title: 'Complaint',
      sections: [
        { number: '9', title: 'Complaint of sexual harassment' }
      ]
    },
    {
      number: 'V',
      title: 'Inquiry into Complaint',
      sections: [
        { number: '10', title: 'Conciliation' },
        { number: '11', title: 'Inquiry into complaint' },
        { number: '12', title: 'Action during pendency of inquiry' },
        { number: '13', title: 'Inquiry report' },
        { number: '14', title: 'Punishment for false or malicious complaint' },
        { number: '15', title: 'Determination of compensation' }
      ]
    },
    {
      number: 'VI',
      title: 'Action for Sexual Harassment',
      sections: [
        { number: '16', title: 'Prohibition of publication' },
        { number: '17', title: 'Penalty for publication' },
        { number: '18', title: 'Appeal' }
      ]
    },
    {
      number: 'VII',
      title: 'Duties of Employer',
      sections: [
        { number: '19', title: 'Duties of employer' }
      ]
    },
    {
      number: 'VIII',
      title: 'Duties and Powers of District Officer',
      sections: [
        { number: '20', title: 'Duties and powers of District Officer' }
      ]
    },
    {
      number: 'IX',
      title: 'Miscellaneous',
      sections: [
        { number: '21', title: 'Submission of annual report' },
        { number: '22', title: 'Employer to submit report' },
        { number: '23', title: 'Bar of suits, prosecutions, etc.' },
        { number: '24', title: 'Act not in derogation of any other law' },
        { number: '25', title: 'Penalty for employer' },
        { number: '26', title: 'Penalty for non-compliance' },
        { number: '27', title: 'Cognizance of offence' },
        { number: '28', title: 'Protection of action taken in good faith' },
        { number: '29', title: 'Power to make rules' },
        { number: '30', title: 'Power to remove difficulties' }
      ]
    }
  ]
};

async function fetchActFullText() {
  return POSH_ACT_STRUCTURE.chapters.map((chapter) => chapter.title).join('\n');
}

async function fetchSectionText(sectionNumber) {
  return `Placeholder text for Section ${sectionNumber}. Replace with official text during ingestion.`;
}

function extractKeywords(text) {
  return text.split(/\s+/).slice(0, 5);
}

export async function ingestPoSHAct() {
  const document = await db.insert('legal_documents', {
    document_type: 'act',
    title: POSH_ACT_STRUCTURE.title,
    citation: POSH_ACT_STRUCTURE.citation,
    source_url: 'https://www.indiacode.nic.in/handle/123456789/2104',
    effective_date: POSH_ACT_STRUCTURE.effective_date,
    full_text: await fetchActFullText(),
    metadata: { chapters: POSH_ACT_STRUCTURE.chapters.length }
  });

  for (const chapter of POSH_ACT_STRUCTURE.chapters) {
    for (const section of chapter.sections) {
      const sectionText = await fetchSectionText(section.number);
      const embedding = await generateEmbedding(sectionText);

      await db.insert('legal_sections', {
        document_id: document.id,
        section_number: section.number,
        section_title: section.title,
        section_text: sectionText,
        section_type: 'section',
        keywords: extractKeywords(sectionText),
        embedding,
        metadata: { chapter: chapter.number, chapter_title: chapter.title }
      });
    }
  }

  console.log('PoSH Act ingestion complete');
}

if (process.env.RUN_INGEST === 'true') {
  ingestPoSHAct().catch((error) => {
    console.error('Ingestion error:', error);
    process.exit(1);
  });
}
