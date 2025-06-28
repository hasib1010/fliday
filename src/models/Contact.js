// models/Contact.js
import mongoose from 'mongoose';

const ContactSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: [100, 'Name cannot be more than 100 characters']
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please provide a valid email address'
        ],
        lowercase: true,
        trim: true
    },
    subject: {
        type: String,
        required: [true, 'Subject is required'],
        trim: true,
        maxlength: [200, 'Subject cannot be more than 200 characters']
    },
    message: {
        type: String,
        required: [true, 'Message is required'],
        trim: true,
        maxlength: [2000, 'Message cannot be more than 2000 characters']
    },
    status: {
        type: String,
        enum: ['new', 'in_progress', 'resolved', 'closed'],
        default: 'new'
    },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high', 'urgent'],
        default: 'medium'
    },
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    adminNotes: {
        type: String,
        default: '',
        maxlength: [1000, 'Admin notes cannot be more than 1000 characters']
    },
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    submittedAt: {
        type: Date,
        default: Date.now
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    resolvedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

// Update lastUpdated on document update
ContactSchema.pre('findOneAndUpdate', function () {
    this.set({ lastUpdated: Date.now() });
});

// Add indexes for better query performance
ContactSchema.index({ status: 1, submittedAt: -1 });
ContactSchema.index({ email: 1 });
ContactSchema.index({ assignedTo: 1 });

// Static method to get contact statistics
ContactSchema.statics.getStats = async function () {
    return await this.aggregate([
        {
            $group: {
                _id: '$status',
                count: { $sum: 1 }
            }
        }
    ]);
};

// Create model if it doesn't exist already
const Contact = mongoose.models.Contact || mongoose.model('Contact', ContactSchema);

export default Contact;