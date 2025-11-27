import mongoose from 'mongoose';

const AnalyticsSchema = new mongoose.Schema({
  // Visitor identification (anonymized)
  visitorId: {
    type: String,
    required: true,
    index: true,
  },
  
  // Session information
  sessionId: {
    type: String,
    required: true,
  },
  
  // Page information
  page: {
    type: String,
    required: true,
  },
  
  // Referrer
  referrer: String,
  
  // Location data
  country: String,
  countryCode: String,
  city: String,
  region: String,
  latitude: Number,
  longitude: Number,
  
  // Device information
  device: {
    type: String,
    enum: ['desktop', 'mobile', 'tablet'],
  },
  browser: String,
  os: String,
  
  // IP (hashed for privacy)
  ipHash: String,
  
  // Timestamp
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
AnalyticsSchema.index({ timestamp: -1 });
AnalyticsSchema.index({ country: 1 });
AnalyticsSchema.index({ page: 1 });

export default mongoose.models.Analytics || mongoose.model('Analytics', AnalyticsSchema);