const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Get referral stats
router.get('/stats', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      success: true,
      referralLink: `https://cheapestsmmpanels.com/ref/${user.referralCode}`,
      commissionRate: `${process.env.REFERRAL_COMMISSION_RATE}%`,
      minimumPayout: '₹10.00',
      stats: {
        visits: user.referralStats.visits,
        registrations: user.referralStats.registrations,
        referrals: user.referralStats.conversions,
        conversionRate: user.referralStats.registrations > 0 
          ? ((user.referralStats.conversions / user.referralStats.registrations) * 100).toFixed(2) + '%'
          : '0.00%',
        totalEarnings: `₹${user.referralEarnings.total.toFixed(2)}`,
        availableEarnings: `₹${user.referralEarnings.available.toFixed(2)}`
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track referral visit
router.post('/track/:code', async (req, res) => {
  try {
    const user = await User.findOne({ referralCode: req.params.code });

    if (user) {
      user.referralStats.visits += 1;
      await user.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;