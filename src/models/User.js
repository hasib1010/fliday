// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: false, // Changed: Apple might not provide name
    default: 'User', // Added: Default value when name is not provided
    trim: true,
    maxlength: [50, 'Name cannot be more than 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email address'
    ],
    lowercase: true,
    trim: true
  },
  provider: {
    type: String,
    enum: ['google', 'apple'],
    required: [true, 'Authentication provider is required']
  },
  providerId: {
    type: String,
    required: [true, 'Provider ID is required']
  },
  appleUser: {
    type: String,
    sparse: true, // Allows null/undefined while maintaining unique constraint
    unique: true, // Implicitly creates a unique index on appleUser
  },
  image: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  phoneNumber: {
    type: String,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Update the 'lastLogin' field on document update
UserSchema.pre('findOneAndUpdate', function () {
  this.set({ updatedAt: Date.now() });
});

// Add indexes for better query performance
UserSchema.index({ email: 1, provider: 1 }); 

// Create model if it doesn't exist already
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;