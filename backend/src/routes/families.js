const express = require('express');
const Family = require('../models/family');
const Profile = require('../models/profile');
const simpleMdmService = require('../services/simpleMdmService');
const { authenticateToken, isParent, isFamilyMember } = require('../middleware/auth');
const { validateFamilyCreation, validateProfileCreation } = require('../middleware/validation');

const router = express.Router();

// Middleware to protect all routes
router.use(authenticateToken);

// Create a new family
router.post('/', isParent, validateFamilyCreation, async (req, res) => {
  try {
    const { name } = req.body;
    const parentId = req.user.id;
    
    // Create device group in SimpleMDM
    const simpleMdmGroup = await simpleMdmService.createDeviceGroup(name);
    
    // Create family in database
    const family = await Family.create({
      name,
      parentId,
      simpleMdmGroupId: simpleMdmGroup.id
    });
    
    res.status(201).json({
      message: 'Family created successfully',
      family
    });
  } catch (error) {
    console.error('Create Family Error:', error);
    
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Server error during family creation' });
  }
});

// Get all families for the authenticated parent
router.get('/', isParent, async (req, res) => {
  try {
    const parentId = req.user.id;
    
    // Get families from database
    const families = await Family.findByParentId(parentId);
    
    res.json({ families });
  } catch (error) {
    console.error('Get Families Error:', error);
    res.status(500).json({ error: 'Server error retrieving families' });
  }
});

// Get a specific family by ID
router.get('/:id', isFamilyMember, async (req, res) => {
  try {
    const familyId = req.params.id;
    
    // Get family from database
    const family = await Family.findById(familyId);
    
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }
    
    // Get family members
    const members = await Family.getMembers(familyId);
    
    res.json({
      family,
      members
    });
  } catch (error) {
    console.error('Get Family Error:', error);
    res.status(500).json({ error: 'Server error retrieving family' });
  }
});

// Update a family
router.put('/:id', isParent, isFamilyMember, validateFamilyCreation, async (req, res) => {
  try {
    const familyId = req.params.id;
    const { name } = req.body;
    
    // Get current family data
    const currentFamily = await Family.findById(familyId);
    
    if (!currentFamily) {
      return res.status(404).json({ error: 'Family not found' });
    }
    
    // Update device group in SimpleMDM
    await simpleMdmService.updateDeviceGroup(currentFamily.simplemdm_group_id, name);
    
    // Update family in database
    const updatedFamily = await Family.update(familyId, {
      name,
      simpleMdmGroupId: currentFamily.simplemdm_group_id
    });
    
    res.json({
      message: 'Family updated successfully',
      family: updatedFamily
    });
  } catch (error) {
    console.error('Update Family Error:', error);
    
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Server error during family update' });
  }
});

// Delete a family
router.delete('/:id', isParent, isFamilyMember, async (req, res) => {
  try {
    const familyId = req.params.id;
    
    // Get current family data
    const currentFamily = await Family.findById(familyId);
    
    if (!currentFamily) {
      return res.status(404).json({ error: 'Family not found' });
    }
    
    // Delete device group in SimpleMDM
    await simpleMdmService.deleteDeviceGroup(currentFamily.simplemdm_group_id);
    
    // Delete family in database (will cascade delete members, profiles, devices)
    await Family.delete(familyId);
    
    res.json({
      message: 'Family deleted successfully'
    });
  } catch (error) {
    console.error('Delete Family Error:', error);
    
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Server error during family deletion' });
  }
});

// Get all profiles for a family
router.get('/:id/profiles', isFamilyMember, async (req, res) => {
  try {
    const familyId = req.params.id;
    
    // Get profiles from database
    const profiles = await Profile.findByFamilyId(familyId);
    
    res.json({ profiles });
  } catch (error) {
    console.error('Get Family Profiles Error:', error);
    res.status(500).json({ error: 'Server error retrieving family profiles' });
  }
});

// Create a profile for a family
router.post('/:id/profiles', isParent, isFamilyMember, validateProfileCreation, async (req, res) => {
  try {
    const familyId = req.params.id;
    const { name, type, description, config } = req.body;
    
    // Get family data
    const family = await Family.findById(familyId);
    
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }
    
    // Validate profile type
    if (!['essential_kids', 'student_mode', 'balanced_teen', 'custom'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid profile type. Must be one of: essential_kids, student_mode, balanced_teen, custom' 
      });
    }
    
    // Generate profile XML based on type
    let mobileconfig;
    
    if (type === 'essential_kids') {
      mobileconfig = simpleMdmService.generateEssentialKidsProfile(family.name);
    } else if (type === 'student_mode') {
      mobileconfig = simpleMdmService.generateStudentModeProfile(family.name);
    } else if (type === 'balanced_teen') {
      mobileconfig = simpleMdmService.generateBalancedTeenProfile(family.name);
    } else if (type === 'custom') {
      if (!config) {
        return res.status(400).json({ error: 'Config is required for custom profiles' });
      }
      
      mobileconfig = simpleMdmService.generateCustomProfile(family.name, config);
    }
    
    // Create profile in SimpleMDM
    const simpleMdmProfile = await simpleMdmService.createProfile(name, mobileconfig);
    
    // Assign profile to assignment group in SimpleMDM
    await simpleMdmService.assignProfileToGroup(simpleMdmProfile.id, family.simplemdm_group_id);
    
    // Create profile in database
    const profile = await Profile.create({
      name,
      familyId,
      simpleMdmProfileId: simpleMdmProfile.id,
      type,
      description,
      config: config || Profile.getDefaultProfiles()[type].config
    });
    
    res.status(201).json({
      message: 'Profile created successfully',
      profile
    });
  } catch (error) {
    console.error('Create Profile Error:', error);
    
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Server error during profile creation' });
  }
});

// Get all profiles for a family
router.get('/:id/profiles', isFamilyMember, async (req, res) => {
  try {
    const familyId = req.params.id;
    
    // Get profiles from database
    const profiles = await Profile.findByFamilyId(familyId);
    
    res.json({ profiles });
  } catch (error) {
    console.error('Get Family Profiles Error:', error);
    res.status(500).json({ error: 'Server error retrieving family profiles' });
  }
});

module.exports = router;