import { Transaction } from '../models/Transaction.js';
import { Reward } from '../models/Reward.js';
import { CouponRedemption } from '../models/CouponRedemption.js';
import { Coupon } from '../models/Coupon.js';
import { User } from '../models/User.js';
import { RewardService } from '../services/rewardService.js';
import { env } from '../config/env.js';

export const getWalletSummary = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    // Fetch counts and amounts
    const [rewardsStats, rejectedStats, couponsAvailable, couponsRedeemed, recentTransactions] = await Promise.all([
      Reward.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            total: { $sum: '$amount' }
          }
        }
      ]),
      Reward.find({ userId, status: 'rejected' })
        .populate('campaignId', 'title')
        .sort({ updatedAt: -1 })
        .limit(5),
      Coupon.countDocuments({ status: 'active', expiryDate: { $gt: new Date() } }),
      CouponRedemption.countDocuments({ userId }),
      Transaction.find({ userId }).sort({ createdAt: -1 }).limit(10)
    ]);

    // Format earnings over the last 14 days for mini chart
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const earningsOverTime = await Transaction.aggregate([
      {
        $match: {
          userId,
          type: 'credit',
          createdAt: { $gte: fourteenDaysAgo }
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          earned: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Build continuous 14-day timeline
    const chartData = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const found = earningsOverTime.find(e => e._id === dateStr);
      chartData.push({
        date: dateStr.slice(5), // MM-DD
        fullDate: dateStr,
        amount: found ? found.earned : 0
      });
    }

    res.json({
      success: true,
      wallet: {
        balance: user.walletBalance,
        pendingBalance: user.pendingBalance,
        totalEarned: user.totalEarned,
        minWithdrawalAmount: env.MIN_WITHDRAWAL_AMOUNT,
        disclaimer: 'Prototype - simulated rewards. No real monetary transactions.'
      },
      stats: {
        rewardBreakdown: rewardsStats,
        recentRejected: rejectedStats,
        couponsAvailable,
        couponsRedeemed
      },
      chartData,
      recentTransactions
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactions = async (req, res, next) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const query = { userId: req.user._id };

    if (type) {
      query.type = type;
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate({
          path: 'rewardId',
          select: 'sourceType amount campaignId status',
          populate: { path: 'campaignId', select: 'title' }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Transaction.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: transactions,
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

export const withdrawFunds = async (req, res, next) => {
  try {
    const { amount, paymentMethod = 'UPI', accountDetails = '' } = req.body;
    const numericAmount = parseFloat(amount);

    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid withdrawal amount is required.' });
    }

    const result = await RewardService.processWithdrawal({
      userId: req.user._id,
      amount: numericAmount,
      paymentMethod,
      accountDetails
    });

    res.json({
      success: true,
      message: `Simulated withdrawal of ₹${numericAmount} processed successfully.`,
      transaction: result.transaction,
      newBalance: result.user.walletBalance
    });
  } catch (error) {
    next(error);
  }
};
