const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ error: 'Not authorized to access this route' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select('-password');

    if (!req.user || !req.user.isActive) {
      return res.status(401).json({ error: 'User no longer exists or is inactive' });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }
};

exports.apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.body.key || req.query.key;

    if (!apiKey) {
      return res.status(401).json({ error: 'API key is required' });
    }

    const user = await User.findOne({ apiKey, isActive: true });

    if (!user) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
};