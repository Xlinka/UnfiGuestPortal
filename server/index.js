const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const path = require('path');
const config = require('./config/config');
const errorHandler = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const guestRoutes = require('./routes/guestRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const setupRoutes = require('./routes/setupRoutes');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3881;

// Middleware
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../build')));
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/guest', guestRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/setup', setupRoutes);

// Handle React routing in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  });
}

// Error handling middleware
app.use(errorHandler);

// Connect to MongoDB
mongoose.connect(config.database.uri, config.database.options)
  .then(() => {
    console.log('Connected to MongoDB');
    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't exit in development to prevent crashes during testing
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});
