import mongoose from "mongoose";

const CouponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
    },

    applicablePackages: {
      type: [String], // exact packageCode matches
      default: [],
    },

    applicableLocations: {
      type: [String], // e.g. ["USA", "Japan"] or country codes if you prefer
      default: [],
    },

    applicableDataAmounts: {
      type: [String], // e.g. ["1GB", "5GB", "10GB"]
      default: [],
    },

    applicableDurations: {
      type: [Number], // e.g. [7, 15, 30]
      default: [],
    },

    active: {
      type: Boolean,
      default: true,
    },

    usageLimit: {
      type: Number,
      default: null,
    },

    usedCount: {
      type: Number,
      default: 0,
    },

    expiresAt: {
      type: Date,
      default: null,
    },

    useOncePerCustomer: {
      type: Boolean,
      default: false,
    },

    firstOrderOnly: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Coupon || mongoose.model("Coupon", CouponSchema);