import { Router } from 'express';
import { body } from 'express-validator';
import { startAdView, recordHeartbeat, endAdView, getDailyStats } from '../controllers/adViewController.js';
import { authenticate } from '../middleware/auth.js';
import { adViewLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.use(authenticate);

router.get('/daily-stats', getDailyStats);

router.post(
  '/start',
  adViewLimiter,
  validate([
    body('campaignId').isMongoId().withMessage('Valid campaignId is required'),
    body('videoDurationSec').isNumeric().withMessage('Video duration must be a number')
  ]),
  startAdView
);

router.post(
  '/:id/heartbeat',
  validate([
    body('currentTime').isNumeric().withMessage('currentTime must be a number'),
    body('cumulativePlayedSeconds').isNumeric().withMessage('cumulativePlayedSeconds must be a number')
  ]),
  recordHeartbeat
);

router.post(
  '/:id/end',
  endAdView
);

export default router;
