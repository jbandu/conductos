import { db } from '../db/client.js';

export async function getTemplate(templateType: string, caseCode?: string) {
  const template = await db.query(
    `SELECT * FROM templates WHERE template_type = $1 AND is_active = true ORDER BY version DESC LIMIT 1`,
    [templateType]
  );
  return { found: template.rows.length > 0, template: template.rows[0], case_code: caseCode };
}
