import { Request, Response, NextFunction } from 'express';
import { StandupService } from '../services/standup.service';
import { EmailService } from '../services/email.service';
import { DigestRepository } from '../repositories/digest.repository';
import { StandupRepository } from '../repositories/standup.repository';
import { standupSchema, digestSendSchema } from '../validations/standup.validation';
import * as yup from 'yup';

export class StandupController {
  private standupService = new StandupService();
  private emailService = new EmailService();
  private digestRepo = new DigestRepository();

  submit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await standupSchema.validate(req.body, { abortEarly: false });
      const result = this.standupService.submitStandup(req.body);
      
      return res.status(201).json({
        status: 201,
        message: 'success',
        data: result
      });
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        return res.status(422).json({
          status: 422,
          message: `VALIDATION_ERROR: ${err.errors.join(', ')}`,
          data: {
            code: 'VALIDATION_ERROR',
            errors: err.inner.map(e => ({ path: e.path, message: e.message }))
          }
        });
      }
      
      const statusCode = err.statusCode || 500;
      const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
      return res.status(statusCode).json({
        status: statusCode,
        message: `${errorCode}: ${err.message}`,
        data: {
          code: errorCode,
          detail: err.message
        }
      });
    }
  };

  getDigest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateVal = req.query.date as string | undefined;
      
      if (dateVal) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
          return res.status(400).json({
            status: 400,
            message: 'INVALID_DATE_FORMAT: Date must be in YYYY-MM-DD format (e.g., 2026-06-10).',
            data: {
              code: 'INVALID_DATE_FORMAT'
            }
          });
        }
      }

      const result = this.standupService.getDigest(dateVal);
      return res.status(200).json({
        status: 200,
        message: 'success',
        data: result
      });
    } catch (err: any) {
      return res.status(500).json({
        status: 500,
        message: `INTERNAL_SERVER_ERROR: ${err.message}`,
        data: null
      });
    }
  };

  getMembers = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateVal = req.query.date as string | undefined;
      const result = this.standupService.getMembers(dateVal);
      return res.status(200).json({
        status: 200,
        message: 'success',
        data: result
      });
    } catch (err: any) {
      return res.status(500).json({
        status: 500,
        message: `INTERNAL_SERVER_ERROR: ${err.message}`,
        data: null
      });
    }
  };

  sendDigest = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await digestSendSchema.validate(req.body, { abortEarly: false });
      const { date, recipient_email } = req.body;
      const result = await this.emailService.sendDigest(date, recipient_email);
      
      return res.status(200).json({
        status: 200,
        message: 'success',
        data: result
      });
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        return res.status(422).json({
          status: 422,
          message: `VALIDATION_ERROR: ${err.errors.join(', ')}`,
          data: {
            code: 'VALIDATION_ERROR',
            errors: err.inner.map(e => ({ path: e.path, message: e.message }))
          }
        });
      }

      const statusCode = err.statusCode || 500;
      const errorCode = err.errorCode || 'EMAIL_SEND_FAILED';
      return res.status(statusCode).json({
        status: statusCode,
        message: `${errorCode}: ${err.message}`,
        data: {
          code: errorCode,
          detail: err.message
        }
      });
    }
  };

  getDigestStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dateVal = req.query.date as string;
      if (!dateVal || !/^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
        return res.status(400).json({
          status: 400,
          message: 'INVALID_DATE_FORMAT: Date must be in YYYY-MM-DD format (e.g., 2026-06-10).',
          data: {
            code: 'INVALID_DATE_FORMAT'
          }
        });
      }

      const logs = this.digestRepo.getByDate(dateVal);
      const isSent = this.digestRepo.hasSucceededForDate(dateVal);
      const latestSuccess = logs.find(l => l.outcome === 'SUCCESS');

      return res.status(200).json({
        status: 200,
        message: 'success',
        data: {
          date: dateVal,
          digest_sent: isSent,
          sent_at: latestSuccess ? latestSuccess.sent_at : null,
          recipient: process.env.MANAGER_EMAIL || 'manager@company.com',
          submissions_included: this.standupService.getDigest(dateVal).submitted_count
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

  clearAllData = async (req: Request, res: Response, next: NextFunction) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        status: 403,
        message: 'CLEAR_DATA_FORBIDDEN: This endpoint is disabled in production.',
        data: { code: 'CLEAR_DATA_FORBIDDEN' }
      });
    }

    try {
      const standupRepo = new StandupRepository();
      standupRepo.clearAll();
      return res.status(200).json({
        status: 200,
        message: 'success',
        data: { cleared: true, tables: ['standups', 'digest_logs', 'blocker_predictions', 'kudos', 'kudos_decay_log'] }
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
