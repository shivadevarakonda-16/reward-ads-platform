import { customAlphabet } from 'nanoid';
import { ReferralLink } from '../models/ReferralLink.js';
import { ReferralVisit } from '../models/ReferralVisit.js';
import { FraudService } from './fraudService.js';

const nanoidAlpha = customAlphabet('23456789ABCDEFGHJKLMNPQRSTUVWXYZ', 8);

export class ReferralService {
  /**
   * Generates a clean, readable referral code
   */
  static generateCode(prefix = 'REF') {
    return `${prefix}-${nanoidAlpha()}`;
  }

  /**
   * Finds or creates a unique referral link for a user and campaign
   */
  static async getOrCreateLink({ userId, campaignId = null, productId = null, baseUrl = 'http://localhost:5000' }) {
    let link = await ReferralLink.findOne({
      userId,
      campaignId: campaignId || null,
      productId: productId || null
    });

    if (!link) {
      const code = ReferralService.generateCode();
      const url = `${baseUrl}/api/r/${code}`;

      link = await ReferralLink.create({
        userId,
        campaignId: campaignId || null,
        productId: productId || null,
        code,
        url,
        clicks: 0,
        uniqueVisits: 0,
        qualifyingActions: 0
      });
    }

    return link;
  }

  /**
   * Logs a public visit to a referral link with daily IP hash deduplication
   */
  static async trackVisit({ code, ipAddress, userAgent }) {
    const link = await ReferralLink.findOne({ code });
    if (!link) {
      return null;
    }

    // Always increment total clicks
    await ReferralLink.findByIdAndUpdate(link._id, { $inc: { clicks: 1 } });

    // Deduplicate unique visit by IP hash + date string
    const ipHash = FraudService.hashIp(ipAddress);
    const dayString = new Date().toISOString().slice(0, 10);

    try {
      await ReferralVisit.create({
        referralLinkId: link._id,
        ipHash,
        userAgent: userAgent ? userAgent.substring(0, 200) : '',
        dayString
      });

      // If insert succeeded (no duplicate index error), increment unique visits
      await ReferralLink.findByIdAndUpdate(link._id, { $inc: { uniqueVisits: 1 } });
    } catch (err) {
      // Duplicate visit from same IP on same day; ignore duplicate key error
      if (err.code !== 11000) {
        console.error('Error logging referral visit:', err);
      }
    }

    return link;
  }

  /**
   * Increments qualifying actions for this referral link
   */
  static async recordQualifyingAction(linkId) {
    if (!linkId) return;
    await ReferralLink.findByIdAndUpdate(linkId, { $inc: { qualifyingActions: 1 } });
  }
}
