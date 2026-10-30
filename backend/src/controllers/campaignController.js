import { Campaign } from '../models/Campaign.js';
import { Reward } from '../models/Reward.js';
import { AdView } from '../models/AdView.js';
import { Activity } from '../models/Activity.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

// Helper to optionally extract authenticated user without rejecting guest
const getOptionalUser = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET);
      return await User.findById(decoded.id);
    }
  } catch (err) {
    // Ignore invalid/expired token for public feed
  }
  return null;
};

export const getCampaigns = async (req, res, next) => {
  try {
    const { type, status = 'active', category, search, page = 1, limit = 12 } = req.query;
    const query = {};

    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.title = { $regex: search, $options: 'i' };
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    let mongoQuery = Campaign.find(query)
      .populate('sponsorId', 'brandName logoUrl category website')
      .populate('productId', 'title price discountPrice images category availability')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10));

    const [campaigns, total] = await Promise.all([
      mongoQuery,
      Campaign.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: campaigns,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCampaignById = async (req, res, next) => {
  try {
    const campaign = await Campaign.findById(req.params.id)
      .populate('sponsorId', 'brandName logoUrl category website totalBudget spentBudget')
      .populate('productId');

    if (!campaign) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found'
      });
    }

    // Check user's participation if logged in
    const user = await getOptionalUser(req);
    let userProgress = {
      hasEarned: false,
      adViewsCount: 0,
      activitiesSubmitted: 0,
      existingReward: null
    };

    if (user) {
      const [existingReward, adViewsCount, activitiesSubmitted] = await Promise.all([
        Reward.findOne({ userId: user._id, campaignId: campaign._id }),
        AdView.countDocuments({ userId: user._id, campaignId: campaign._id }),
        Activity.countDocuments({ userId: user._id, campaignId: campaign._id })
      ]);

      userProgress = {
        hasEarned: !!(existingReward && existingReward.status === 'approved'),
        existingReward,
        adViewsCount,
        activitiesSubmitted
      };
    }

    res.json({
      success: true,
      campaign,
      userProgress
    });
  } catch (error) {
    next(error);
  }
};

export const getReelsFeed = async (req, res, next) => {
  try {
    const { page = 1, limit = 8, excludeCompleted = 'false' } = req.query;
    const user = await getOptionalUser(req);

    const query = {
      type: 'AD_VIEW',
      status: 'active',
      videoUrl: { $ne: '' },
      $expr: { $lt: ['$spentBudget', '$totalBudget'] }
    };

    let earnedCampaignIds = [];
    if (user) {
      const userRewards = await Reward.find({
        userId: user._id,
        sourceType: 'AD_VIEW'
      }).select('campaignId status');

      earnedCampaignIds = userRewards.map(r => r.campaignId.toString());

      if (excludeCompleted === 'true' && earnedCampaignIds.length > 0) {
        query._id = { $nin: earnedCampaignIds };
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('sponsorId', 'brandName logoUrl category')
        .populate('productId', 'title price discountPrice images')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Campaign.countDocuments(query)
    ]);

    // Attach alreadyEarned flag per campaign for UI ring & badge
    const items = campaigns.map(camp => {
      const obj = camp.toObject();
      obj.alreadyEarned = earnedCampaignIds.includes(camp._id.toString());
      return obj;
    });

    res.json({
      success: true,
      data: items,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        pages: Math.ceil(total / parseInt(limit, 10))
      }
    });
  } catch (error) {
    next(error);
  }
};
