// Middleware for validating request data

// Helper function to validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Helper function to validate password strength
const isValidPassword = (password) => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return passwordRegex.test(password);
};

// Validate user registration data
const validateUserRegistration = (req, res, next) => {
  const { email, password, firstName, lastName, role } = req.body;
  const errors = [];
  
  // Check required fields
  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');
  if (!firstName) errors.push('First name is required');
  if (!lastName) errors.push('Last name is required');
  if (!role) errors.push('Role is required');
  
  // Check email format
  if (email && !isValidEmail(email)) {
    errors.push('Invalid email format');
  }
  
  // Check password strength
  if (password && !isValidPassword(password)) {
    errors.push('Password must be at least 8 characters and include uppercase, lowercase, and numbers');
  }
  
  // Check role
  if (role && !['parent', 'child'].includes(role)) {
    errors.push('Role must be either "parent" or "child"');
  }
  
  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
};

// Validate login data
const validateLogin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];
  
  // Check required fields
  if (!email) errors.push('Email is required');
  if (!password) errors.push('Password is required');
  
  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
};

// Validate family creation data
const validateFamilyCreation = (req, res, next) => {
  const { name } = req.body;
  const errors = [];
  
  // Check required fields
  if (!name) errors.push('Family name is required');
  
  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
};

// Validate profile creation data
const validateProfileCreation = (req, res, next) => {
  const { name, type, description, config } = req.body;
  const errors = [];
  
  // Check required fields
  if (!name) errors.push('Profile name is required');
  if (!type) errors.push('Profile type is required');
  
  // Check type
  if (type && !['essential_kids', 'student_mode', 'balanced_teen', 'custom'].includes(type)) {
    errors.push('Profile type must be either "essential_kids", "student_mode", "balanced_teen", or "custom"');
  }
  
  // Check config for custom profiles
  if (type === 'custom') {
    if (!config) errors.push('Profile configuration is required for custom profiles');
    
    if (config) {
      if (!config.allowedApps || !Array.isArray(config.allowedApps)) {
        errors.push('Allowed apps must be an array');
      }
      
      if (!config.restrictions || typeof config.restrictions !== 'object') {
        errors.push('Restrictions must be an object');
      }
    }
  }
  
  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
};

// Validate device creation data
const validateDeviceCreation = (req, res, next) => {
  const { name, userId, profileId } = req.body;
  const errors = [];
  
  // Check required fields
  if (!name) errors.push('Device name is required');
  
  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
};

// Validate app blocking data
const validateAppBlocking = (req, res, next) => {
  const { appBundleId, appName } = req.body;
  const errors = [];
  
  // Check required fields
  if (!appBundleId) errors.push('App bundle ID is required');
  if (!appName) errors.push('App name is required');
  
  // Return errors if any
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }
  
  next();
};

module.exports = {
  validateUserRegistration,
  validateLogin,
  validateFamilyCreation,
  validateProfileCreation,
  validateDeviceCreation,
  validateAppBlocking
};