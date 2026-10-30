import { ReferralService } from '../services/referralService.js';
import { ReferralLink } from '../models/ReferralLink.js';
import { env } from '../config/env.js';

export const generateReferralLink = async (req, res, next) => {
  try {
    const { campaignId, productId } = req.body;
    const userId = req.user._id;

    // Use current request protocol + host as baseUrl
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const link = await ReferralService.getOrCreateLink({
      userId,
      campaignId,
      productId,
      baseUrl
    });

    res.status(201).json({
      success: true,
      data: link
    });
  } catch (error) {
    next(error);
  }
};

export const getMyReferrals = async (req, res, next) => {
  try {
    const links = await ReferralLink.find({ userId: req.user._id })
      .populate('campaignId', 'title rewardAmount type thumbnailUrl')
      .populate('productId', 'title price images category')
      .sort({ createdAt: -1 });

    const totalClicks = links.reduce((acc, l) => acc + l.clicks, 0);
    const totalUniqueVisits = links.reduce((acc, l) => acc + l.uniqueVisits, 0);
    const totalQualifyingActions = links.reduce((acc, l) => acc + l.qualifyingActions, 0);

    res.json({
      success: true,
      stats: {
        totalLinks: links.length,
        totalClicks,
        totalUniqueVisits,
        totalQualifyingActions
      },
      data: links
    });
  } catch (error) {
    next(error);
  }
};

export const handleRedirect = async (req, res, next) => {
  try {
    const { code } = req.params;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const link = await ReferralService.trackVisit({
      code,
      ipAddress,
      userAgent
    });

    // Frontend origin to redirect to
    const clientBase = env.CLIENT_ORIGINS[0] || 'http://localhost:5173';

    if (!link) {
      return res.redirect(`${clientBase}/?ref_error=not_found`);
    }

    if (link.campaignId) {
      return res.redirect(`${clientBase}/campaigns/${link.campaignId}?ref=${code}`);
    } else if (link.productId) {
      return res.redirect(`${clientBase}/products/${link.productId}?ref=${code}`);
    }

    return res.redirect(`${clientBase}/?ref=${code}`);
  } catch (error) {
    next(error);
  }
};
