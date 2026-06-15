import { Router } from 'express';
import { StandupController } from '../controllers/standup.controller';
import { BlockerController } from '../controllers/blocker.controller';
import { AnalyticsController } from '../controllers/analytics.controller';
import { KudosController } from '../controllers/kudos.controller';
import { ArchiveController } from '../controllers/archive.controller';
import { SlackController } from '../controllers/slack.controller';

const router = Router();
const standupController = new StandupController();
const blockerController = new BlockerController();
const analyticsController = new AnalyticsController();
const kudosController = new KudosController();
const archiveController = new ArchiveController();
const slackController = new SlackController();

// V1 routes
router.post('/standups', standupController.submit);
router.get('/standups', standupController.getDigest);
router.get('/standups/members', standupController.getMembers);
router.post('/digest/send', standupController.sendDigest);
router.get('/digest/status', standupController.getDigestStatus);

// V2 routes - Slack
router.post('/slack/events', slackController.handleSlackEvents);

// V2 routes - Blockers
router.post('/blockers/analyze', blockerController.analyze);
router.get('/blockers', blockerController.getBlockers);

// V2 routes - Analytics
router.get('/analytics/sprint', analyticsController.getSprintAnalytics);

// V2 routes - Kudos
router.post('/kudos', kudosController.submit);
router.get('/kudos/leaderboard', kudosController.getLeaderboard);
router.get('/kudos/feed', kudosController.getFeed);

// V2 routes - Archive
router.get('/archive/search', archiveController.search);
router.get('/archive/export', archiveController.exportData);

// Dev-only route - clear all data
router.post('/dev/clear-all', standupController.clearAllData);

export default router;
