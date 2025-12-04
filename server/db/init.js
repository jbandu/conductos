import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, 'conductos.db');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create cases table
db.exec(`
  CREATE TABLE IF NOT EXISTS cases (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_code TEXT UNIQUE NOT NULL,
    status TEXT DEFAULT 'new' CHECK(status IN ('new', 'under_review', 'conciliation', 'investigating', 'decision_pending', 'closed')),
    incident_date DATE NOT NULL,
    description TEXT NOT NULL,
    is_anonymous BOOLEAN DEFAULT FALSE,
    anonymous_alias TEXT,
    contact_method TEXT,
    complainant_name TEXT,
    complainant_email TEXT,
    conciliation_requested BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deadline_date DATE NOT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create status history table
db.exec(`
  CREATE TABLE IF NOT EXISTS status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    case_id INTEGER NOT NULL,
    old_status TEXT,
    new_status TEXT NOT NULL,
    changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    FOREIGN KEY (case_id) REFERENCES cases(id)
  )
`);

console.log('Database initialized successfully');

export default db;
