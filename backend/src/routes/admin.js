import { Router } from 'express';
import { body } from 'express-validator';
import {
  getAdminStats,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getAdminSponsors,
  createSponsor,
  updateSponsor,
  deleteSponsor,
  getAdminCampaigns,
  createCampaign,
  updateCampaign,
  updateCampaignStatus,
  getAdminActivities,
  decideActivity,
  getAdminRewards,
  decideReward,
  bulkDecideRewards,
  getAdminFraudLogs,
  toggleUserStatus,
  getAdminAuditLogs,
  getAdminUsers
} from '../controllers/adminController.js';
import { authenticate } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/roleGuard.js';
import { validate } from '../middleware/validation.js';

const router = Router();

// Protect ALL admin routes with authentication AND admin role
router.use(authenticate, requireAdmin);

// Overview / Stats
router.get('/stats', getAdminStats);

// Products
router.get('/products', getAdminProducts);
router.post(
  '/products',
  validate([
    body('sponsorId').isMongoId().withMessage('Valid sponsorId is required'),
    body('title').notEmpty().withMessage('Product title is required'),
    body('price').isNumeric().withMessage('Price must be a valid number'),
    body('category').notEmpty().withMessage('Category is required')
  ]),
  createProduct
);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Sponsors
router.get('/sponsors', getAdminSponsors);
router.post(
  '/sponsors',
  validate([
    body('brandName').notEmpty().withMessage('Brand name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('totalBudget').isNumeric().withMessage('Budget must be a number')
  ]),
  createSponsor
);
router.put('/sponsors/:id', updateSponsor);
router.delete('/sponsors/:id', deleteSponsor);

// Campaigns
router.get('/campaigns', getAdminCampaigns);
router.post(
  '/campaigns',
  validate([
    body('sponsorId').isMongoId().withMessage('Valid sponsorId is required'),
    body('title').notEmpty().withMessage('Campaign title is required'),
    body('type').isIn(['AD_VIEW', 'PROMOTE', 'REFERRAL', 'DEAL']).withMessage('Invalid campaign type'),
    body('rewardAmount').isNumeric().withMessage('Reward amount must be a number'),
    body('totalBudget').isNumeric().withMessage('Total budget must be a number')
  ]),
  createCampaign
);
router.put('/campaigns/:id', updateCampaign);
router.patch('/campaigns/:id/status', updateCampaignStatus);

// Activity verification queue
router.get('/activities', getAdminActivities);
router.patch(
  '/activities/:id/decision',
  validate([
    body('decision').isIn(['approved', 'rejected']).withMessage('Decision must be approved or rejected'),
    body('reason').notEmpty().withMessage('A decision reason is required')
  ]),
  decideActivity
);

// Reward management
router.get('/rewards', getAdminRewards);
router.patch(
  '/rewards/:id/decision',
  validate([
    body('decision').isIn(['approved', 'rejected']).withMessage('Decision must be approved or rejected'),
    body('reason').notEmpty().withMessage('A decision reason is required')
  ]),
  decideReward
);
router.post('/rewards/bulk-decision', bulkDecideRewards);

// Fraud & security
router.get('/fraud', getAdminFraudLogs);
router.patch('/users/:id/status', toggleUserStatus);

// Audit logs
router.get('/audit', getAdminAuditLogs);

// Users list
router.get('/users', getAdminUsers);

export default router;
