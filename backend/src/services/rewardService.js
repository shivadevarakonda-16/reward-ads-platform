import { Reward } from '../models/Reward.js';
import { User } from '../models/User.js';
import { Campaign } from '../models/Campaign.js';
import { Sponsor } from '../models/Sponsor.js';
import { Transaction } from '../models/Transaction.js';
import { Notification } from '../models/Notification.js';
import { AuditLog } from '../models/AuditLog.js';
import { env } from '../config/env.js';

export class RewardService {
  /**
   * Issues a reward for an eligible action
   */
  static async issueReward({ userId, campaignId, sourceType, sourceId, autoApprove = false }) {
    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status !== 'active') {
      throw new Error(`Campaign is ${campaign.status}, cannot reward.`);
    }

    // Check if campaign budget is exhausted
    if (campaign.spentBudget + campaign.rewardAmount > campaign.totalBudget) {
      throw new Error('Campaign reward budget has been exhausted.');
    }

    // Check if user already received reward for this specific AD_VIEW campaign
    if (sourceType === 'AD_VIEW') {
      const existing = await Reward.findOne({
        userId,
        campaignId,
        sourceType: 'AD_VIEW'
      });
      if (existing) {
        throw new Error('User has already been rewarded for this ad campaign.');
      }
    }

    const rewardAmount = campaign.rewardAmount;
    const shouldApprove = autoApprove || (sourceType === 'AD_VIEW' && campaign.autoApprove);

    // Create reward record
    const reward = new Reward({
      userId,
      campaignId,
      sourceType,
      sourceId,
      amount: rewardAmount,
      status: shouldApprove ? 'approved' : 'pending',
      reason: shouldApprove ? 'Auto-approved on completion threshold' : 'Awaiting administrative verification',
      decidedAt: shouldApprove ? new Date() : null
    });

    await reward.save();

    if (shouldApprove) {
      // Direct approval: atomically update user balance, campaign & sponsor spent budget, and log transaction
      const user = await User.findById(userId);
      const newWalletBalance = user.walletBalance + rewardAmount;
      const newTotalEarned = user.totalEarned + rewardAmount;

      await User.findByIdAndUpdate(userId, {
        $inc: { walletBalance: rewardAmount, totalEarned: rewardAmount }
      });

      await Campaign.findByIdAndUpdate(campaignId, {
        $inc: { spentBudget: rewardAmount }
      });

      if (campaign.sponsorId) {
        await Sponsor.findByIdAndUpdate(campaign.sponsorId, {
          $inc: { spentBudget: rewardAmount }
        });
      }

      await Transaction.create({
        userId,
        rewardId: reward._id,
        type: 'credit',
        amount: rewardAmount,
        balanceAfter: newWalletBalance,
        note: `Ad reward for "${campaign.title}"`
      });

      await Notification.create({
        userId,
        title: 'Reward Credited! 🎉',
        message: `₹${rewardAmount} credited to your wallet for watching "${campaign.title}".`,
        type: 'reward_approved'
      });

      await AuditLog.create({
        actorId: null,
        action: 'REWARD_AUTO_APPROVED',
        entityType: 'Reward',
        entityId: reward._id,
        meta: { amount: rewardAmount, campaignId, sourceType }
      });
    } else {
      // Pending state: increment pendingBalance on user
      await User.findByIdAndUpdate(userId, {
        $inc: { pendingBalance: rewardAmount }
      });

      await Notification.create({
        userId,
        title: 'Reward Pending Verification ⏳',
        message: `₹${rewardAmount} pending verification for activity on "${campaign.title}".`,
        type: 'ad_completed'
      });

      await AuditLog.create({
        actorId: null,
        action: 'REWARD_PENDING_CREATED',
        entityType: 'Reward',
        entityId: reward._id,
        meta: { amount: rewardAmount, campaignId, sourceType }
      });
    }

