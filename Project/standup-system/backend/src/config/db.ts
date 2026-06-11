import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.NODE_ENV === 'test' 
  ? ':memory:' 
  : path.join(__dirname, '../../database.sqlite');

if (process.env.NODE_ENV !== 'test') {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS standups (
    id TEXT PRIMARY KEY,
    member_name TEXT NOT NULL,
    member_email TEXT NOT NULL,
    yesterday TEXT NOT NULL,
    today TEXT NOT NULL,
    blockers TEXT NOT NULL,
    submitted_at TEXT NOT NULL,
    date TEXT NOT NULL,
    UNIQUE(member_email, date)
  );
  
  CREATE TABLE IF NOT EXISTS digest_logs (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    attempt_number INTEGER NOT NULL,
    outcome TEXT NOT NULL,
    error_reason TEXT,
    sent_at TEXT NOT NULL
  );
`);
