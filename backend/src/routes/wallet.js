import { Router } from 'express';
import { body } from 'express-validator';
import { getWalletSummary, getTransactions, withdrawFunds } from '../controllers/walletController.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.use(authenticate);

router.get('/', getWalletSummary);
router.get('/transactions', getTransactions);
router.post(
  '/withdraw',
  validate([
    body('amount').isNumeric().withMessage('Amount must be a positive number'),
    body('paymentMethod').notEmpty().withMessage('Payment method is required')
  ]),
  withdrawFunds
);

export default router;
