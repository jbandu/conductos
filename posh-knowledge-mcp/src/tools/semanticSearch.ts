import { db } from '../db/client.js';
import { generateEmbedding } from '../utils/embeddings.js';

export async function semanticSearch(query: string, sources?: string[], maxResults: number = 5) {
  const embedding = await generateEmbedding(query);
  const searchSources = sources && sources.length > 0 ? sources : ['act', 'rules', 'case_law', 'playbooks'];
  const results: Record<string, any[]> = {};

  for (const source of searchSources) {
    switch (source) {
      case 'act':
      case 'rules': {
        const rows = await db.query(
          `SELECT ls.section_number AS identifier, ls.section_title AS title, ls.section_text AS content, ld.citation AS source,
                  1 - (ls.embedding <=> $1::vector) AS similarity
           FROM legal_sections ls
           JOIN legal_documents ld ON ld.id = ls.document_id
           WHERE ld.document_type = $2
           ORDER BY ls.embedding <=> $1::vector
           LIMIT $3`,
          [JSON.stringify(embedding), source === 'act' ? 'act' : 'rules', maxResults]
        );
        results[source] = rows.rows;
        break;
      }
      case 'case_law': {
        const rows = await db.query(
          `SELECT citation AS identifier, case_name AS title, ratio_decidendi AS content, court AS source,
                  1 - (embedding <=> $1::vector) AS similarity
           FROM case_law
           ORDER BY embedding <=> $1::vector
           LIMIT $2`,
          [JSON.stringify(embedding), maxResults]
        );
        results[source] = rows.rows;
        break;
      }
      case 'playbooks': {
        const rows = await db.query(
          `SELECT id::text AS identifier, title, recommended_approach AS content, category AS source,
                  1 - (embedding <=> $1::vector) AS similarity
           FROM playbooks
           ORDER BY embedding <=> $1::vector
           LIMIT $2`,
          [JSON.stringify(embedding), maxResults]
        );
        results[source] = rows.rows;
        break;
      }
      default:
        break;
    }
  }

  return { query, results, total_results: Object.values(results).flat().length };
}
