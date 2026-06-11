process.env.NODE_ENV = 'test';

jest.mock('nodemailer', () => {
  const mockNodemailer = {
    createTestAccount: jest.fn().mockResolvedValue({
      user: 'mock-user',
      pass: 'mock-pass'
    }),
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({
        messageId: 'mock-message-id',
        envelope: {
          from: 'standup@company.com',
          to: ['manager@company.com']
        }
      })
    })
  };
  return {
    __esModule: true,
    default: mockNodemailer,
    ...mockNodemailer
  };
});

import request from 'supertest';
import app from '../app';
import { StandupRepository } from '../repositories/standup.repository';
import { DigestRepository } from '../repositories/digest.repository';

const standupRepo = new StandupRepository();
const digestRepo = new DigestRepository();

describe('Daily Standup System - API Endpoints', () => {
  beforeEach(() => {
    standupRepo.deleteAll();
    digestRepo.deleteAll();
  });

  describe('POST /api/v1/standups', () => {
    it('should submit daily standup successfully for configured member', async () => {
      const res = await request(app)
        .post('/api/v1/standups')
        .send({
          member_name: 'Priya Sharma',
          member_email: 'priya@company.com',
          yesterday: 'Completed task A',
          today: 'Working on task B',
          blockers: 'None'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe(201);
      expect(res.body.message).toBe('success');
      expect(res.body.data.member_name).toBe('Priya Sharma');
      expect(res.body.data.member_email).toBe('priya@company.com');
      expect(res.body.data.yesterday).toBe('Completed task A');
      expect(res.body.data.date).toBeDefined();
    });

    it('should reject duplicate submission on the same day', async () => {
      // First submission
      await request(app)
        .post('/api/v1/standups')
        .send({
          member_name: 'Priya Sharma',
          member_email: 'priya@company.com',
          yesterday: 'Completed task A',
          today: 'Working on task B',
          blockers: 'None'
        });

      // Second submission
      const res = await request(app)
        .post('/api/v1/standups')
        .send({
          member_name: 'Priya Sharma',
          member_email: 'priya@company.com',
          yesterday: 'Another yesterday text',
          today: 'Another today text',
          blockers: 'None'
        });

      expect(res.status).toBe(409);
      expect(res.body.status).toBe(409);
      expect(res.body.data.code).toBe('DUPLICATE_SUBMISSION');
    });

    it('should reject submission with missing or empty fields', async () => {
      const res = await request(app)
        .post('/api/v1/standups')
        .send({
          member_name: 'Priya Sharma',
          member_email: 'priya@company.com',
          yesterday: '',
          today: '   ',
          blockers: 'None'
        });

      expect(res.status).toBe(422);
      expect(res.body.status).toBe(422);
      expect(res.body.data.code).toBe('VALIDATION_ERROR');
    });

    it('should reject submission from unconfigured email', async () => {
      const res = await request(app)
        .post('/api/v1/standups')
        .send({
          member_name: 'Unknown User',
          member_email: 'unknown@company.com',
          yesterday: 'Done',
          today: 'Do',
          blockers: 'None'
        });

      expect(res.status).toBe(404);
      expect(res.body.status).toBe(404);
      expect(res.body.data.code).toBe('MEMBER_NOT_FOUND');
    });
  });

  describe('GET /api/v1/standups/members', () => {
    it('should retrieve list of configured members and their submission status', async () => {
      // Priya Sharma submits
      await request(app)
        .post('/api/v1/standups')
        .send({
          member_name: 'Priya Sharma',
          member_email: 'priya@company.com',
          yesterday: 'Completed task A',
          today: 'Working on task B',
          blockers: 'None'
        });

      const res = await request(app).get('/api/v1/standups/members');
      expect(res.status).toBe(200);
      expect(res.body.data.members).toHaveLength(3);
      
      const priya = res.body.data.members.find((m: any) => m.name === 'Priya Sharma');
      const arjun = res.body.data.members.find((m: any) => m.name === 'Arjun Mehta');
      
      expect(priya.submitted).toBe(true);
      expect(priya.submitted_at).toBeDefined();
      expect(arjun.submitted).toBe(false);
      expect(arjun.submitted_at).toBeNull();
    });
  });

  describe('GET /api/v1/standups', () => {
    it('should retrieve daily digest overview of submissions and pending roster', async () => {
      // Priya Sharma submits
      await request(app)
        .post('/api/v1/standups')
        .send({
          member_name: 'Priya Sharma',
          member_email: 'priya@company.com',
          yesterday: 'Completed task A',
          today: 'Working on task B',
          blockers: 'None'
        });

      const res = await request(app).get('/api/v1/standups');
      expect(res.status).toBe(200);
      expect(res.body.data.submitted_count).toBe(1);
      expect(res.body.data.pending_count).toBe(2);
      expect(res.body.data.submissions[0].member_name).toBe('Priya Sharma');
      expect(res.body.data.pending).toHaveLength(2);
    });

    it('should reject invalid date query format', async () => {
      const res = await request(app).get('/api/v1/standups?date=12-31-2026');
      expect(res.status).toBe(400);
      expect(res.body.data.code).toBe('INVALID_DATE_FORMAT');
    });
  });

  describe('POST /api/v1/digest/send', () => {
    it('should compile and send email digest', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .post('/api/v1/digest/send')
        .send({
          date: today,
          recipient_email: 'manager@company.com'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.recipient).toBe('manager@company.com');
      expect(res.body.data.submissions_included).toBe(0);
      expect(res.body.data.sent_at).toBeDefined();
    });
  });

  describe('GET /api/v1/digest/status', () => {
    it('should return digest sent status', async () => {
      const today = new Date().toISOString().split('T')[0];
      // Send first
      await request(app)
        .post('/api/v1/digest/send')
        .send({
          date: today,
          recipient_email: 'manager@company.com'
        });

      const res = await request(app).get(`/api/v1/digest/status?date=${today}`);
      expect(res.status).toBe(200);
      expect(res.body.data.digest_sent).toBe(true);
      expect(res.body.data.recipient).toBeDefined();
    });
  });
});
