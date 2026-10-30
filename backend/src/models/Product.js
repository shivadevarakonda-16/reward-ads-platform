import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    sponsorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sponsor',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true
    },
    description: {
      type: String,
      default: '',
      trim: true
    },
    images: {
      type: [String],
      default: []
    },
    category: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    discountPrice: {
      type: Number,
      default: null
    },
    availability: {
      type: String,
      enum: ['in_stock', 'limited', 'out_of_stock'],
      default: 'in_stock',
      index: true
    },
    productUrl: {
      type: String,
      default: ''
    },
    tags: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true
  }
);

export const Product = mongoose.model('Product', productSchema);
