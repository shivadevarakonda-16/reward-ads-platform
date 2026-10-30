import { AdView } from '../models/AdView.js';
import { Campaign } from '../models/Campaign.js';
import { Reward } from '../models/Reward.js';
import { FraudService } from '../services/fraudService.js';
import { RewardService } from '../services/rewardService.js';
import { env } from '../config/env.js';

export const startAdView = async (req, res, next) => {
  try {
    const { campaignId, videoDurationSec = 15, deviceFingerprint } = req.body;
    const userId = req.user._id;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({ success: false, error: 'Campaign is not currently active' });
    }

    // Check watch limits & fraud signals
    const limits = await FraudService.checkWatchLimits(userId, ipAddress, deviceFingerprint || req.user.deviceFingerprint);
    if (!limits.allowed) {
      return res.status(429).json({ success: false, error: limits.reason });
    }

    // Determine expected duration
    const duration = campaign.durationSec || videoDurationSec || 15;

    const initialTimestamp = req.body.clientTimestamp ? new Date(req.body.clientTimestamp) : new Date();

    const adView = await AdView.create({
      userId,
      campaignId,
      videoDurationSec: duration,
      watchedSeconds: 0,
      watchPercent: 0,
      completed: false,
      startedAt: initialTimestamp,
      ipAddress,
      userAgent,
      flagged: limits.flagged || false,
      flagReason: limits.reason || '',
      heartbeats: [
        {
          timestamp: initialTimestamp,
          currentTime: 0,
          cumulativePlayedSeconds: 0
        }
      ]
    });

    res.status(201).json({
      success: true,
      adViewId: adView._id,
      serverTime: Date.now()
    });
  } catch (error) {
    next(error);
  }
};

export const recordHeartbeat = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentTime = 0, cumulativePlayedSeconds = 0, clientTimestamp } = req.body;
    const userId = req.user._id;

    const adView = await AdView.findOne({ _id: id, userId });
    if (!adView) {
      return res.status(404).json({ success: false, error: 'Ad view session not found' });
    }

    if (adView.completed) {
      return res.json({
        success: true,
        completed: true,
        watchPercent: 100,
        qualified: true
      });
    }

    const hbTimestamp = clientTimestamp ? new Date(clientTimestamp) : new Date();

    // Validate heartbeat cadence and playback metrics
    const validation = FraudService.validateHeartbeat(
      adView,
      parseFloat(currentTime),
      parseFloat(cumulativePlayedSeconds),
      clientTimestamp
    );

    if (validation.flagged) {
      adView.flagged = true;
      adView.flagReason = validation.reason;
    }

    const playedSec = Math.max(adView.watchedSeconds, parseFloat(cumulativePlayedSeconds));
    const percent = Math.min(100, Math.round((playedSec / adView.videoDurationSec) * 100));

    adView.watchedSeconds = playedSec;
    adView.watchPercent = percent;
    adView.heartbeats.push({
      timestamp: hbTimestamp,
      currentTime: parseFloat(currentTime),
      cumulativePlayedSeconds: playedSec
    });

    await adView.save();

    res.json({
      success: true,
      watchPercent: percent,
      watchedSeconds: playedSec,
      qualified: percent >= env.MIN_WATCH_PERCENT,
      flagged: adView.flagged
    });
  } catch (error) {
    next(error);
  }
};

export const endAdView = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { currentTime, cumulativePlayedSeconds } = req.body;
    const userId = req.user._id;

    const adView = await AdView.findOne({ _id: id, userId }).populate('campaignId');
    if (!adView) {
      return res.status(404).json({ success: false, error: 'Ad view session not found' });
    }

    if (adView.completed) {
      return res.json({
        success: true,
        message: 'Ad view was already processed as completed',
        completed: true,
        reward: null
      });
    }

    // Update with final stats if provided
    if (cumulativePlayedSeconds !== undefined) {
      adView.watchedSeconds = Math.max(adView.watchedSeconds, parseFloat(cumulativePlayedSeconds));
      adView.watchPercent = Math.min(100, Math.round((adView.watchedSeconds / adView.videoDurationSec) * 100));
    }
    adView.endedAt = new Date();

    // SERVER VALIDATION:
    // 1. Recompute watched time from heartbeat timestamps
    const heartbeats = adView.heartbeats || [];
    let validPlayedTime = 0;

    if (heartbeats.length >= 2) {
      for (let i = 1; i < heartbeats.length; i++) {
        const prev = heartbeats[i - 1];
        const curr = heartbeats[i];
        const wallClockDelta = (new Date(curr.timestamp).getTime() - new Date(prev.timestamp).getTime()) / 1000;
        const playedDelta = curr.cumulativePlayedSeconds - prev.cumulativePlayedSeconds;

        // Played delta cannot legitimately exceed wall clock delta + small jitter
        if (playedDelta > 0 && playedDelta <= wallClockDelta + 1.0) {
          validPlayedTime += playedDelta;
        } else if (playedDelta > 0) {
          // If suspicious, cap played delta to wall clock delta
          validPlayedTime += Math.min(playedDelta, wallClockDelta);
        }
      }
    } else {
      validPlayedTime = adView.watchedSeconds;
    }

    const calculatedWatchPercent = Math.min(100, Math.round((validPlayedTime / adView.videoDurationSec) * 100));
    const qualifies = calculatedWatchPercent >= env.MIN_WATCH_PERCENT && !adView.flagged;

    let reward = null;
    let rewardError = null;

    if (qualifies) {
      adView.completed = true;

      try {
        reward = await RewardService.issueReward({
          userId,
          campaignId: adView.campaignId._id,
          sourceType: 'AD_VIEW',
          sourceId: adView._id,
          autoApprove: adView.campaignId.autoApprove
        });
        adView.rewardId = reward._id;
      } catch (err) {
        rewardError = err.message;
      }
    } else if (adView.flagged) {
      rewardError = `Activity flagged: ${adView.flagReason || 'Unusual interaction pattern'}`;
    } else {
      rewardError = `Watch threshold not met. Watched: ${calculatedWatchPercent}%, required: ${env.MIN_WATCH_PERCENT}%`;
    }

    await adView.save();

    res.json({
      success: true,
      completed: adView.completed,
      calculatedWatchPercent,
      reward,
      rewardError
    });
  } catch (error) {
    next(error);
  }
};

export const getDailyStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayViews, todayRewards] = await Promise.all([
      AdView.countDocuments({
        userId,
        completed: true,
        createdAt: { $gte: today }
      }),
      Reward.find({
        userId,
        sourceType: 'AD_VIEW',
        status: { $in: ['approved', 'pending'] },
        createdAt: { $gte: today }
      })
    ]);

    const todayEarned = todayRewards.reduce((sum, r) => sum + r.amount, 0);

    res.json({
      success: true,
      todayAdsWatched: todayViews,
      todayEarned,
      maxAdsPerDay: env.MAX_ADS_PER_USER_PER_DAY,
      remainingAdsAllowed: Math.max(0, env.MAX_ADS_PER_USER_PER_DAY - todayViews)
    });
  } catch (error) {
    next(error);
  }
};
