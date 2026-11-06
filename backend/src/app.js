require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

// Route imports
const authRoutes = require('./routes/auth');
const organisationRoutes = require('./routes/organisations');
const listingRoutes = require('./routes/listings');
const requestRoutes = require('./routes/requests');
const notificationRoutes = require('./routes/notifications');
const adminRoutes = require('./routes/admin');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Database connection helper for standard and serverless environments
let isConnected = false;
const connectDB = async () => {
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/caresupply';
  try {
    await mongoose.connect(MONGO_URI);
    isConnected = true;
    console.log(`Connected to MongoDB at ${MONGO_URI.replace(/:[^:@]+@/, ':****@')}`);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
  }
};

// Automatic DB connection middleware
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// Middleware
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin === clientUrl ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    dbState: mongoose.connection.readyState,
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development',
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/organisations', organisationRoutes);
app.use('/api/listings', listingRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Catch-all 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    statusCode: 404,
  });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`CareSupply Backend running on http://localhost:${PORT}`);
    });
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer, connectDB };

