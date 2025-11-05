const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false
  },
  balance: {
    type: Number,
    default: 0,
    min: 0
  },
  apiKey: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  referralCode: {
    type: String,
    unique: true,
    index: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  referralEarnings: {
    total: { type: Number, default: 0 },
    available: { type: Number, default: 0 }
  },
  referralStats: {
    visits: { type: Number, default: 0 },
    registrations: { type: Number, default: 0 },
    conversions: { type: Number, default: 0 }
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
// userSchema.index({ email: 1 });
// userSchema.index({ apiKey: 1 });
// userSchema.index({ referralCode: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Generate referral code
userSchema.methods.generateReferralCode = function () {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
};

module.exports = mongoose.model('User', userSchema);