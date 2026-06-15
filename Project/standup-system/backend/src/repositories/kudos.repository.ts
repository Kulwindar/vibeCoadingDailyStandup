import { db } from '../config/db';
import { Kudos } from '../types';

export class KudosRepository {
  create(kudos: Kudos): void {
    const stmt = db.prepare(`
      INSERT INTO kudos (id, from_member, from_member_name, to_member, to_member_name, message, points, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      kudos.id,
      kudos.from_member,
      kudos.from_member_name,
      kudos.to_member,
      kudos.to_member_name,
      kudos.message,
      kudos.points,
      kudos.created_at
    );
  }

  getAll(limit: number = 20): Kudos[] {
    const stmt = db.prepare(`
      SELECT * FROM kudos ORDER BY created_at DESC LIMIT ?
    `);
    return stmt.all(limit) as Kudos[];
  }

  getByRecipient(toMemberEmail: string): Kudos[] {
    const stmt = db.prepare(`
      SELECT * FROM kudos WHERE to_member = ? ORDER BY created_at DESC
    `);
    return stmt.all(toMemberEmail) as Kudos[];
  }

  getLeaderboard(): { name: string; email: string; points: number; count: number }[] {
    const stmt = db.prepare(`
      SELECT 
        to_member_name as name,
        to_member as email,
        SUM(points) as points,
        COUNT(*) as count
      FROM kudos
      GROUP BY to_member
      ORDER BY points DESC
    `);
    return stmt.all() as { name: string; email: string; points: number; count: number }[];
  }

  getKudosCountByGiverToday(fromMemberEmail: string, date: string): number {
    const stmt = db.prepare(`
      SELECT COUNT(*) as count FROM kudos 
      WHERE from_member = ? AND date(created_at) = ?
    `);
    const result = stmt.get(fromMemberEmail, date) as { count: number };
    return result.count;
  }

  deleteAll(): void {
    db.prepare('DELETE FROM kudos').run();
    db.prepare('DELETE FROM kudos_decay_log').run();
  }
}