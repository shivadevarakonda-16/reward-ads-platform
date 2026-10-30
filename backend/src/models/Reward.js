import mongoose from 'mongoose';

const rewardSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
      required: true,
      index: true
    },
    sourceType: {
      type: String,
      enum: ['AD_VIEW', 'PROMOTE', 'REFERRAL', 'DEAL'],
      required: true,
      index: true
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    amount: {
      type: Number,
      required: true,
      min: 0
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true
    },
    reason: {
      type: String,
      default: ''
    },
    decidedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    decidedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Prevent duplicate AD_VIEW rewards per user per campaign
rewardSchema.index(
  { userId: 1, campaignId: 1, sourceType: 1 },
  {
    unique: true,
    partialFilterExpression: { sourceType: 'AD_VIEW' }
  }
);

rewardSchema.index({ status: 1, createdAt: -1 });

export const Reward = mongoose.model('Reward', rewardSchema);
