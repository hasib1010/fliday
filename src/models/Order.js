// models/Order.js
import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  packageCode: { type: String, required: true },
  packageName: { type: String, required: true },
  dataAmount: { type: String, required: true },
  duration: { type: String, required: true },
  location: { type: String, required: true },
  // Provider's price without markup
  originalPrice: { type: Number, required: true },
  // Our markup amount (retailPrice - originalPrice)  
  markupAmount: { type: Number, required: true },
  // Any discount applied
  discountAmount: { type: Number, default: 0 },
  // Price the customer pays (originalPrice + markupAmount - discountAmount)
  finalPrice: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
  taxCountry: { type: String },
  couponCode: { type: String },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  orderStatus: {
    type: String,
    enum: ['pending_payment', 'processing', 'completed', 'failed'],
    default: 'pending_payment',
  },
  paymentMethod: { type: String, required: true },
  paymentIntentId: { type: String },
  failureReason: { type: String },
  createdAt: { type: Date, default: Date.now },
  completedAt: { type: Date },
  updatedAt: { type: Date },
  esimDetails: {
    esimTranNo: { type: String },
    orderNo: { type: String },
    transactionId: { type: String },
    imsi: { type: String },
    iccid: { type: String },
    smsStatus: { type: Number },
    msisdn: { type: String },
    ac: { type: String },
    qrCodeUrl: { type: String },
    shortUrl: { type: String },
    smdpStatus: { type: String },
    eid: { type: String },
    activeType: { type: Number },
    dataType: { type: Number },
    activateTime: { type: Date },
    expiredTime: { type: String },
    totalVolume: { type: Number },
    totalDuration: { type: Number },
    durationUnit: { type: String },
    orderUsage: { type: Number },
    pin: { type: String },
    puk: { type: String },
    apn: { type: String },
    esimStatus: { type: String },
    packageList: [
      {
        packageName: { type: String },
        packageCode: { type: String },
        slug: { type: String },
        duration: { type: Number },
        volume: { type: Number },
        locationCode: { type: String },
        createTime: { type: String },
      },
    ],
    instructions: { type: String },
    lastUpdateTime: { type: Date, default: Date.now }
  },
});

// Add a virtual property for markup percentage
OrderSchema.virtual('markupPercentage').get(function() {
  if (!this.originalPrice) return 0;
  return Math.round((this.markupAmount / this.originalPrice) * 100);
});

// Pre-save middleware to calculate finalPrice
OrderSchema.pre('save', function(next) {
  if (this.isModified('originalPrice') || this.isModified('markupAmount') || this.isModified('discountAmount')) {
    this.finalPrice = this.originalPrice + this.markupAmount - this.discountAmount;
  }
  
  // Add updatedAt timestamp
  this.updatedAt = new Date();
  next();
});

// Set toJSON to include virtuals
OrderSchema.set('toJSON', { virtuals: true });
OrderSchema.set('toObject', { virtuals: true });

export default mongoose.models.Order || mongoose.model('Order', OrderSchema);