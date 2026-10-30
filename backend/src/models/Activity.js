import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ['PROMOTE', 'REFERRAL'],
      required: true,
      index: true
    },
    evidenceUrl: {
      type: String,
      default: ''
    },
    evidenceText: {
      type: String,
      default: ''
    },
    referralLinkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReferralLink',
      default: null,
      index: true
    },
    status: {
      type: String,
      enum: ['submitted', 'approved', 'rejected'],
      default: 'submitted',
      index: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    decisionReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

activitySchema.index({ status: 1, createdAt: -1 });

export const Activity = mongoose.model('Activity', activitySchema);
