const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Add funds
router.post('/add-funds', protect, async (req, res) => {
  try {
    const { amount, method, phone } = req.body;

    if (!amount || amount < 10) {
      return res.status(400).json({ error: 'Minimum amount is ₹10' });
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      amount,
      type: 'credit',
      method: method || 'UPI',
      phone,
      status: 'pending',
      transactionId: 'TXN' + Date.now()
    });

    // In production, integrate with payment gateway here
    // For now, simulate instant approval
    setTimeout(async () => {
      transaction.status = 'completed';
      await transaction.save();

      await User.findByIdAndUpdate(req.user._id, {
        $inc: { balance: amount }
      });
    }, 2000);

    res.status(201).json({
      success: true,
      transaction: {
        id: transaction.transactionId,
        amount: transaction.amount,
        status: transaction.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transaction history
router.get('/transactions', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const transactions = await Transaction.find({ user: req.user._id })
      .select('-user -gatewayResponse -__v')
      .sort('-createdAt')
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .lean();

    const count = await Transaction.countDocuments({ user: req.user._id });

    res.json({
      success: true,
      transactions,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      total: count
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;