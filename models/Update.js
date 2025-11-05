const mongoose = require('mongoose');

const updateSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['feature', 'maintenance', 'announcement'],
    default: 'announcement'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

updateSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Update', updateSchema);