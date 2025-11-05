const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const Order = require('../models/Order');
const User = require('../models/User');
const { apiKeyAuth } = require('../middleware/auth');

// Services endpoint
router.post('/', apiKeyAuth, async (req, res) => {
  try {
    const { action } = req.body;

    switch (action) {
      case 'services':
        const services = await Service.find({ isActive: true })
          .select('serviceId name type category rate min max refill cancel -_id')
          .lean();

        return res.json(services.map(s => ({
          service: s.serviceId,
          name: s.name,
          type: s.type,
          category: s.category,
          rate: s.rate.toString(),
          min: s.min.toString(),
          max: s.max.toString(),
          refill: s.refill,
          cancel: s.cancel
        })));

      case 'add':
        const { service, link, quantity } = req.body;

        const svc = await Service.findOne({ serviceId: service, isActive: true });
        if (!svc) return res.json({ error: 'Service not found' });

        const charge = (quantity / 1000) * svc.rate;
        if (req.user.balance < charge) {
          return res.json({ error: 'Insufficient balance' });
        }

        const order = await Order.create({
          user: req.user._id,
          service: svc._id,
          serviceId: svc.serviceId,
          link,
          quantity,
          charge
        });

        req.user.balance -= charge;
        await req.user.save();

        return res.json({ order: order.orderId });

      case 'status':
        const { order: orderId } = req.body;
        const orderData = await Order.findOne({ 
          orderId, 
          user: req.user._id 
        }).select('charge startCount remains status -_id');

        if (!orderData) return res.json({ error: 'Order not found' });

        return res.json({
          charge: orderData.charge.toString(),
          start_count: orderData.startCount,
          status: orderData.status,
          remains: orderData.remains
        });

      case 'balance':
        return res.json({ 
          balance: req.user.balance.toFixed(2),
          currency: 'INR'
        });

      default:
        return res.json({ error: 'Invalid action' });
    }
  } catch (error) {
    res.json({ error: error.message });
  }
});

module.exports = router;