import { Request, Response, NextFunction } from 'express';
import { KudosService } from '../services/kudos.service';
import * as yup from 'yup';

const kudosSchema = yup.object({
  from_member: yup.string().email().required(),
  to_member: yup.string().email().required(),
  message: yup.string().required().max(500)
});

export class KudosController {
  private kudosService = new KudosService();

  submit = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await kudosSchema.validate(req.body, { abortEarly: false });
      const result = this.kudosService.createKudos(req.body);

      return res.status(201).json({
        status: 201,
        message: 'success',
        data: {
          id: result.id,
          from_member: result.from_member_name,
          to_member: result.to_member_name,
          message: result.message,
          points: result.points,
          created_at: result.created_at
        }
      });
    } catch (err: any) {
      if (err instanceof yup.ValidationError) {
        return res.status(422).json({
          status: 422,
          message: `VALIDATION_ERROR: ${err.errors.join(', ')}`,
          data: { code: 'VALIDATION_ERROR' }
        });
      }
      
      const statusCode = err.statusCode || 500;
      const errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
      return res.status(statusCode).json({
        status: statusCode,
        message: `${errorCode}: ${err.message}`,
        data: { code: errorCode }
      });
    }
  };

  getLeaderboard = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const leaderboard = this.kudosService.getLeaderboard();

      return res.status(200).json({
        status: 200,
        message: 'success',
        data: { leaderboard }
      });
    } catch (err: any) {
      return res.status(500).json({
        status: 500,
        message: `INTERNAL_SERVER_ERROR: ${err.message}`,
        data: null
      });
    }
  };

  getFeed = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const kudos = this.kudosService.getFeed(limit);

      return res.status(200).json({
        status: 200,
        message: 'success',
        data: {
          kudos: kudos.map(k => ({
            id: k.id,
            from_member: k.from_member_name,
            to_member: k.to_member_name,
            message: k.message,
            points: k.points,
            created_at: k.created_at
          })),
          total: kudos.length
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