import db from './init.js';

/**
 * Generate a unique case code in format KELP-YYYY-NNNN
 * @returns {string} Case code (e.g., KELP-2025-0001)
 */
export function generateCaseCode() {
  const year = new Date().getFullYear();
  const prefix = `KELP-${year}-`;

  // Get the highest case number for the current year
  const stmt = db.prepare(`
    SELECT case_code
    FROM cases
    WHERE case_code LIKE ?
    ORDER BY case_code DESC
    LIMIT 1
  `);

  const result = stmt.get(`${prefix}%`);

  let nextNumber = 1;
  if (result) {
    const currentNumber = parseInt(result.case_code.split('-')[2]);
    nextNumber = currentNumber + 1;
  }

  // Pad with zeros to make it 4 digits
  const paddedNumber = nextNumber.toString().padStart(4, '0');

  return `${prefix}${paddedNumber}`;
}
