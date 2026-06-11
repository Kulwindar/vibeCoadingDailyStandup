import cron from 'node-cron';
import { EmailService } from '../services/email.service';

const emailService = new EmailService();

const getLocalDateString = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const initCronJobs = (): void => {
  // Fire at 10:00 AM on weekdays (Monday - Friday)
  cron.schedule('0 10 * * 1-5', async () => {
    console.log('[Scheduler] Daily Standup Digest Cron job fired.');
    const todayStr = getLocalDateString();
    const managerEmail = process.env.MANAGER_EMAIL || 'manager@company.com';
    
    try {
      const result = await emailService.sendDigest(todayStr, managerEmail);
      console.log('[Scheduler] Daily Standup Digest email sent successfully:', result);
    } catch (err: any) {
      console.error('[Scheduler] Daily Standup Digest email failed after retries:', err.message);
    }
  });
  console.log('[Scheduler] Cron scheduler initialized.');
};
