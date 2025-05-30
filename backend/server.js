const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import routes (we'll create these next)
const authRoutes = require('./src/routes/auth');
const familyRoutes = require('./src/routes/families');
const deviceRoutes = require('./src/routes/devices');
const profileRoutes = require('./src/routes/profiles');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/families', familyRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/profiles', profileRoutes);

// Root route for testing
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Nook MDM API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
    },
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;