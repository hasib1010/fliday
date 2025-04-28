// models/PackagePricing.js
import mongoose from 'mongoose';

const PackagePricingSchema = new mongoose.Schema({
  packageCode: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  slug: { 
    type: String
  },
  // Original price from provider API (in provider's format: 10000 = $1.00)
  originalPrice: { 
    type: Number, 
    required: true
  },
  // Our retail price to customers (in same format: 10000 = $1.00)
  retailPrice: { 
    type: Number, 
    required: true
  },
  packageName: { 
    type: String 
  },
  dataAmount: { 
    type: String 
  },
  duration: { 
    type: Number 
  },
  durationUnit: { 
    type: String,
    default: 'DAY'
  },
  location: { 
    type: String 
  },
  currency: {
    type: String,
    default: 'USD'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: { 
    type: String 
  }
});

// Virtual field for markup amount (calculated on access)
PackagePricingSchema.virtual('markupAmount').get(function() {
  return this.retailPrice - this.originalPrice;
});

// Virtual field for markup percentage
PackagePricingSchema.virtual('markupPercentage').get(function() {
  if (!this.originalPrice) return 0;
  return Math.round((this.retailPrice - this.originalPrice) / this.originalPrice * 100);
});

// Ensure retailPrice is not less than originalPrice
PackagePricingSchema.pre('save', function(next) {
  if (this.retailPrice < this.originalPrice) {
    return next(new Error('Retail price cannot be less than original price'));
  }
  this.updatedAt = new Date();
  next();
});

// Set toJSON and toObject to include virtuals
PackagePricingSchema.set('toJSON', { virtuals: true });
PackagePricingSchema.set('toObject', { virtuals: true });

// Create the model if it doesn't exist
const PackagePricing = mongoose.models.PackagePricing || mongoose.model('PackagePricing', PackagePricingSchema);

export default PackagePricing;