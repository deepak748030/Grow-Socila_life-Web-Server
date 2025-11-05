const express = require('express');
const router = express.Router();
const Ticket = require('../models/Ticket');
const { protect } = require('../middleware/auth');

// Create ticket
router.post('/', protect, async (req, res) => {
  try {
    const { subject, category, message } = req.body;

    if (!subject || !category || !message) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const ticket = await Ticket.create({
      user: req.user._id,
      subject,
      category,
      messages: [{
        sender: 'user',
        message
      }]
    });

    res.status(201).json({
      success: true,
      ticket: {
        ticketId: ticket.ticketId,
        subject: ticket.subject,
        status: ticket.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user tickets
router.get('/', protect, async (req, res) => {
  try {
    const tickets = await Ticket.find({ user: req.user._id })
      .select('-messages -user')
      .sort('-createdAt')
      .lean();

    res.json({ success: true, tickets });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get ticket details
router.get('/:id', protect, async (req, res) => {
  try {
    const ticket = await Ticket.findOne({ 
      ticketId: req.params.id, 
      user: req.user._id 
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    res.json({ success: true, ticket });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add reply to ticket
router.post('/:id/reply', protect, async (req, res) => {
  try {
    const { message } = req.body;

    const ticket = await Ticket.findOne({ 
      ticketId: req.params.id, 
      user: req.user._id 
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    ticket.messages.push({
      sender: 'user',
      message
    });
    ticket.lastUpdated = Date.now();
    await ticket.save();

    res.json({ success: true, message: 'Reply added successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;