    return reward;
  }

  /**
   * Admin approves a pending reward
   */
  static async approveReward({ rewardId, actorId, reason = 'Verified by administrator' }) {
    if (!reason || !reason.trim()) {
      throw new Error('A decision reason is required to approve a reward.');
    }

    const reward = await Reward.findById(rewardId);
    if (!reward) throw new Error('Reward record not found.');
    if (reward.status === 'approved') throw new Error('Reward is already approved.');

    const campaign = await Campaign.findById(reward.campaignId);
    if (!campaign) throw new Error('Associated campaign not found.');

    // Enforce budget limit
    if (campaign.spentBudget + reward.amount > campaign.totalBudget) {
      throw new Error(`Insufficient campaign budget. Remaining: ₹${campaign.totalBudget - campaign.spentBudget}`);
    }

    const user = await User.findById(reward.userId);
    if (!user) throw new Error('Recipient user not found.');

    const wasPending = reward.status === 'pending';
    const amount = reward.amount;

    reward.status = 'approved';
    reward.reason = reason;
    reward.decidedBy = actorId;
    reward.decidedAt = new Date();
    await reward.save();

    // Update campaign and sponsor budget
    await Campaign.findByIdAndUpdate(campaign._id, { $inc: { spentBudget: amount } });
    if (campaign.sponsorId) {
      await Sponsor.findByIdAndUpdate(campaign.sponsorId, { $inc: { spentBudget: amount } });
    }

    // Update user wallet balances
    const userUpdate = {
      $inc: {
        walletBalance: amount,
        totalEarned: amount
      }
    };
    if (wasPending) {
      userUpdate.$inc.pendingBalance = -Math.min(user.pendingBalance, amount);
    }
    const updatedUser = await User.findByIdAndUpdate(user._id, userUpdate, { new: true });

    // Create transaction log
    const transaction = await Transaction.create({
      userId: user._id,
      rewardId: reward._id,
      type: 'credit',
      amount,
      balanceAfter: updatedUser.walletBalance,
      note: `Approved reward for ${campaign.title} (${reward.sourceType})`
    });

    // Notify user
    await Notification.create({
      userId: user._id,
      title: 'Activity Approved! 🎉',
      message: `Your reward of ₹${amount} for "${campaign.title}" was approved: ${reason}`,
      type: 'reward_approved'
    });

    // Record audit log
    await AuditLog.create({
      actorId,
      action: 'REWARD_APPROVED',
      entityType: 'Reward',
      entityId: reward._id,
      meta: { amount, campaignId: campaign._id, reason, transactionId: transaction._id }
    });

    return { reward, transaction, user: updatedUser };
  }

  /**
   * Admin rejects a pending reward
   */
  static async rejectReward({ rewardId, actorId, reason }) {
    if (!reason || !reason.trim()) {
      throw new Error('A decision reason is required to reject a reward.');
    }

    const reward = await Reward.findById(rewardId);
    if (!reward) throw new Error('Reward record not found.');
    if (reward.status === 'rejected') throw new Error('Reward is already rejected.');

    const wasPending = reward.status === 'pending';
    const amount = reward.amount;

    reward.status = 'rejected';
    reward.reason = reason;
    reward.decidedBy = actorId;
    reward.decidedAt = new Date();
    await reward.save();

    const user = await User.findById(reward.userId);
    if (user && wasPending) {
      await User.findByIdAndUpdate(user._id, {
        $inc: { pendingBalance: -Math.min(user.pendingBalance, amount) }
      });
    }

    const campaign = await Campaign.findById(reward.campaignId);
    const campaignTitle = campaign ? campaign.title : 'campaign';

    if (user) {
      await Notification.create({
        userId: user._id,
        title: 'Activity Rejected ❌',
        message: `Your reward request for "${campaignTitle}" was rejected. Reason: ${reason}`,
        type: 'reward_rejected'
      });
    }

    await AuditLog.create({
      actorId,
      action: 'REWARD_REJECTED',
      entityType: 'Reward',
      entityId: reward._id,
      meta: { amount, campaignId: reward.campaignId, reason }
    });

    return reward;
  }

  /**
   * Process simulated withdrawal request
   */
  static async processWithdrawal({ userId, amount, paymentMethod = 'UPI', accountDetails = '' }) {
    if (amount < env.MIN_WITHDRAWAL_AMOUNT) {
      throw new Error(`Minimum withdrawal amount is ₹${env.MIN_WITHDRAWAL_AMOUNT}.`);
    }

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found.');

    if (user.status === 'suspended') {
      throw new Error('Account suspended. Withdrawals disabled.');
    }

    if (user.walletBalance < amount) {
      throw new Error(`Insufficient wallet balance. Available: ₹${user.walletBalance}`);
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $inc: { walletBalance: -amount } },
      { new: true }
    );

    const transaction = await Transaction.create({
      userId,
      rewardId: null,
      type: 'withdrawal',
      amount: -amount,
      balanceAfter: updatedUser.walletBalance,
      note: `Simulated withdrawal to ${paymentMethod} (${accountDetails || 'Default account'})`
    });

    await Notification.create({
      userId,
      title: 'Withdrawal Initiated 💸',
      message: `Simulated withdrawal of ₹${amount} initiated via ${paymentMethod}.`,
      type: 'withdrawal'
    });

    await AuditLog.create({
      actorId: userId,
      action: 'USER_WITHDRAWAL_REQUESTED',
      entityType: 'Transaction',
      entityId: transaction._id,
      meta: { amount, paymentMethod, balanceAfter: updatedUser.walletBalance }
    });

    return { user: updatedUser, transaction };
  }
}
