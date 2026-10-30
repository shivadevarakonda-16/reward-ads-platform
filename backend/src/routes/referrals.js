import { Router } from 'express';
import { generateReferralLink, getMyReferrals, handleRedirect } from '../controllers/referralController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Public redirect route
router.get('/r/:code', handleRedirect);

// User protected routes
router.post('/generate', authenticate, generateReferralLink);
router.get('/mine', authenticate, getMyReferrals);

export default router;
