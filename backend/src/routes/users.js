import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

router.get('/me', getProfile);
router.patch('/me', updateProfile);

export default router;
