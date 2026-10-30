import mongoose from 'mongoose';

const heartbeatSchema = new mongoose.Schema(
  {
    timestamp: {
      type: Date,
      default: Date.now
    },
    currentTime: {
      type: Number,
      required: true
    },
    cumulativePlayedSeconds: {
      type: Number,
      required: true
    }
  },
  { _id: false }
);

const adViewSchema = new mongoose.Schema(
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
    watchedSeconds: {
      type: Number,
      default: 0
    },
    videoDurationSec: {
      type: Number,
      required: true
    },
    watchPercent: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false,
      index: true
    },
    heartbeats: [heartbeatSchema],
    startedAt: {
      type: Date,
      default: Date.now
    },
    endedAt: {
      type: Date,
      default: null
    },
    ipAddress: {
      type: String,
      default: ''
    },
    userAgent: {
      type: String,
      default: ''
    },
    rewardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reward',
      default: null
    },
    flagged: {
      type: Boolean,
      default: false,
      index: true
    },
    flagReason: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

adViewSchema.index({ userId: 1, campaignId: 1, createdAt: -1 });
adViewSchema.index({ flagged: 1, createdAt: -1 });

export const AdView = mongoose.model('AdView', adViewSchema);
