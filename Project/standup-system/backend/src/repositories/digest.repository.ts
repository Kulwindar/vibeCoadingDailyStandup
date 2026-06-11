import { db } from '../config/db';
import { DigestLog } from '../types';

export class DigestRepository {
  create(log: DigestLog): void {
    const stmt = db.prepare(`
      INSERT INTO digest_logs (id, date, attempt_number, outcome, error_reason, sent_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      log.id,
      log.date,
      log.attempt_number,
      log.outcome,
      log.error_reason,
      log.sent_at
    );
  }

  getByDate(date: string): DigestLog[] {
    const stmt = db.prepare(`
      SELECT * FROM digest_logs WHERE date = ? ORDER BY attempt_number ASC
    `);
    return stmt.all(date) as DigestLog[];
  }

  hasSucceededForDate(date: string): boolean {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM digest_logs WHERE date = ? AND outcome = 'SUCCESS'
    `);
    const res = stmt.get(date) as { count: number };
    return res.count > 0;
  }

  getLatestAttemptNumber(date: string): number {
    const stmt = db.prepare(`
      SELECT MAX(attempt_number) as max_attempt FROM digest_logs WHERE date = ?
    `);
    const res = stmt.get(date) as { max_attempt: number | null };
    return res.max_attempt ?? 0;
  }

  deleteAll(): void {
    db.prepare('DELETE FROM digest_logs').run();
  }
}
