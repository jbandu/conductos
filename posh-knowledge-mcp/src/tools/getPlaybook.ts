import { db } from '../db/client.js';
import { generateEmbedding } from '../utils/embeddings.js';

export async function getPlaybookGuidance(scenario: string, category?: string, maxResults: number = 3) {
  const embedding = await generateEmbedding(scenario);
  const params: any[] = [JSON.stringify(embedding)];
  let sql = `SELECT title, category, scenario, recommended_approach, do_list, dont_list, legal_references, difficulty_level,
                    1 - (embedding <=> $1::vector) AS similarity
             FROM playbooks WHERE 1=1`;
  if (category) {
    params.push(category);
    sql += ` AND category = $${params.length}`;
  }
  params.push(maxResults);
  sql += ` ORDER BY similarity DESC LIMIT $${params.length}`;
  const rows = await db.query(sql, params);
  return { found: rows.rows.length > 0, guidance: rows.rows, source: 'KelpHR Best Practices' };
}
