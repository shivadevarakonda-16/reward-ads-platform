import mongoose from 'mongoose';

const couponRedemptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupon',
      required: true,
      index: true
    },
    status: {
      type: String,
      enum: ['revealed', 'redeemed'],
      default: 'revealed'
    },
    redeemedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

couponRedemptionSchema.index({ userId: 1, couponId: 1 }, { unique: true });

export const CouponRedemption = mongoose.model('CouponRedemption', couponRedemptionSchema);
