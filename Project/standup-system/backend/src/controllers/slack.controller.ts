import { Request, Response, NextFunction } from 'express';
import { StandupService } from '../services/standup.service';
import * as crypto from 'crypto';

export class SlackController {
  private standupService = new StandupService();

  private verifySlackSignature(req: Request): boolean {
    const signingSecret = process.env.SLACK_SIGNING_SECRET;
    if (!signingSecret) return true;

    const signature = req.headers['x-slack-signature'] as string;
    const timestamp = req.headers['x-slack-request-timestamp'] as string;
    
    const currentTime = Math.floor(Date.now() / 1000);
    if (Math.abs(currentTime - parseInt(timestamp)) > 300) {
      return false;
    }

    const payload = JSON.stringify(req.body);
    const baseString = `v0:${timestamp}:${payload}`;
    const hmac = crypto.createHmac('sha256', signingSecret).update(baseString).digest('hex');
    const expectedSignature = `v0=${hmac}`;

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  }

  handleSlackEvents = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!this.verifySlackSignature(req)) {
        return res.status(401).json({ status: 'error', message: 'Invalid Slack signature' });
      }

      const { type, user, view } = req.body;

      if (type === 'view_submission' && view) {
        const stateValues = view.state?.values || {};
        const values = Object.values(stateValues)[0] as any;
        
        const yesterday = values?.yesterday?.value || '';
        const today = values?.today?.value || '';
        const blockers = values?.blockers?.value || '';

        const standup = this.standupService.submitFromSlack({
          slack_user_id: user.id,
          slack_user_email: user.email,
          slack_user_real_name: user.real_name || user.name,
          yesterday,
          today,
          blockers
        });

        return res.status(200).json({
          status: 'success',
          data: {
            standup_id: standup.id,
            member_name: standup.member_name,
            source: 'slack'
          }
        });
      }

      return res.status(200).json({ status: 'success', data: {} });
    } catch (err: any) {
      const statusCode = err.statusCode || 500;
      const errorCode = err.errorCode || 'SLACK_ERROR';
      return res.status(statusCode).json({
        status: statusCode,
        code: errorCode,
        message: err.message || 'Slack operation failed'
      });
    }
  };

  handleSlashCommand = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!this.verifySlackSignature(req)) {
        return res.status(401).send('Unauthorized');
      }

      const triggerId = req.body.trigger_id;
      
      return res.status(200).json({
        response_type: 'ephemeral',
        text: 'Opening standup modal...',
        trigger_id: triggerId
      });
    } catch (err: any) {
      return res.status(500).send('Error processing slash command');
    }
  };
}