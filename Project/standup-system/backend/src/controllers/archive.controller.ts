import { Request, Response, NextFunction } from 'express';
import { ArchiveService } from '../services/archive.service';

export class ArchiveController {
  private archiveService = new ArchiveService();

  search = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q, date_from, date_to, member_email, page, limit } = req.query;

      if (date_from && !/^\d{4}-\d{2}-\d{2}$/.test(date_from as string)) {
        return res.status(400).json({
          status: 400,
          message: 'VALIDATION_ERROR: Invalid date_from format.',
          data: { code: 'INVALID_DATE_FORMAT' }
        });
      }

      if (date_to && !/^\d{4}-\d{2}-\d{2}$/.test(date_to as string)) {
        return res.status(400).json({
          status: 400,
          message: 'VALIDATION_ERROR: Invalid date_to format.',
          data: { code: 'INVALID_DATE_FORMAT' }
        });
      }

      if (date_from && date_to) {
        const from = new Date(date_from as string);
        const to = new Date(date_to as string);
        const msPerDay = 1000 * 60 * 60 * 24;
        const diffDays = Math.ceil((to.getTime() - from.getTime()) / msPerDay);
        if (diffDays > 90) {
          return res.status(400).json({
            status: 400,
            message: 'Date range exceeds 90 days maximum.',
            data: { code: 'DATE_RANGE_EXCEEDED' }
          });
        }
      }

      const result = this.archiveService.search({
        query: q as string,
        dateFrom: date_from as string,
        dateTo: date_to as string,
        memberEmail: member_email as string,
        page: parseInt(page as string) || 1,
        limit: parseInt(limit as string) || 20
      });

      return res.status(200).json({
        status: 200,
        message: 'success',
        data: {
          query: q,
          results: result.results,
          total: result.total,
          page: parseInt(page as string) || 1,
          total_pages: result.totalPages
        }
      });
    } catch (err: any) {
      return res.status(500).json({
        status: 500,
        message: `INTERNAL_SERVER_ERROR: ${err.message}`,
        data: null
      });
    }
  };

  exportData = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { date_from, date_to, format } = req.query;
      const results = this.archiveService.export(
        date_from as string,
        date_to as string
      );

      if (format === 'csv') {
        const csv = this.convertToCSV(results);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=standups-export.csv');
        return res.send(csv);
      }

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename=standups-export.json');
      return res.json(results);
    } catch (err: any) {
      return res.status(500).json({
        status: 500,
        message: `INTERNAL_SERVER_ERROR: ${err.message}`,
        data: null
      });
    }
  };

  private convertToCSV(standups: any[]): string {
    const headers = ['id', 'member_name', 'member_email', 'yesterday', 'today', 'blockers', 'submitted_at', 'date'];
    const rows = standups.map(s => 
      headers.map(h => `"${String(s[h] || '').replace(/"/g, '""')}"`).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
  }
}