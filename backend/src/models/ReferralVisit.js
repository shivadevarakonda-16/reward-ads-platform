import mongoose from 'mongoose';

const referralVisitSchema = new mongoose.Schema(
  {
    referralLinkId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ReferralLink',
      required: true,
      index: true
    },
    ipHash: {
      type: String,
      required: true
    },
    userAgent: {
      type: String,
      default: ''
    },
    dayString: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Deduplicate unique visits by ipHash + day per referral link
referralVisitSchema.index({ referralLinkId: 1, ipHash: 1, dayString: 1 }, { unique: true });

export const ReferralVisit = mongoose.model('ReferralVisit', referralVisitSchema);
