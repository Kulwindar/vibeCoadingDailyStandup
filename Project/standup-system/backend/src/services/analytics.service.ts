import { StandupRepository } from '../repositories/standup.repository';
import { SprintAnalytics } from '../types';
import { db } from '../config/db';

export class AnalyticsService {
  private standupRepo = new StandupRepository();

  private getSprintBoundaries(date: Date): { start: string; end: string; sprintId: string } {
    const sprintLengthDays = parseInt(process.env.SPRINT_LENGTH_DAYS || '14', 10);
    
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1);
    
    const sprintStart = new Date(startOfWeek);
    const sprintEnd = new Date(startOfWeek);
    sprintEnd.setDate(sprintStart.getDate() + sprintLengthDays - 1);

    const startStr = sprintStart.toISOString().split('T')[0];
    const endStr = sprintEnd.toISOString().split('T')[0];

    return {
      start: startStr,
      end: endStr,
      sprintId: `sprint-${startStr}`
    };
  }

  private getLocalDateString(date = new Date()): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getSprintAnalytics(dateStr: string): SprintAnalytics {
    const date = new Date(dateStr);
    const { start, end, sprintId } = this.getSprintBoundaries(date);

    const stmt = db.prepare(`
      SELECT date, COUNT(*) as count 
      FROM standups 
      WHERE date BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date ASC
    `);
    
    const dailyCounts = stmt.all(start, end) as { date: string; count: number }[];
    const totalSubmissions = dailyCounts.reduce((sum, d) => sum + d.count, 0);

    const teamSize = 3;
    const workingDays = dailyCounts.length;
    
    const velocityScore = workingDays > 0 
      ? Math.round((totalSubmissions / teamSize / workingDays) * 10) / 10 
      : 0;

    return {
      sprint_id: sprintId,
      start_date: start,
      end_date: end,
      velocity_score: velocityScore,
      completed_tasks: totalSubmissions,
      working_days: workingDays,
      team_members: teamSize,
      trend: dailyCounts.map(d => ({
        date: d.date,
        velocity: Math.round((d.count / teamSize) * 10) / 10
      }))
    };
  }

  getAnalyticsForDate(dateStr?: string): SprintAnalytics {
    const targetDate = dateStr || this.getLocalDateString();
    return this.getSprintAnalytics(targetDate);
  }
}