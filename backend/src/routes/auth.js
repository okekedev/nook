const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const { validateUserRegistration, validateLogin } = require('../middleware/validation');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// Register a new user
router.post('/register', validateUserRegistration, async (req, res) => {
  try {
    const { email, password, firstName, lastName, role } = req.body;
    
    // Create the user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      role
    });
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Return user data and token
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Registration Error:', error);
    
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Server error during registration' });
  }
});

// Login
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findByEmail(email);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Verify password
    const isValidPassword = await User.verifyPassword(user, password);
    
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Return user data and token
    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ error: 'Server error during login' });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    // Extract token from authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication token required' });
    }
    
    // Verify token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      
      // Get user data
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Return user data
      res.json({
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          role: user.role
        }
      });
    } catch (error) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
  } catch (error) {
    console.error('Get Current User Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;