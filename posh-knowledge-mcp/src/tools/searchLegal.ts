import { db } from '../db/client.js';
import { generateEmbedding } from '../utils/embeddings.js';

export async function searchLegalProvisions(documentType: 'act' | 'rules', query: string, sectionNumber?: string) {
  if (sectionNumber) {
    const exact = await db.query(
      `SELECT ls.section_number, ls.section_title, ls.section_text, ld.citation
       FROM legal_sections ls
       JOIN legal_documents ld ON ls.document_id = ld.id
       WHERE ld.document_type = $1 AND ls.section_number = $2`,
      [documentType, sectionNumber]
    );
    if (exact.rows.length > 0) {
      return { found: true, sections: exact.rows };
    }
  }

  const embedding = await generateEmbedding(query);
  const semantic = await db.query(
    `SELECT ls.section_number, ls.section_title, ls.section_text, ld.citation, 1 - (ls.embedding <=> $1::vector) AS similarity
     FROM legal_sections ls
     JOIN legal_documents ld ON ls.document_id = ld.id
     WHERE ld.document_type = $2
     ORDER BY ls.embedding <=> $1::vector
     LIMIT 5`,
    [JSON.stringify(embedding), documentType]
  );

  return {
    found: semantic.rows.length > 0,
    source: documentType === 'act' ? 'PoSH Act, 2013' : 'PoSH Rules, 2013',
    sections: semantic.rows
  };
}
