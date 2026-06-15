import { db } from '../config/db';
import { Standup } from '../types';

export interface ArchiveSearchParams {
  query?: string;
  dateFrom?: string;
  dateTo?: string;
  memberEmail?: string;
  page?: number;
  limit?: number;
}

export class ArchiveRepository {
  search(params: ArchiveSearchParams): { results: Standup[]; total: number; totalPages: number } {
    const { query, dateFrom, dateTo, memberEmail, page = 1, limit = 20 } = params;
    const offset = (page - 1) * limit;

    let searchQuery = 'SELECT * FROM standups WHERE TRUE';
    const queryParams: any[] = [];

    if (query) {
      searchQuery += ' AND (member_name LIKE ? OR member_email LIKE ? OR yesterday LIKE ? OR today LIKE ? OR blockers LIKE ?)';
      queryParams.push(`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`);
    }

    if (dateFrom) {
      searchQuery += ' AND date >= ?';
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      searchQuery += ' AND date <= ?';
      queryParams.push(dateTo);
    }

    if (memberEmail) {
      searchQuery += ' AND member_email = ?';
      queryParams.push(memberEmail);
    }

    searchQuery += ' ORDER BY submitted_at DESC LIMIT ? OFFSET ?';

    const countResult = db.prepare(`SELECT COUNT(*) as total FROM standups`).get() as { total: number };
    const total = countResult.total;
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const stmt = db.prepare(searchQuery);
    const results = stmt.all(...queryParams, limit, offset) as Standup[];

    return { results, total, totalPages };
  }

  getAllForExport(dateFrom?: string, dateTo?: string): Standup[] {
    let query = 'SELECT * FROM standups WHERE 1=1';
    const params: any[] = [];

    if (dateFrom) {
      query += ' AND date >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ' AND date <= ?';
      params.push(dateTo);
    }

    query += ' ORDER BY date DESC, submitted_at ASC';
    const stmt = db.prepare(query);
    return stmt.all(...params) as Standup[];
  }
}