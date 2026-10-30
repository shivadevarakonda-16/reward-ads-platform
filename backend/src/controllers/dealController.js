import { Coupon } from '../models/Coupon.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';

const getOptionalUser = async (req) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, env.JWT_SECRET);
      return await User.findById(decoded.id);
    }
  } catch (err) {}
  return null;
};

export const getDeals = async (req, res, next) => {
  try {
    const { status, category, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status) {
      query.status = status;
    }

    const user = await getOptionalUser(req);
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [deals, total] = await Promise.all([
      Coupon.find(query)
        .populate('sponsorId', 'brandName logoUrl category')
        .populate('productId', 'title price images category')
        .sort({ expiryDate: 1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Coupon.countDocuments(query)
    ]);

    let userRedemptions = [];
    if (user) {
      userRedemptions = await CouponRedemption.find({ userId: user._id });
    }

    const redemptionMap = new Map();
    userRedemptions.forEach(r => redemptionMap.set(r.couponId.toString(), r));

    const now = new Date();
    const enrichedDeals = deals.map(deal => {
      const obj = deal.toObject();
      const isExpired = new Date(deal.expiryDate) < now || deal.status === 'expired';
      const redemption = redemptionMap.get(deal._id.toString());

      return {
        ...obj,
        isExpired,
        hasRedeemed: !!redemption,
        revealedCode: redemption ? deal.code : null,
        redemptionStatus: redemption ? redemption.status : null
      };
    });

    res.json({
      success: true,
      data: enrichedDeals,
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

export const redeemDeal = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const coupon = await Coupon.findById(id).populate('sponsorId', 'brandName');
    if (!coupon) {
      return res.status(404).json({ success: false, error: 'Deal/Coupon not found.' });
    }

    const now = new Date();
    if (new Date(coupon.expiryDate) < now || coupon.status === 'expired') {
      return res.status(400).json({
        success: false,
        error: 'This deal has expired and can no longer be redeemed.'
      });
    }

    let redemption = await CouponRedemption.findOne({ userId, couponId: coupon._id });
    if (!redemption) {
      redemption = await CouponRedemption.create({
        userId,
        couponId: coupon._id,
        status: 'revealed',
        redeemedAt: new Date()
      });
    }

    res.json({
      success: true,
      message: 'Deal unlocked successfully!',
      code: coupon.code,
      coupon,
      redemption
    });
  } catch (error) {
    next(error);
  }
};
