import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import pg from 'pg';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from repo root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set in the environment.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
  const migrationsDir = path.resolve(__dirname, '../db/migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  console.log('Running migrations...');

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    process.stdout.write(`  → ${file}... `);

    try {
      await pool.query(sql);
      console.log('done');
    } catch (error) {
      console.error(`failed (continuing): ${error.message}`);
    }
  }

  console.log('Migrations complete!');
  await pool.end();
}

runMigrations().catch((error) => {
  console.error('Migration runner failed:', error);
  process.exit(1);
});
