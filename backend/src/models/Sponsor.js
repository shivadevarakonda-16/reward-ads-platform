import mongoose from 'mongoose';

const sponsorSchema = new mongoose.Schema(
  {
    brandName: {
      type: String,
      required: [true, 'Brand name is required'],
      trim: true,
      index: true
    },
    contactName: {
      type: String,
      trim: true,
      default: ''
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    logoUrl: {
      type: String,
      default: ''
    },
    website: {
      type: String,
      default: ''
    },
    totalBudget: {
      type: Number,
      required: true,
      default: 0,
      min: 0
    },
    spentBudget: {
      type: Number,
      default: 0,
      min: 0
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
      index: true
    }
  },
  {
    timestamps: true
  }
);

export const Sponsor = mongoose.model('Sponsor', sponsorSchema);
