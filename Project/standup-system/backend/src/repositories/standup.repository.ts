import { db } from '../config/db';
import { Standup } from '../types';

export class StandupRepository {
  create(standup: Standup): void {
    const stmt = db.prepare(`
      INSERT INTO standups (id, member_name, member_email, yesterday, today, blockers, submitted_at, date, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      standup.id,
      standup.member_name,
      standup.member_email,
      standup.yesterday,
      standup.today,
      standup.blockers,
      standup.submitted_at,
      standup.date,
      'web'
    );
  }

  createWithSource(standup: {
    id: string;
    member_name: string;
    member_email: string;
    yesterday: string;
    today: string;
    blockers: string;
    submitted_at: string;
    date: string;
    source: string;
  }): void {
    const stmt = db.prepare(`
      INSERT INTO standups (id, member_name, member_email, yesterday, today, blockers, submitted_at, date, source)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      standup.id,
      standup.member_name,
      standup.member_email,
      standup.yesterday,
      standup.today,
      standup.blockers,
      standup.submitted_at,
      standup.date,
      standup.source
    );
  }

  getByEmailAndDate(email: string, date: string): Standup | undefined {
    const stmt = db.prepare(`
      SELECT * FROM standups WHERE member_email = ? AND date = ?
    `);
    return stmt.get(email, date) as Standup | undefined;
  }

  getByDate(date: string): Standup[] {
    const stmt = db.prepare(`
      SELECT * FROM standups WHERE date = ? ORDER BY submitted_at ASC
    `);
    return stmt.all(date) as Standup[];
  }

  deleteAll(): void {
    db.prepare('DELETE FROM standups').run();
  }
}
