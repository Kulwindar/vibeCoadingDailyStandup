import { Router } from 'express';
import { StandupController } from '../controllers/standup.controller';

const router = Router();
const controller = new StandupController();

router.post('/standups', controller.submit);
router.get('/standups', controller.getDigest);
router.get('/standups/members', controller.getMembers);
router.post('/digest/send', controller.sendDigest);
router.get('/digest/status', controller.getDigestStatus);

export default router;
