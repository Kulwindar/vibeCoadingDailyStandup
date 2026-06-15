import { ArchiveRepository, ArchiveSearchParams } from '../repositories/archive.repository';
import { Standup } from '../types';

export class ArchiveService {
  private archiveRepo = new ArchiveRepository();

  search(params: ArchiveSearchParams): { results: Standup[]; total: number; totalPages: number } {
    if (params.dateFrom && !this.isValidDate(params.dateFrom)) {
      throw new Error('Invalid date_from format. Use YYYY-MM-DD.');
    }
    if (params.dateTo && !this.isValidDate(params.dateTo)) {
      throw new Error('Invalid date_to format. Use YYYY-MM-DD.');
    }

    if (params.dateFrom && params.dateTo) {
      const from = new Date(params.dateFrom);
      const to = new Date(params.dateTo);
      const diffDays = (to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24);
      if (diffDays > 90) {
        throw new Error('Date range exceeds 90 days maximum.');
      }
    }

    return this.archiveRepo.search(params);
  }

  export(dateFrom?: string, dateTo?: string): Standup[] {
    return this.archiveRepo.getAllForExport(dateFrom, dateTo);
  }

  private isValidDate(dateStr: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
  }
}