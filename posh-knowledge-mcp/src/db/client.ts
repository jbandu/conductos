import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

export const db = {
  query: (text: string, params?: any[]) => pool.query(text, params)
};
