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
import { BlockerPredictionRepository } from '../repositories/blocker-prediction.repository';
import { KudosRepository } from '../repositories/kudos.repository';

const standupRepo = new StandupRepository();
const digestRepo = new DigestRepository();
const blockerPredictionRepo = new BlockerPredictionRepository();
const kudosRepo = new KudosRepository();

describe('Daily Standup System - API Endpoints', () => {
  beforeEach(() => {
    standupRepo.deleteAll();
    digestRepo.deleteAll();
    blockerPredictionRepo.deleteAll();
    kudosRepo.deleteAll();
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

  // V2 Tests - Kudos System
  describe('POST /api/v1/kudos', () => {
    it('should submit kudos successfully', async () => {
      const res = await request(app)
        .post('/api/v1/kudos')
        .send({
          from_member: 'priya@company.com',
          to_member: 'arjun@company.com',
          message: 'Thanks for the help!'
        });

      expect(res.status).toBe(201);
      expect(res.body.data.points).toBe(10);
      expect(res.body.data.from_member).toBe('Priya Sharma');
      expect(res.body.data.to_member).toBe('Arjun Mehta');
    });

    it('should reject kudos from unknown sender', async () => {
      const res = await request(app)
        .post('/api/v1/kudos')
        .send({
          from_member: 'unknown@company.com',
          to_member: 'arjun@company.com',
          message: 'Thanks!'
        });

      expect(res.status).toBe(404);
      expect(res.body.data.code).toBe('MEMBER_NOT_FOUND');
    });

    it('should reject kudos exceeding daily limit', async () => {
      // Submit 5 kudos from Priya to Arjun
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/v1/kudos')
          .send({
            from_member: 'priya@company.com',
            to_member: 'arjun@company.com',
            message: `Thanks ${i + 1}!`
          });
      }

      const res = await request(app)
        .post('/api/v1/kudos')
        .send({
          from_member: 'priya@company.com',
          to_member: 'arjun@company.com',
          message: 'Thanks again!'
        });

      expect(res.status).toBe(429);
      expect(res.body.data.code).toBe('KUDOS_LIMIT_EXCEEDED');
    });
  });

  describe('GET /api/v1/kudos/leaderboard', () => {
    it('should return kudos leaderboard', async () => {
      await request(app)
        .post('/api/v1/kudos')
        .send({
          from_member: 'priya@company.com',
          to_member: 'arjun@company.com',
          message: 'Great work!'
        });

      const res = await request(app).get('/api/v1/kudos/leaderboard');
      expect(res.status).toBe(200);
      expect(res.body.data.leaderboard).toHaveLength(1);
      expect(res.body.data.leaderboard[0].points).toBe(10);
    });
  });

  describe('GET /api/v1/kudos/feed', () => {
    it('should return recent kudos feed', async () => {
      await request(app)
        .post('/api/v1/kudos')
        .send({
          from_member: 'priya@company.com',
          to_member: 'arjun@company.com',
          message: 'Thanks!'
        });

      const res = await request(app).get('/api/v1/kudos/feed');
      expect(res.status).toBe(200);
      expect(res.body.data.kudos).toHaveLength(1);
      expect(res.body.data.total).toBe(1);
    });
  });

  // V2 Tests - Analytics
  describe('GET /api/v1/analytics/sprint', () => {
    it('should return sprint analytics', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app).get(`/api/v1/analytics/sprint?date=${today}`);
      
      expect(res.status).toBe(200);
      expect(res.body.data.velocity_score).toBeDefined();
      expect(res.body.data.trend).toBeInstanceOf(Array);
    });

    it('should reject invalid date format', async () => {
      const res = await request(app).get('/api/v1/analytics/sprint?date=12-31-2026');
      expect(res.status).toBe(400);
      expect(res.body.data.code).toBe('INVALID_DATE_FORMAT');
    });
  });

  // V2 Tests - Archive
  describe('GET /api/v1/archive/search', () => {
    it('should return search results', async () => {
      await request(app)
        .post('/api/v1/standups')
        .send({
          member_name: 'Priya Sharma',
          member_email: 'priya@company.com',
          yesterday: 'Completed API integration',
          today: 'Working on tests',
          blockers: 'None'
        });

      const res = await request(app).get('/api/v1/archive/search?q=API');
      expect(res.status).toBe(200);
      expect(res.body.data.results).toBeInstanceOf(Array);
      expect(res.body.data.total).toBeGreaterThanOrEqual(0);
    });

    it('should reject date range exceeding 90 days', async () => {
      const res = await request(app).get('/api/v1/archive/search?date_from=2026-01-01&date_to=2026-04-30');
      expect(res.status).toBe(400);
      expect(res.body.data.code).toBe('DATE_RANGE_EXCEEDED');
    });
  });

  describe('GET /api/v1/archive/export', () => {
    it('should export standups as CSV', async () => {
      const res = await request(app).get('/api/v1/archive/export?format=csv');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
    });

    it('should export standups as JSON', async () => {
      const res = await request(app).get('/api/v1/archive/export?format=json');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/json');
    });
  });

  // V2 Tests - Blocker Detection
  describe('POST /api/v1/blockers/analyze', () => {
    it('should analyze blockers with severity', async () => {
      const res = await request(app)
        .post('/api/v1/blockers/analyze')
        .send({
          standup_id: 'test-id',
          blockers: 'Waiting on API response from backend team'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.severity).toBeDefined();
      expect(res.body.data.confidence).toBeGreaterThan(0);
    });

    it('should reject low-confidence blockers', async () => {
      const res = await request(app)
        .post('/api/v1/blockers/analyze')
        .send({
          standup_id: 'test-id',
          blockers: 'none'
        });

      expect(res.status).toBe(200);
      expect(res.body.data.severity).toBe('NONE');
      expect(res.body.data.flagged).toBe(false);
    });
  });
});
