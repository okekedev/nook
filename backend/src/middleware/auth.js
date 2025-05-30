const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
  // Get auth header
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Middleware to check if user is a parent
const isParent = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'parent') {
    return res.status(403).json({ error: 'Access denied: Parents only' });
  }
  
  next();
};

// Middleware to check if user is a child
const isChild = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  if (req.user.role !== 'child') {
    return res.status(403).json({ error: 'Access denied: Children only' });
  }
  
  next();
};

// Middleware to check if user is authorized to access a family
const isFamilyMember = async (req, res, next) => {
  try {
    const Family = require('../models/family');
    const familyId = req.params.id || req.params.familyId;
    
    if (!familyId) {
      return res.status(400).json({ error: 'Family ID is required' });
    }
    
    // If user is parent, check if they are the parent of the family
    if (req.user.role === 'parent') {
      const family = await Family.findById(familyId);
      
      if (!family) {
        return res.status(404).json({ error: 'Family not found' });
      }
      
      if (family.parent_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied: Not the parent of this family' });
      }
    }
    
    // If user is child, check if they are a member of the family
    if (req.user.role === 'child') {
      const members = await Family.getMembers(familyId);
      const isMember = members.some(member => member.id === req.user.id);
      
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied: Not a member of this family' });
      }
    }
    
    next();
  } catch (error) {
    console.error('isFamilyMember Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

// Middleware to check if user is authorized to access a device
const isDeviceOwner = async (req, res, next) => {
  try {
    const Device = require('../models/device');
    const deviceId = req.params.id || req.params.deviceId;
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Device ID is required' });
    }
    
    const device = await Device.findById(deviceId);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // If user is parent, check if they are the parent of the family that owns the device
    if (req.user.role === 'parent') {
      const Family = require('../models/family');
      const family = await Family.findById(device.family_id);
      
      if (!family) {
        return res.status(404).json({ error: 'Family not found' });
      }
      
      if (family.parent_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied: Not the parent of this device' });
      }
    }
    
    // If user is child, check if they are the owner of the device
    if (req.user.role === 'child') {
      if (device.user_id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied: Not the owner of this device' });
      }
    }
    
    next();
  } catch (error) {
    console.error('isDeviceOwner Error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = {
  authenticateToken,
  isParent,
  isChild,
  isFamilyMember,
  isDeviceOwner
};