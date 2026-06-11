import nodemailer from 'nodemailer';
import { StandupService } from './standup.service';
import { DigestRepository } from '../repositories/digest.repository';
import { DigestLog } from '../types';

export class EmailService {
  private standupService = new StandupService();
  private digestRepo = new DigestRepository();

  private async getTransporter(): Promise<nodemailer.Transporter> {
    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      // Fallback to Ethereal Email test account
      const testAccount = await nodemailer.createTestAccount();
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass }
    });
  }

  private compileHtml(digest: ReturnType<StandupService['getDigest']>): string {
    const date = digest.date;
    const submissions = digest.submissions;
    const pending = digest.pending;

    let submissionsHtml = '';
    if (submissions.length === 0) {
      submissionsHtml = `<p style="color: #666; font-style: italic;">No standups were submitted by 10:00 AM today.</p>`;
    } else {
      submissions.forEach(sub => {
        const blockerStyle = sub.blockers.toLowerCase() !== 'none' && sub.blockers.trim() !== ''
          ? 'border-left: 4px solid #f59e0b; background-color: #fef3c7;'
          : 'border-left: 4px solid #6366f1; background-color: #f3f4f6;';
        
        submissionsHtml += `
          <div style="margin-bottom: 20px; padding: 15px; border-radius: 8px; ${blockerStyle}">
            <h4 style="margin: 0 0 10px 0; color: #1f2937;">${sub.member_name} (${sub.member_email})</h4>
            <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Yesterday:</strong> ${sub.yesterday}</p>
            <p style="margin: 0 0 5px 0; font-size: 14px;"><strong>Today:</strong> ${sub.today}</p>
            <p style="margin: 0; font-size: 14px;"><strong>Blockers:</strong> ${sub.blockers}</p>
            <span style="font-size: 11px; color: #9ca3af; display: block; margin-top: 5px;">Submitted at: ${new Date(sub.submitted_at).toLocaleTimeString()}</span>
          </div>
        `;
      });
    }

    let pendingHtml = '';
    if (pending.length > 0) {
      pendingHtml = `
        <div style="margin-top: 30px; padding: 15px; border: 1px dashed #e5e7eb; border-radius: 8px; background-color: #fafafa;">
          <h4 style="margin: 0 0 10px 0; color: #ef4444;">Awaiting Submission (${pending.length})</h4>
          <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #4b5563;">
            ${pending.map(m => `<li>${m.member_name} (${m.member_email})</li>`).join('')}
          </ul>
        </div>
      `;
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #374151;">
        <h2 style="color: #4f46e5; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px;">Daily Standup Digest - ${date}</h2>
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
          Summary: <strong>${submissions.length}</strong> submitted, <strong>${pending.length}</strong> pending.
        </p>
        ${submissionsHtml}
        ${pendingHtml}
      </div>
    `;
  }

  async sendDigest(date: string, recipientEmail: string, attempt: number = 1): Promise<any> {
    const digest = this.standupService.getDigest(date);
    const htmlContent = this.compileHtml(digest);

    try {
      const transporter = await this.getTransporter();
      const info = await transporter.sendMail({
        from: process.env.SMTP_FROM || '"Daily Standup" <standup@company.com>',
        to: recipientEmail,
        subject: `Daily Standup Digest - ${date}`,
        html: htmlContent
      });

      if (process.env.NODE_ENV !== 'test' && info.messageId && info.envelope) {
        const url = nodemailer.getTestMessageUrl(info);
        if (url) {
          console.log(`[Email Mock] Test Email URL: ${url}`);
        }
      }

      // Log success
      const successLog: DigestLog = {
        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        date,
        attempt_number: attempt,
        outcome: 'SUCCESS',
        error_reason: null,
        sent_at: new Date().toISOString()
      };
      this.digestRepo.create(successLog);

      return {
        date,
        recipient: recipientEmail,
        submissions_included: digest.submitted_count,
        pending_members: digest.pending.map(m => m.member_name),
        sent_at: successLog.sent_at
      };
    } catch (err: any) {
      console.error('[DEBUG sendDigest Error]:', err);
      // Log failure
      const errorLog: DigestLog = {
        id: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
        date,
        attempt_number: attempt,
        outcome: 'FAILED',
        error_reason: err.message || 'Unknown SMTP error',
        sent_at: new Date().toISOString()
      };
      this.digestRepo.create(errorLog);

      // Trigger retry background job if attempts < 3
      if (attempt < 3) {
        console.warn(`SMTP failure on attempt ${attempt}. Scheduling retry in 5 minutes for date ${date}`);
        setTimeout(() => {
          this.sendDigest(date, recipientEmail, attempt + 1).catch(e => {
            console.error(`Retry attempt ${attempt + 1} failed:`, e.message);
          });
        }, 5 * 60 * 1000); // 5 minutes
      }

      const outerErr = new Error(`Failed to dispatch email digest. SMTP error: ${err.message || 'unknown error'}. Digest data preserved for retry.`);
      (outerErr as any).statusCode = 500;
      (outerErr as any).errorCode = 'EMAIL_SEND_FAILED';
      throw outerErr;
    }
  }
}
