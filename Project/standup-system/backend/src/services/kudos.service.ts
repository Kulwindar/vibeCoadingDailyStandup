import { KudosRepository } from '../repositories/kudos.repository';
import { Kudos } from '../types';
import members from '../config/members.json';
import { db } from '../config/db';

export class KudosService {
  private kudosRepo = new KudosRepository();

  private getLocalDateString(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  createKudos(payload: {
    from_member: string;
    to_member: string;
    message: string;
  }): Kudos {
    const today = this.getLocalDateString();

    const giver = members.find(m => m.email.toLowerCase() === payload.from_member.toLowerCase());
    const recipient = members.find(m => m.email.toLowerCase() === payload.to_member.toLowerCase());

    if (!giver) {
      const err = new Error('Sender not found in team member list.');
      (err as any).statusCode = 404;
      (err as any).errorCode = 'MEMBER_NOT_FOUND';
      throw err;
    }

    if (!recipient) {
      const err = new Error('Recipient not found in team member list.');
      (err as any).statusCode = 404;
      (err as any).errorCode = 'MEMBER_NOT_FOUND';
      throw err;
    }

    const countToday = this.kudosRepo.getKudosCountByGiverToday(payload.from_member, today);
    if (countToday >= 5) {
      const err = new Error('Maximum kudos limit reached for today (5 per giver).');
      (err as any).statusCode = 429;
      (err as any).errorCode = 'KUDOS_LIMIT_EXCEEDED';
      throw err;
    }

    const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const kudos: Kudos = {
      id: uuid,
      from_member: payload.from_member,
      from_member_name: giver.name,
      to_member: payload.to_member,
      to_member_name: recipient.name,
      message: payload.message.trim(),
      points: 10,
      created_at: new Date().toISOString()
    };

    this.kudosRepo.create(kudos);
    return kudos;
  }

  getFeed(limit: number = 20): Kudos[] {
    return this.kudosRepo.getAll(limit);
  }

  getLeaderboard(): { name: string; email: string; points: number; count: number }[] {
    return this.kudosRepo.getLeaderboard();
  }

  decayPoints(): void {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const cutoffDate = thirtyDaysAgo.toISOString();

    const stmt = db.prepare(`
      SELECT id, points FROM kudos WHERE created_at < ? AND points = 10
    `);
    const oldKudos = stmt.all(cutoffDate) as { id: string; points: number }[];

    const updateStmt = db.prepare(`
      UPDATE kudos SET points = 5 WHERE id = ?
    `);

    oldKudos.forEach(k => {
      updateStmt.run(k.id);
    });
  }
}