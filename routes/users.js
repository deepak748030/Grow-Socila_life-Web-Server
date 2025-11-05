const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Get user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -__v');

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const { name } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate API key
router.post('/api-key/generate', protect, async (req, res) => {
  try {
    const apiKey = 'sk_' + Math.random().toString(36).substring(2, 15) + 
                   Math.random().toString(36).substring(2, 15);

    req.user.apiKey = apiKey;
    await req.user.save();

    res.json({ success: true, apiKey });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;