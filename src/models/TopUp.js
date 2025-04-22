// models/TopUp.js
import mongoose from 'mongoose';

const TopUpSchema = new mongoose.Schema({
  topUpId: { type: String, required: true, unique: true },
  orderId: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packageCode: { type: String, required: true },
  packageName: { type: String, required: true },
  originalPrice: { type: Number, required: true }, // Provider's price
  markupAmount: { type: Number, default: 10000 },  // $1 markup in cents
  discountAmount: { type: Number, default: 0 },
  finalPrice: { type: Number, required: true },    // Price with markup (what customer pays)
  currency: { type: String, default: 'USD' },
  dataAmount: { type: String, required: true },
  duration: { type: String, required: true },
  location: { type: String, required: true },
  paymentMethod: { type: String, required: true },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  topUpStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  paymentIntentId: { type: String },
  transactionId: { type: String, required: true },
  iccid: { type: String, required: true },
  esimTranNo: { type: String },
  failureReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  updatedAt: { type: Date },
  providerResponse: {
    transactionId: { type: String },
    iccid: { type: String },
    expiredTime: { type: String },
    totalVolume: { type: Number },
    totalDuration: { type: Number },
    orderUsage: { type: Number }
  }
});

export default mongoose.models.TopUp || mongoose.model('TopUp', TopUpSchema);