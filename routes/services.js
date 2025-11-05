const express = require('express');
const router = express.Router();
const Service = require('../models/Service');
const { protect } = require('../middleware/auth');

// Get all services with filtering and search
router.get('/', protect, async (req, res) => {
  try {
    const { category, search } = req.query;

    const query = { isActive: true };

    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    const services = await Service.find(query)
      .select('serviceId name category rate min max description refill cancel')
      .lean()
      .sort({ category: 1, serviceId: 1 });

    res.json({
      success: true,
      count: services.length,
      services
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single service
router.get('/:id', protect, async (req, res) => {
  try {
    const service = await Service.findOne({ serviceId: req.params.id, isActive: true });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json({ success: true, service });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;