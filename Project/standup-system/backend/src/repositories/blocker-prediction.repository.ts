import { db } from '../config/db';
import { BlockerPrediction } from '../types';

export class BlockerPredictionRepository {
  create(prediction: BlockerPrediction): void {
    const stmt = db.prepare(`
      INSERT INTO blocker_predictions (id, standup_id, member_name, member_email, blockers, severity, confidence, analysis, analyzed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      prediction.id,
      prediction.standup_id,
      prediction.member_name,
      prediction.member_email,
      prediction.blockers,
      prediction.severity,
      prediction.confidence,
      prediction.analysis,
      prediction.analyzed_at
    );
  }

  getByDate(date: string, severity?: string): BlockerPrediction[] {
    const query = `
      SELECT * FROM blocker_predictions WHERE analyzed_at LIKE ? || '%'
    `;
    const params: any[] = [`${date}%`];
    const stmt = db.prepare(query);
    return stmt.all(...params) as BlockerPrediction[];
  }

  deleteAll(): void {
    db.prepare('DELETE FROM blocker_predictions').run();
  }
}