const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

// Initialize DB connection eagerly in background
connectDB().catch((err) => {
  console.warn('Initial MongoDB connection attempt:', err.message);
});

const app = express();

// Body parser & CORS middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database connection middleware for API routes to guarantee active DB connection in serverless
app.use(async (req, res, next) => {
  if (req.originalUrl.startsWith('/api')) {
    try {
      await connectDB();
      next();
    } catch (dbErr) {
      console.error('Database connection error in request handler:', dbErr.message);
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable. Please check your MONGODB_URI environment variable.',
        error: dbErr.message,
      });
    }
  } else {
    next();
  }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api', require('./routes/taskRoutes'));

// Fallback route for Single Page Application navigation
app.get('*', (req, res, next) => {
  // If request is an API call, let 404 handler handle it
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404 Handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.originalUrl} not found`,
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err.stack || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` Task Manager Server Running on port ${PORT}`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`=========================================`);
  });
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.error(`Unhandled Error Rejection: ${err.message}`);
});

module.exports = app;
