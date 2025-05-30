const express = require('express');
const Profile = require('../models/profile');
const Family = require('../models/family');
const simpleMdmService = require('../services/simpleMdmService');
const { authenticateToken, isParent, isFamilyMember } = require('../middleware/auth');
const { validateProfileCreation } = require('../middleware/validation');

const router = express.Router();

// Middleware to protect all routes
router.use(authenticateToken);

// Get a specific profile by ID
router.get('/:id', async (req, res) => {
  try {
    const profileId = req.params.id;
    
    // Get profile from database
    const profile = await Profile.findById(profileId);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Check if user has access to this profile
    const family = await Family.findById(profile.family_id);
    
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }
    
    // Parent access check
    if (req.user.role === 'parent' && family.parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: Not the parent of this family' });
    }
    
    // Child access check
    if (req.user.role === 'child') {
      const members = await Family.getMembers(profile.family_id);
      const isMember = members.some(member => member.id === req.user.id);
      
      if (!isMember) {
        return res.status(403).json({ error: 'Access denied: Not a member of this family' });
      }
    }
    
    res.json({ profile });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ error: 'Server error retrieving profile' });
  }
});

// Create a new profile
router.post('/', isParent, validateProfileCreation, async (req, res) => {
  try {
    const { name, familyId, type, description, config } = req.body;
    
    // Get family data and verify ownership
    const family = await Family.findById(familyId);
    
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }
    
    if (family.parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: Not the parent of this family' });
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
    
    // For now, let's skip the assignment to group and just create the profile
    // We can assign it later when devices are enrolled
    console.log('Created SimpleMDM profile:', simpleMdmProfile);
    
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

// Update a profile
router.put('/:id', isParent, validateProfileCreation, async (req, res) => {
  try {
    const profileId = req.params.id;
    const { name, description, config } = req.body;
    
    // Get current profile data
    const currentProfile = await Profile.findById(profileId);
    
    if (!currentProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Check if user has access to this profile
    const family = await Family.findById(currentProfile.family_id);
    
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }
    
    if (family.parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: Not the parent of this family' });
    }
    
    // Custom profiles can be fully updated
    if (currentProfile.type === 'custom') {
      if (!config) {
        return res.status(400).json({ error: 'Config is required for custom profiles' });
      }
      
      // Generate updated XML
      const mobileconfig = simpleMdmService.generateCustomProfile(family.name, config);
      
      // Update profile in SimpleMDM
      await simpleMdmService.updateProfile(
        currentProfile.simplemdm_profile_id,
        name,
        mobileconfig
      );
      
      // Update profile in database
      const updatedProfile = await Profile.update(profileId, {
        name,
        simpleMdmProfileId: currentProfile.simplemdm_profile_id,
        description,
        config
      });
      
      res.json({
        message: 'Profile updated successfully',
        profile: updatedProfile
      });
    } else {
      // Pre-defined profiles can only update name and description
      // Update profile in SimpleMDM
      const preDefinedMobileconfigGenerator = {
        essential_kids: simpleMdmService.generateEssentialKidsProfile,
        student_mode: simpleMdmService.generateStudentModeProfile,
        balanced_teen: simpleMdmService.generateBalancedTeenProfile
      };
      
      const mobileconfig = preDefinedMobileconfigGenerator[currentProfile.type](family.name);
      
      await simpleMdmService.updateProfile(
        currentProfile.simplemdm_profile_id,
        name,
        mobileconfig
      );
      
      // Update profile in database
      const updatedProfile = await Profile.update(profileId, {
        name,
        simpleMdmProfileId: currentProfile.simplemdm_profile_id,
        description,
        config: currentProfile.config
      });
      
      res.json({
        message: 'Profile updated successfully',
        profile: updatedProfile
      });
    }
  } catch (error) {
    console.error('Update Profile Error:', error);
    
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Server error during profile update' });
  }
});

// Delete a profile
router.delete('/:id', isParent, async (req, res) => {
  try {
    const profileId = req.params.id;
    
    // Get current profile data
    const currentProfile = await Profile.findById(profileId);
    
    if (!currentProfile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Check if user has access to this profile
    const family = await Family.findById(currentProfile.family_id);
    
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }
    
    if (family.parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: Not the parent of this family' });
    }
    
    // Delete profile in SimpleMDM
    await simpleMdmService.deleteProfile(currentProfile.simplemdm_profile_id);
    
    // Delete profile in database
    await Profile.delete(profileId);
    
    res.json({
      message: 'Profile deleted successfully'
    });
  } catch (error) {
    console.error('Delete Profile Error:', error);
    
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Server error during profile deletion' });
  }
});

// Get default profile templates
router.get('/templates/default', async (req, res) => {
  try {
    const defaultProfiles = Profile.getDefaultProfiles();
    res.json({ templates: defaultProfiles });
  } catch (error) {
    console.error('Get Default Profiles Error:', error);
    res.status(500).json({ error: 'Server error retrieving default profiles' });
  }
});

module.exports = router;