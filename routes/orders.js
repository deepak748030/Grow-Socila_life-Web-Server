const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Service = require('../models/Service');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Create order
router.post('/',
  protect,
  [
    body('serviceId').isInt(),
    body('link').trim().notEmpty().isURL(),
    body('quantity').isInt({ min: 1 })
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { serviceId, link, quantity } = req.body;

      const service = await Service.findOne({ serviceId, isActive: true });
      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      if (quantity < service.min || quantity > service.max) {
        return res.status(400).json({ 
          error: `Quantity must be between ${service.min} and ${service.max}` 
        });
      }

      const charge = (quantity / 1000) * service.rate;

      if (req.user.balance < charge) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      const order = await Order.create({
        user: req.user._id,
        service: service._id,
        serviceId: service.serviceId,
        link,
        quantity,
        charge
      });

      // Deduct balance
      req.user.balance -= charge;
      await req.user.save();

      // Handle referral commission
      if (req.user.referredBy) {
        const referrer = await User.findById(req.user.referredBy);
        if (referrer) {
          const commission = charge * (process.env.REFERRAL_COMMISSION_RATE / 100);
          referrer.referralEarnings.total += commission;
          referrer.referralEarnings.available += commission;
          referrer.referralStats.conversions += 1;
          await referrer.save();
        }
      }

      res.status(201).json({
        success: true,
        order: {
          orderId: order.orderId,
          charge: order.charge,
          status: order.status
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Mass order
router.post('/mass',
  protect,
  async (req, res) => {
    try {
      const { orders } = req.body;

      if (!Array.isArray(orders) || orders.length === 0) {
        return res.status(400).json({ error: 'Invalid orders format' });
      }

      const results = [];
      let totalCharge = 0;

      for (const orderData of orders) {
        const [serviceId, link, quantity] = orderData.split('|').map(s => s.trim());

        const service = await Service.findOne({ serviceId: parseInt(serviceId), isActive: true });
        if (!service) continue;

        const qty = parseInt(quantity);
        const charge = (qty / 1000) * service.rate;
        totalCharge += charge;

        results.push({
          service: service._id,
          serviceId: service.serviceId,
          link,
          quantity: qty,
          charge
        });
      }

      if (req.user.balance < totalCharge) {
        return res.status(400).json({ error: 'Insufficient balance' });
      }

      const createdOrders = await Order.insertMany(
        results.map(r => ({ ...r, user: req.user._id }))
      );

      req.user.balance -= totalCharge;
      await req.user.save();

      res.status(201).json({
        success: true,
        count: createdOrders.length,
        totalCharge,
        orders: createdOrders.map(o => o.orderId)
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Get user orders
router.get('/', protect, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;

    const query = { user: req.user._id };
    if (status && status !== 'all') query.status = status;
    if (search) query.$or = [
      { link: new RegExp(search, 'i') },
      { orderId: parseInt(search) || 0 }
    ];

    const orders = await Order.find(query)
      .populate('service', 'name category')
      .select('-user -__v')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Order.countDocuments(query);

    res.json({
      success: true,
      orders,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get order by ID
router.get('/:id', protect, async (req, res) => {
  try {
    const order = await Order.findOne({ 
      orderId: req.params.id, 
      user: req.user._id 
    }).populate('service', 'name category rate');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;