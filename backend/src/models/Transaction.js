import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    rewardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Reward',
      default: null,
      index: true
    },
    type: {
      type: String,
      enum: ['credit', 'debit', 'withdrawal', 'redeem'],
      required: true,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    balanceAfter: {
      type: Number,
      required: true
    },
    note: {
      type: String,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

transactionSchema.index({ userId: 1, createdAt: -1 });

export const Transaction = mongoose.model('Transaction', transactionSchema);
