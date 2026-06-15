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
    source TEXT DEFAULT 'web',
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

  CREATE TABLE IF NOT EXISTS blocker_predictions (
    id TEXT PRIMARY KEY,
    standup_id TEXT NOT NULL,
    member_name TEXT NOT NULL,
    member_email TEXT NOT NULL,
    blockers TEXT NOT NULL,
    severity TEXT NOT NULL,
    confidence REAL NOT NULL,
    analysis TEXT,
    analyzed_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS kudos (
    id TEXT PRIMARY KEY,
    from_member TEXT NOT NULL,
    from_member_name TEXT NOT NULL,
    to_member TEXT NOT NULL,
    to_member_name TEXT NOT NULL,
    message TEXT NOT NULL,
    points INTEGER DEFAULT 10,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS kudos_decay_log (
    id TEXT PRIMARY KEY,
    kudos_id TEXT NOT NULL,
    original_points INTEGER NOT NULL,
    decayed_points INTEGER NOT NULL,
    decayed_at TEXT NOT NULL
  );

  CREATE VIRTUAL TABLE IF NOT EXISTS standups_fts USING fts5(
    member_name, member_email, yesterday, today, blockers, date, content='standups', content_rowid='rowid'
  );

  CREATE TRIGGER IF NOT EXISTS standups_ai AFTER INSERT ON standups BEGIN
    INSERT INTO standups_fts(rowid, member_name, member_email, yesterday, today, blockers, date)
    VALUES (new.rowid, new.member_name, new.member_email, new.yesterday, new.today, new.blockers, new.date);
  END;

  CREATE TRIGGER IF NOT EXISTS standups_ad AFTER DELETE ON standups BEGIN
    INSERT INTO standups_fts(standups_fts, rowid, member_name, member_email, yesterday, today, blockers, date)
    VALUES ('delete', old.rowid, old.member_name, old.member_email, old.yesterday, old.today, old.blockers, old.date);
  END;
`);

// Migration: Add source column if it doesn't exist (for existing DBs)
const hasSourceColumn = db.prepare("PRAGMA table_info(standups)").all();
const sourceColExists = hasSourceColumn.some((col: any) => col.name === 'source');
if (!sourceColExists) {
  db.exec('ALTER TABLE standups ADD COLUMN source TEXT DEFAULT "web"');
}
