import { Router } from 'express';
import { getDeals, redeemDeal } from '../controllers/dealController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', getDeals);
router.post('/:id/redeem', authenticate, redeemDeal);

export default router;
