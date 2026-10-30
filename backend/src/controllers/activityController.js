import { Activity } from '../models/Activity.js';
import { Campaign } from '../models/Campaign.js';
import { Reward } from '../models/Reward.js';
import { User } from '../models/User.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';

export const submitActivity = async (req, res, next) => {
  try {
    const { campaignId, type, evidenceUrl, evidenceText, referralLinkId } = req.body;
    const userId = req.user._id;

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({ success: false, error: `Campaign is currently ${campaign.status}` });
    }

    if (!evidenceUrl && !evidenceText) {
      return res.status(400).json({
        success: false,
        error: 'Please provide promotional evidence (either an image/screenshot URL or descriptive text proof).'
      });
    }

    // Create submitted activity
    const activity = await Activity.create({
      userId,
      campaignId,
      type: type || campaign.type || 'PROMOTE',
      evidenceUrl: evidenceUrl || '',
      evidenceText: evidenceText || '',
      referralLinkId: referralLinkId || null,
      status: 'submitted'
    });

    // Create pending reward record
    const reward = await Reward.create({
      userId,
      campaignId,
      sourceType: activity.type,
      sourceId: activity._id,
      amount: campaign.rewardAmount,
      status: 'pending',
      reason: 'Promotional activity submitted for admin verification'
    });

    // Update pending balance on user profile
    await User.findByIdAndUpdate(userId, {
      $inc: { pendingBalance: campaign.rewardAmount }
    });

    await Notification.create({
      userId,
      title: 'Activity Submitted! ⏳',
      message: `Your proof for "${campaign.title}" is in the admin verification queue. Reward ₹${campaign.rewardAmount} pending approval.`,
      type: 'ad_completed'
    });

    await AuditLog.create({
      actorId: userId,
      action: 'ACTIVITY_SUBMITTED',
      entityType: 'Activity',
      entityId: activity._id,
      meta: { campaignId, rewardId: reward._id, amount: campaign.rewardAmount }
    });

    res.status(201).json({
      success: true,
      message: 'Promotional activity submitted successfully. Awaiting admin review.',
      activity,
      reward
    });
  } catch (error) {
    next(error);
  }
};

export const getMyActivities = async (req, res, next) => {
  try {
    const activities = await Activity.find({ userId: req.user._id })
      .populate({
        path: 'campaignId',
        select: 'title rewardAmount type thumbnailUrl sponsorId',
        populate: { path: 'sponsorId', select: 'brandName logoUrl' }
      })
      .populate('referralLinkId', 'code clicks uniqueVisits')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    next(error);
  }
};
