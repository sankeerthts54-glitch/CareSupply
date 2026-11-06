const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organisation = require('../models/Organisation');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication token required',
      });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'caresupply-jwt-secret-2024-very-long-and-secure';
    const decoded = jwt.verify(token, secret);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'User no longer exists',
      });
    }

    req.user = user;

    if (user.organisationId) {
      req.organisation = await Organisation.findById(user.organisationId);
    } else {
      req.organisation = null;
    }

    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or expired token',
    });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied: insufficient permissions',
      });
    }
    next();
  };
};

const requireVerified = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }

  if (!req.organisation || req.organisation.verificationStatus !== 'verified') {
    return res.status(403).json({
      error: 'Forbidden',
      message: 'Organisation is not verified',
    });
  }

  next();
};

module.exports = {
  authenticate,
  requireRole,
  requireVerified,
};
