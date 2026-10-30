import crypto from 'crypto';
import { AdView } from '../models/AdView.js';
import { User } from '../models/User.js';
import { env } from '../config/env.js';

export class FraudService {
  /**
   * Hashes an IP address for privacy-safe deduplication
   */
  static hashIp(ip) {
    if (!ip) return 'unknown_ip';
    return crypto.createHash('sha256').update(ip).digest('hex').substring(0, 32);
  }

  /**
   * Validates incoming heartbeat against real time and video constraints
   */
  static validateHeartbeat(adView, newCurrentTime, cumulativePlayedSeconds, clientTimestamp) {
    const heartbeats = adView.heartbeats || [];
    const now = clientTimestamp ? new Date(clientTimestamp).getTime() : Date.now();

    // Must not exceed video duration by a large margin
    if (newCurrentTime > adView.videoDurationSec + 3) {
      return {
        valid: false,
        flagged: true,
        reason: 'Current time exceeds video duration'
      };
    }

    if (heartbeats.length > 0) {
      const lastHb = heartbeats[heartbeats.length - 1];
      const timeElapsedMs = now - new Date(lastHb.timestamp).getTime();
      const timeElapsedSec = timeElapsedMs / 1000;

      // Heartbeats are expected every ~2s. If delta is < 0.5s but claimed played delta is > 2s, flag.
      const playedDelta = cumulativePlayedSeconds - lastHb.cumulativePlayedSeconds;
      if (timeElapsedSec < 0.8 && playedDelta > 2.5) {
        return {
          valid: false,
          flagged: true,
          reason: 'Played seconds increased faster than wall-clock time'
        };
      }

      // Check for impossible skipping ahead without playing
      const currentDelta = newCurrentTime - lastHb.currentTime;
      if (currentDelta > 4 && playedDelta < 1.5) {
        return {
          valid: false,
          flagged: true,
          reason: 'Video playback skipped forward (seeking detected)'
        };
      }
    }

    return { valid: true, flagged: false };
  }

  /**
   * Evaluates user and device limits
   */
  static async checkWatchLimits(userId, ipAddress, deviceFingerprint) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Check daily ad completions for user
    const todayAdCount = await AdView.countDocuments({
      userId,
      completed: true,
      createdAt: { $gte: today }
    });

    if (todayAdCount >= env.MAX_ADS_PER_USER_PER_DAY) {
      return {
        allowed: false,
        reason: `Daily limit of ${env.MAX_ADS_PER_USER_PER_DAY} rewarded ads reached for today.`
      };
    }

    // 2. Check for rapid completion burst (more than 4 ads started/completed in 2 minutes)
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    const burstCount = await AdView.countDocuments({
      userId,
      createdAt: { $gte: twoMinutesAgo }
    });

    if (burstCount >= 5) {
      return {
        allowed: false,
        flagged: true,
        reason: 'Unusually rapid ad views detected. Rate limit applied.'
      };
    }

    // 3. Multi-account detection on same device / IP in short window
    if (deviceFingerprint) {
      const recentUsersOnDevice = await User.find({
        deviceFingerprint,
        _id: { $ne: userId }
      }).limit(5);

      if (recentUsersOnDevice.length >= 3) {
        return {
          allowed: true,
          flagged: true,
          reason: 'Multiple accounts linked to the same device fingerprint'
        };
      }
    }

    return { allowed: true, flagged: false };
  }
}
