const express = require('express');
const router = express.Router();
const Update = require('../models/Update');
const { protect } = require('../middleware/auth');

// Get all updates
router.get('/', protect, async (req, res) => {
  try {
    const updates = await Update.find({ isActive: true })
      .select('-__v')
      .sort('-createdAt')
      .limit(20)
      .lean();

    res.json({ success: true, updates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;