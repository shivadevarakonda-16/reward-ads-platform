import { Router } from 'express';
import { getCampaigns, getCampaignById, getReelsFeed } from '../controllers/campaignController.js';

const router = Router();

router.get('/feed', getReelsFeed);
router.get('/', getCampaigns);
router.get('/:id', getCampaignById);

export default router;
