import mongoose from 'mongoose';

const referralLinkSchema = new mongoose.Schema(
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
      default: null,
      index: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
      index: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    clicks: {
      type: Number,
      default: 0
    },
    uniqueVisits: {
      type: Number,
      default: 0
    },
    qualifyingActions: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

referralLinkSchema.index({ userId: 1, campaignId: 1 });

export const ReferralLink = mongoose.model('ReferralLink', referralLinkSchema);
