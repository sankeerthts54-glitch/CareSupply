const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organisation = require('../models/Organisation');

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET || 'caresupply-jwt-secret-2024-very-long-and-secure',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

const register = async (req, res, next) => {
  let session = null;
  let transactionStarted = false;

  try {
    const {
      name,
      email,
      password,
      role,
      organisationName,
      organisationType,
      phone,
      address,
    } = req.body;

    if (!name || !email || !password || !role || !organisationName || !phone) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Name, email, password, role, organisationName, and phone are required',
        statusCode: 400,
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Password must be at least 8 characters long',
        statusCode: 400,
      });
    }

    if (!['donor', 'recipient'].includes(role)) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Role must be either donor or recipient',
        statusCode: 400,
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'Email is already registered',
        statusCode: 409,
      });
    }

    // Try starting a session and transaction if supported
    try {
      session = await mongoose.startSession();
      session.startTransaction();
      transactionStarted = true;
    } catch (e) {
      session = null;
      transactionStarted = false;
    }

    const sessionOption = transactionStarted && session ? { session } : {};

    const organisation = new Organisation({
      name: organisationName.trim(),
      type: organisationType || 'other',
      email: email.toLowerCase().trim(),
      phone: phone.trim(),
      address: address || {},
      verificationStatus: 'pending',
    });

    await organisation.save(sessionOption);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role,
      organisationId: organisation._id,
    });

    await user.save(sessionOption);

    if (transactionStarted && session) {
      await session.commitTransaction();
      session.endSession();
    }

    const token = generateToken(user._id);

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organisationId: organisation._id,
        organisation,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    if (transactionStarted && session) {
      try {
        await session.abortTransaction();
        session.endSession();
      } catch (abortErr) {
        // silent catch
      }
    }
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Email and password are required',
        statusCode: 400,
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
        statusCode: 401,
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid email or password',
        statusCode: 401,
      });
    }

    let organisation = null;
    if (user.organisationId) {
      organisation = await Organisation.findById(user.organisationId);
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        organisationId: user.organisationId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      organisation,
    });
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('organisationId');
    if (!user) {
      return res.status(404).json({
        error: 'NotFound',
        message: 'User not found',
        statusCode: 404,
      });
    }

    const userObj = user.toJSON();
    const organisation = user.organisationId;
    userObj.organisation = organisation;

    return res.status(200).json({
      user: userObj,
      organisation,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
};
