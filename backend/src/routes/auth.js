import { Router } from 'express';
import { body } from 'express-validator';
import { register, login, getMe } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.post(
  '/register',
  authLimiter,
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email address is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
  ]),
  register
);

router.post(
  '/login',
  authLimiter,
  validate([
    body('email').isEmail().withMessage('A valid email address is required'),
    body('password').notEmpty().withMessage('Password is required')
  ]),
  login
);

router.get('/me', authenticate, getMe);

export default router;
