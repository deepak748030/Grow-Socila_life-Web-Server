const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
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
  service: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true
  },
  serviceId: {
    type: Number,
    required: true
  },
  link: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  startCount: {
    type: Number,
    default: 0
  },
  remains: {
    type: Number,
    default: 0
  },
  charge: {
    type: Number,
    required: true,
    min: 0
  },
  status: {
    type: String,
    enum: ['Pending', 'In progress', 'Completed', 'Partial', 'Processing', 'Canceled'],
    default: 'Pending',
    index: true
  },
  apiOrderId: {
    type: String
  }
}, {
  timestamps: true
});

// Auto-increment orderId
orderSchema.pre('save', async function (next) {
  if (this.isNew) {
    const lastOrder = await this.constructor.findOne().sort('-orderId');
    this.orderId = lastOrder ? lastOrder.orderId + 1 : 10001;
    this.remains = this.quantity;
  }
  next();
});

// Indexes for fast queries
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
// orderSchema.index({ orderId: 1 });

module.exports = mongoose.model('Order', orderSchema);