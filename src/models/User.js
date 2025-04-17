// models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
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
UserSchema.pre('findOneAndUpdate', function() {
  this.set({ updatedAt: Date.now() });
});

// Create model if it doesn't exist already
const User = mongoose.models.User || mongoose.model('User', UserSchema);

export default User;