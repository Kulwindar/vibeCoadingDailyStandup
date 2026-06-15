import { Request, Response, NextFunction } from 'express';
import { BlockerPredictionService } from '../services/blocker-prediction.service';
import * as yup from 'yup';

const analyzeSchema = yup.object({
  standup_id: yup.string().required(),
  blockers: yup.string().required()
});

export class BlockerController {
  private blockerService = new BlockerPredictionService();

  analyze = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await analyzeSchema.validate(req.body, { abortEarly: false });
      const { blockers } = req.body;

      const prediction = this.blockerService.analyzeBlockers('test-standup-id', blockers, 'Test User', 'test@company.com');

      return res.status(200).json({
        status: 200,
        message: 'success',
        data: {
          standup_id: prediction.standup_id,
          severity: prediction.severity,
          confidence: prediction.confidence,
          analysis: prediction.analysis,
          flagged: prediction.confidence >= 0.7 && prediction.severity !== 'NONE'
        }
      });
    } catch (err: any) {
      console.error('Blocker analyze error:', err);
      if (err instanceof yup.ValidationError) {
        return res.status(422).json({
          status: 422,
          message: `VALIDATION_ERROR: ${err.errors.join(', ')}`,
          data: { code: 'VALIDATION_ERROR' }
        });
      }
      return res.status(500).json({
        status: 500,
        message: `INTERNAL_SERVER_ERROR: ${err.message}`,
        data: null
      });
    }
  };

  getBlockers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const date = req.query.date as string;
      const severity = req.query.severity as string;

      if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({
          status: 400,
          message: 'INVALID_DATE_FORMAT: Date must be in YYYY-MM-DD format.',
          data: { code: 'INVALID_DATE_FORMAT' }
        });
      }

      const predictions = this.blockerService.getByDate(date || new Date().toISOString().split('T')[0], severity || undefined);

      return res.status(200).json({
        status: 200,
        message: 'success',
        data: {
          date: date || new Date().toISOString().split('T')[0],
          blockers: predictions.map(p => ({
            standup_id: p.standup_id,
            member_name: p.member_name,
            member_email: p.member_email,
            severity: p.severity,
            confidence: p.confidence,
            blockers: p.blockers,
            analyzed_at: p.analyzed_at
          }))
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
}