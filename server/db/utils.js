/**
 * Generate a unique case code in format KELP-YYYY-NNNN
 * @param {Pool} pool - PostgreSQL connection pool
 * @returns {Promise<string>} Case code (e.g., KELP-2025-0001)
 */
export async function generateCaseCode(pool) {
  const year = new Date().getFullYear();
  const prefix = `KELP-${year}-`;

  // Get the highest case number for the current year
  const result = await pool.query(
    `SELECT case_code
     FROM cases
     WHERE case_code LIKE $1
     ORDER BY case_code DESC
     LIMIT 1`,
    [`${prefix}%`]
  );

  let nextNumber = 1;
  if (result.rows.length > 0) {
    const currentNumber = parseInt(result.rows[0].case_code.split('-')[2]);
    nextNumber = currentNumber + 1;
  }

  // Pad with zeros to make it 4 digits
  const paddedNumber = nextNumber.toString().padStart(4, '0');

  return `${prefix}${paddedNumber}`;
}
