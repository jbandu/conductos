// Simple helper utilities for the knowledge base. These functions are stubs
// to keep the ingestion scripts focused and easy to test.
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

export const db = {
  async insert(table, values) {
    const columns = Object.keys(values);
    const placeholders = columns.map((_, idx) => `$${idx + 1}`);
    const text = `INSERT INTO ${table} (${columns.join(',')}) VALUES (${placeholders.join(',')}) RETURNING *`;
    const result = await pool.query(text, Object.values(values));
    return result.rows[0];
  },
  async query(text, params = []) {
    return pool.query(text, params);
  }
};

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
