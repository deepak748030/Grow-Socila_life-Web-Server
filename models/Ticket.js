const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ['user', 'admin'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

const ticketSchema = new mongoose.Schema({
  ticketId: {
    type: Number,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  subject: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  category: {
    type: String,
    enum: ['order-issue', 'payment', 'technical', 'other'],
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'answered', 'closed'],
    default: 'open',
    index: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  messages: [messageSchema],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Auto-increment ticketId
ticketSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastTicket = await this.constructor.findOne().sort('-ticketId');
    this.ticketId = lastTicket ? lastTicket.ticketId + 1 : 1001;
  }
  next();
});

// Indexes
ticketSchema.index({ user: 1, status: 1 });
ticketSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Ticket', ticketSchema);