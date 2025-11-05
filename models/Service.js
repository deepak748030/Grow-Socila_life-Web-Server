const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  serviceId: {
    type: Number,
    required: true,
    unique: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    index: true,
    enum: ['Instagram', 'Facebook', 'YouTube', 'Twitter', 'TikTok', 'Other']
  },
  type: {
    type: String,
    default: 'Default'
  },
  rate: {
    type: Number,
    required: true,
    min: 0
  },
  min: {
    type: Number,
    required: true,
    min: 1
  },
  max: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  refill: {
    type: Boolean,
    default: false
  },
  cancel: {
    type: Boolean,
    default: true
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  }
}, {
  timestamps: true
});

// Indexes
serviceSchema.index({ category: 1, isActive: 1 });
// serviceSchema.index({ serviceId: 1 });
serviceSchema.index({ name: 'text' });

module.exports = mongoose.model('Service', serviceSchema);