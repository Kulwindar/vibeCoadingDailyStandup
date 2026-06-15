import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';

export class AnalyticsController {
  private analyticsService = new AnalyticsService();

  getSprintAnalytics = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const date = req.query.date as string;

      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          status: 400,
          message: 'INVALID_DATE_FORMAT: Date must be in YYYY-MM-DD format.',
          data: { code: 'INVALID_DATE_FORMAT' }
        });
      }

      const analytics = this.analyticsService.getAnalyticsForDate(date);

      return res.status(200).json({
        status: 200,
        message: 'success',
        data: analytics
      });
    } catch (err: any) {
      return res.status(500).json({
        status: 500,
        message: `INTERNAL_SERVER_ERROR: ${err.message}`,
        data: null
      });
    }
  };
}