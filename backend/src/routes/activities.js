import { Router } from 'express';
import { body } from 'express-validator';
import { submitActivity, getMyActivities } from '../controllers/activityController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.use(authenticate);

router.get('/mine', getMyActivities);

router.post(
  '/',
  validate([
    body('campaignId').isMongoId().withMessage('Valid campaignId is required'),
    body('type').isIn(['PROMOTE', 'REFERRAL']).withMessage('Type must be PROMOTE or REFERRAL')
  ]),
  submitActivity
);

export default router;
