import mongoose from 'mongoose';

const couponSchema = new mongoose.Schema(
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
      required: true,
      trim: true
    },
    code: {
      type: String,
      required: true,
      uppercase: true,
      trim: true
    },
    discountType: {
      type: String,
      enum: ['percent', 'fixed'],
      required: true
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0
    },
    minPurchase: {
      type: Number,
      default: 0
    },
    expiryDate: {
      type: Date,
      required: true,
      index: true
    },
    restrictions: {
      type: String,
      default: 'Applicable on select products only.'
    },
    originalPrice: {
      type: Number,
      default: null
    },
    status: {
      type: String,
      enum: ['active', 'expired', 'disabled'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true
  }
);

couponSchema.index({ status: 1, expiryDate: 1 });

export const Coupon = mongoose.model('Coupon', couponSchema);
