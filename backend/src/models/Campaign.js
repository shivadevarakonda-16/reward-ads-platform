import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema(
  {
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sponsor',
      required: true,
      index: true
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Campaign title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    type: {
      type: String,
      enum: ['AD_VIEW', 'PROMOTE', 'REFERRAL', 'DEAL'],
      required: true,
      index: true
    },
    videoUrl: {
      type: String,
      default: ''
    },
    thumbnailUrl: {
      type: String,
      default: ''
    },
    durationSec: {
      type: Number,
      default: 15,
      min: 1
    },
    rewardAmount: {
      type: Number,
      required: true,
      min: 0
    },
    totalBudget: {
      type: Number,
      required: true,
      min: 0
    },
    spentBudget: {
      type: Number,
      default: 0,
      min: 0
    },
    maxParticipantsPerUser: {
      type: Number,
      default: 1,
      min: 1
    },
    maxTotalRewards: {
      type: Number,
      default: 1000
    },
    startDate: {
      type: Date,
      default: Date.now
    },
    endDate: {
      type: Date,
      default: null
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'paused', 'ended'],
      default: 'active',
      index: true
    },
    autoApprove: {
      type: Boolean,
      default: true
    },
    requirements: {
      text: {
        type: String,
        default: ''
      },
      evidenceType: {
        type: String,
        enum: ['screenshot', 'url', 'text', 'none'],
        default: 'none'
      }
    },
    termsAndConditions: {
      type: String,
      default: 'Simulated prototype rewards. Subject to verification and budget availability.'
    }
  },
  {
    timestamps: true
  }
);

campaignSchema.index({ type: 1, status: 1 });
campaignSchema.index({ sponsorId: 1, status: 1 });

export const Campaign = mongoose.model('Campaign', campaignSchema);
