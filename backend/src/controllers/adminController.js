import { User } from '../models/User.js';
import { Sponsor } from '../models/Sponsor.js';
import { Product } from '../models/Product.js';
import { Campaign } from '../models/Campaign.js';
import { Activity } from '../models/Activity.js';
import { Reward } from '../models/Reward.js';
import { AdView } from '../models/AdView.js';
import { AuditLog } from '../models/AuditLog.js';
import { ReferralLink } from '../models/ReferralLink.js';
import { RewardService } from '../services/rewardService.js';

// ==========================================
// 1. STATS & OVERVIEW
// ==========================================
export const getAdminStats = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeCampaigns,
      pendingActivities,
      pendingRewards,
      sponsorBudgets,
      campaignBudgets,
      rewardsPaidAgg,
      campaignsByTypeAgg,
      topSponsorsAgg
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      Campaign.countDocuments({ status: 'active' }),
      Activity.countDocuments({ status: 'submitted' }),
      Reward.countDocuments({ status: 'pending' }),
      Sponsor.aggregate([
        {
          $group: {
            _id: null,
            totalBudget: { $sum: '$totalBudget' },
            spentBudget: { $sum: '$spentBudget' }
          }
        }
      ]),
      Campaign.aggregate([
        {
          $group: {
            _id: null,
            totalBudget: { $sum: '$totalBudget' },
            spentBudget: { $sum: '$spentBudget' }
          }
        }
      ]),
      Reward.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, totalPaid: { $sum: '$amount' } } }
      ]),
      Campaign.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Sponsor.find().sort({ spentBudget: -1 }).limit(5).select('brandName totalBudget spentBudget category logoUrl')
    ]);

    const totalBudget = campaignBudgets[0]?.totalBudget || 0;
    const spentBudget = campaignBudgets[0]?.spentBudget || 0;
    const totalRewardsPaid = rewardsPaidAgg[0]?.totalPaid || 0;
    const remainingBudget = Math.max(0, totalBudget - spentBudget);

    // 7-day trend of approved rewards
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyRewards = await Reward.aggregate([
      {
        $match: {
          status: 'approved',
          decidedAt: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$decidedAt' } },
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const rewardsPerDay = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const found = dailyRewards.find(r => r._id === dateStr);
      rewardsPerDay.push({
        date: dateStr.slice(5),
        fullDate: dateStr,
        amount: found ? found.amount : 0,
        count: found ? found.count : 0
      });
    }

    res.json({
      success: true,
      kpis: {
        totalUsers,
        activeCampaigns,
        pendingReviews: pendingActivities + pendingRewards,
        totalRewardsPaid,
        totalBudget,
        spentBudget,
        remainingBudget
      },
      charts: {
        rewardsPerDay,
        campaignsByType: campaignsByTypeAgg.map(c => ({ type: c._id, count: c.count })),
        topSponsors: topSponsorsAgg
      }
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 2. PRODUCTS CRUD
// ==========================================
export const getAdminProducts = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (category) query.category = category;
    if (search) query.title = { $regex: search, $options: 'i' };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('sponsorId', 'brandName logoUrl')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Product.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: products,
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

export const createProduct = async (req, res, next) => {
  try {
    const { sponsorId, title, description, images, category, price, discountPrice, availability, productUrl, tags } = req.body;

    const product = await Product.create({
      sponsorId,
      title: title.trim(),
      description: description || '',
      images: Array.isArray(images) ? images : [images || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600'],
      category,
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : null,
      availability: availability || 'in_stock',
      productUrl: productUrl || '',
      tags: Array.isArray(tags) ? tags : []
    });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'ADMIN_PRODUCT_CREATED',
      entityType: 'Product',
      entityId: product._id,
      meta: { title: product.title, price: product.price, sponsorId }
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'ADMIN_PRODUCT_UPDATED',
      entityType: 'Product',
      entityId: product._id,
      meta: req.body
    });

    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
};

export const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'ADMIN_PRODUCT_DELETED',
      entityType: 'Product',
      entityId: product._id,
      meta: { title: product.title }
    });

    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 3. SPONSORS CRUD
// ==========================================
export const getAdminSponsors = async (req, res, next) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (category) query.category = category;
    if (search) query.brandName = { $regex: search, $options: 'i' };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [sponsors, total] = await Promise.all([
      Sponsor.find(query).sort({ totalBudget: -1 }).skip(skip).limit(parseInt(limit, 10)),
      Sponsor.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: sponsors,
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

export const createSponsor = async (req, res, next) => {
  try {
    const sponsor = await Sponsor.create(req.body);

    await AuditLog.create({
      actorId: req.user._id,
      action: 'ADMIN_SPONSOR_CREATED',
      entityType: 'Sponsor',
      entityId: sponsor._id,
      meta: { brandName: sponsor.brandName, totalBudget: sponsor.totalBudget }
    });

    res.status(201).json({ success: true, data: sponsor });
  } catch (error) {
    next(error);
  }
};

export const updateSponsor = async (req, res, next) => {
  try {
    const sponsor = await Sponsor.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!sponsor) return res.status(404).json({ success: false, error: 'Sponsor not found' });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'ADMIN_SPONSOR_UPDATED',
      entityType: 'Sponsor',
      entityId: sponsor._id,
      meta: req.body
    });

    res.json({ success: true, data: sponsor });
  } catch (error) {
    next(error);
  }
};

export const deleteSponsor = async (req, res, next) => {
  try {
    const sponsor = await Sponsor.findByIdAndDelete(req.params.id);
    if (!sponsor) return res.status(404).json({ success: false, error: 'Sponsor not found' });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'ADMIN_SPONSOR_DELETED',
      entityType: 'Sponsor',
      entityId: sponsor._id,
      meta: { brandName: sponsor.brandName }
    });

    res.json({ success: true, message: 'Sponsor deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 4. CAMPAIGNS CRUD & STATUS
// ==========================================
export const getAdminCampaigns = async (req, res, next) => {
  try {
    const { type, status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [campaigns, total] = await Promise.all([
      Campaign.find(query)
        .populate('sponsorId', 'brandName logoUrl')
        .populate('productId', 'title price')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
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

export const createCampaign = async (req, res, next) => {
  try {
    const {
      sponsorId,
      productId,
      title,
      description,
      type,
      videoUrl,
      thumbnailUrl,
      durationSec,
      rewardAmount,
      totalBudget,
      maxParticipantsPerUser,
      startDate,
      endDate,
      status = 'active',
      autoApprove = true,
      requirements,
      termsAndConditions
    } = req.body;

    const sponsor = await Sponsor.findById(sponsorId);
    if (!sponsor) return res.status(404).json({ success: false, error: 'Sponsor not found' });

    // Block activation if budget is insufficient
    const numBudget = parseFloat(totalBudget);
    const numReward = parseFloat(rewardAmount);

    if (numBudget < numReward) {
      return res.status(400).json({
        success: false,
        error: 'Total budget must be at least equal to one reward amount.'
      });
    }

    const campaign = await Campaign.create({
      sponsorId,
      productId: productId || null,
      title: title.trim(),
      description: description || '',
      type,
      videoUrl: videoUrl || '',
      thumbnailUrl: thumbnailUrl || '',
      durationSec: parseInt(durationSec || '15', 10),
      rewardAmount: numReward,
      totalBudget: numBudget,
      spentBudget: 0,
      maxParticipantsPerUser: parseInt(maxParticipantsPerUser || '1', 10),
      startDate: startDate || new Date(),
      endDate: endDate || null,
      status,
      autoApprove: autoApprove !== undefined ? autoApprove : true,
      requirements: requirements || { text: 'Complete action', evidenceType: 'none' },
      termsAndConditions: termsAndConditions || 'Simulated prototype rewards.'
    });

    // Update sponsor budget
    await Sponsor.findByIdAndUpdate(sponsorId, { $inc: { totalBudget: numBudget } });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'ADMIN_CAMPAIGN_CREATED',
      entityType: 'Campaign',
      entityId: campaign._id,
      meta: { title: campaign.title, totalBudget: numBudget, type }
    });

    res.status(201).json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

export const updateCampaign = async (req, res, next) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

    await AuditLog.create({
      actorId: req.user._id,
      action: 'ADMIN_CAMPAIGN_UPDATED',
      entityType: 'Campaign',
      entityId: campaign._id,
      meta: req.body
    });

    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

export const updateCampaignStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['draft', 'active', 'paused', 'ended'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid campaign status.' });
    }

    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, error: 'Campaign not found' });

    // Block activating if budget is exhausted
    if (status === 'active' && campaign.spentBudget >= campaign.totalBudget) {
      return res.status(400).json({
        success: false,
        error: 'Cannot activate campaign. Total budget is already exhausted.'
      });
    }

    campaign.status = status;
    await campaign.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: 'ADMIN_CAMPAIGN_STATUS_UPDATED',
      entityType: 'Campaign',
      entityId: campaign._id,
      meta: { oldStatus: campaign.status, newStatus: status }
    });

    res.json({ success: true, data: campaign });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 5. ACTIVITY VERIFICATION QUEUE
// ==========================================
export const getAdminActivities = async (req, res, next) => {
  try {
    const { status = 'submitted', page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [activities, total] = await Promise.all([
      Activity.find(query)
        .populate('userId', 'name email walletBalance totalEarned status referralCode')
        .populate({
          path: 'campaignId',
          select: 'title rewardAmount spentBudget totalBudget type',
          populate: { path: 'sponsorId', select: 'brandName logoUrl' }
        })
        .populate('referralLinkId', 'code clicks uniqueVisits qualifyingActions')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Activity.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: activities,
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

export const decideActivity = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, reason } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, error: 'Decision must be approved or rejected.' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'A clear decision reason is required.' });
    }

    const activity = await Activity.findById(id).populate('campaignId');
    if (!activity) return res.status(404).json({ success: false, error: 'Activity not found' });
    if (activity.status !== 'submitted') {
      return res.status(400).json({ success: false, error: `Activity already has status: ${activity.status}` });
    }

    activity.status = decision;
    activity.decisionReason = reason.trim();
    activity.reviewedBy = req.user._id;
    await activity.save();

    // Find linked reward
    const reward = await Reward.findOne({
      userId: activity.userId,
      campaignId: activity.campaignId._id,
      sourceId: activity._id
    });

    if (reward) {
      if (decision === 'approved') {
        await RewardService.approveReward({
          rewardId: reward._id,
          actorId: req.user._id,
          reason: reason.trim()
        });

        // If activity had a referral link, mark qualifying action
        if (activity.referralLinkId) {
          await ReferralLink.findByIdAndUpdate(activity.referralLinkId, {
            $inc: { qualifyingActions: 1 }
          });
        }
      } else {
        await RewardService.rejectReward({
          rewardId: reward._id,
          actorId: req.user._id,
          reason: reason.trim()
        });
      }
    }

    await AuditLog.create({
      actorId: req.user._id,
      action: decision === 'approved' ? 'ACTIVITY_APPROVED' : 'ACTIVITY_REJECTED',
      entityType: 'Activity',
      entityId: activity._id,
      meta: { decision, reason: reason.trim(), rewardId: reward?._id }
    });

    res.json({
      success: true,
      message: `Activity ${decision} successfully.`,
      activity
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 6. REWARD MANAGEMENT
// ==========================================
export const getAdminRewards = async (req, res, next) => {
  try {
    const { status, sourceType, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (sourceType) query.sourceType = sourceType;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [rewards, total] = await Promise.all([
      Reward.find(query)
        .populate('userId', 'name email status walletBalance')
        .populate({
          path: 'campaignId',
          select: 'title rewardAmount spentBudget totalBudget type',
          populate: { path: 'sponsorId', select: 'brandName logoUrl' }
        })
        .populate('decidedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Reward.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: rewards,
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

export const decideReward = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { decision, reason } = req.body;

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, error: 'Decision must be approved or rejected.' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'A decision reason is required.' });
    }

    let result;
    if (decision === 'approved') {
      result = await RewardService.approveReward({
        rewardId: id,
        actorId: req.user._id,
        reason: reason.trim()
      });
    } else {
      result = await RewardService.rejectReward({
        rewardId: id,
        actorId: req.user._id,
        reason: reason.trim()
      });
    }

    res.json({
      success: true,
      message: `Reward ${decision} successfully`,
      data: result
    });
  } catch (error) {
    next(error);
  }
};

export const bulkDecideRewards = async (req, res, next) => {
  try {
    const { rewardIds, decision, reason } = req.body;

    if (!Array.isArray(rewardIds) || rewardIds.length === 0) {
      return res.status(400).json({ success: false, error: 'rewardIds array is required.' });
    }

    if (!['approved', 'rejected'].includes(decision)) {
      return res.status(400).json({ success: false, error: 'Decision must be approved or rejected.' });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({ success: false, error: 'A decision reason is required for bulk actions.' });
    }

    const results = { succeeded: [], failed: [] };

    for (const rewardId of rewardIds) {
      try {
        if (decision === 'approved') {
          await RewardService.approveReward({
            rewardId,
            actorId: req.user._id,
            reason: reason.trim()
          });
        } else {
          await RewardService.rejectReward({
            rewardId,
            actorId: req.user._id,
            reason: reason.trim()
          });
        }
        results.succeeded.push(rewardId);
      } catch (err) {
        results.failed.push({ rewardId, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Bulk decision completed: ${results.succeeded.length} succeeded, ${results.failed.length} failed.`,
      results
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 7. FRAUD & SUSPICIOUS ACTIVITY
// ==========================================
export const getAdminFraudLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [flaggedViews, totalFlagged, duplicateFingerprints] = await Promise.all([
      AdView.find({ flagged: true })
        .populate('userId', 'name email status walletBalance deviceFingerprint')
        .populate('campaignId', 'title durationSec rewardAmount')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      AdView.countDocuments({ flagged: true }),
      // Group users by device fingerprint where multiple users exist
      User.aggregate([
        { $match: { deviceFingerprint: { $ne: '' } } },
        {
          $group: {
            _id: '$deviceFingerprint',
            count: { $sum: 1 },
            users: { $push: { id: '$_id', name: '$name', email: '$email', status: '$status' } }
          }
        },
        { $match: { count: { $gt: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      success: true,
      flaggedViews,
      duplicateFingerprints,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total: totalFlagged,
        pages: Math.ceil(totalFlagged / parseInt(limit, 10))
      }
    });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Status must be active or suspended.' });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ success: false, error: 'User not found' });

    user.status = status;
    await user.save();

    await AuditLog.create({
      actorId: req.user._id,
      action: status === 'suspended' ? 'USER_SUSPENDED' : 'USER_REACTIVATED',
      entityType: 'User',
      entityId: user._id,
      meta: { previousStatus: user.status, newStatus: status, reason: reason || 'Admin action' }
    });

    res.json({
      success: true,
      message: `User status changed to ${status}`,
      user
    });
  } catch (error) {
    next(error);
  }
};

// ==========================================
// 8. AUDIT LOG VIEWER
// ==========================================
export const getAdminAuditLogs = async (req, res, next) => {
  try {
    const { action, entityType, page = 1, limit = 25 } = req.query;
    const query = {};
    if (action) query.action = action;
    if (entityType) query.entityType = entityType;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actorId', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      AuditLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: logs,
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

// ==========================================
// 9. USERS LIST & STATS
// ==========================================
export const getAdminUsers = async (req, res, next) => {
  try {
    const { search, status, role, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { referralCode: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [users, total] = await Promise.all([
      User.find(query)
        .populate('referredBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: users,
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
