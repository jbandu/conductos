import { db } from '../db/client.js';
import { generateEmbedding } from '../utils/embeddings.js';

export async function getCaseLaw(query: string, section?: string, maxResults: number = 3) {
  const embedding = await generateEmbedding(query);
  const params: any[] = [JSON.stringify(embedding)];
  let sql = `SELECT case_name, citation, court, decided_date, facts_summary, issues, holdings, ratio_decidendi, sections_interpreted,
                    1 - (embedding <=> $1::vector) AS similarity
             FROM case_law WHERE 1=1`;
  if (section) {
    params.push(section);
    sql += ` AND $${params.length} = ANY(sections_interpreted)`;
  }
  params.push(maxResults);
  sql += ` ORDER BY similarity DESC LIMIT $${params.length}`;
  const rows = await db.query(sql, params);
  return { found: rows.rows.length > 0, cases: rows.rows };
}
