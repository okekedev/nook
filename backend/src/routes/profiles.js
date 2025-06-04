const express = require('express');
const Profile = require('../models/profile');
const Family = require('../models/family');
const simpleMdmService = require('../services/simpleMdmService');
const { authenticateToken, isParent } = require('../middleware/auth');
const { validateProfileCreation } = require('../middleware/validation');

const router = express.Router();

// Middleware to protect all routes
router.use(authenticateToken);

// Create a profile (standalone, not family-specific)
router.post('/', isParent, async (req, res) => {
  try {
    const { name, familyId, type, description, config } = req.body;
    
    // Validate required fields
    if (!name || !familyId || !type) {
      return res.status(400).json({ 
        error: 'Name, familyId, and type are required' 
      });
    }
    
    // Get family data to ensure user has access
    const family = await Family.findById(familyId);
    
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }
    
    // Check if user is the parent of this family
    if (family.parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: Not the parent of this family' });
    }
    
    // Validate profile type
    if (!['essential_kids', 'student_mode', 'balanced_teen', 'custom'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid profile type. Must be one of: essential_kids, student_mode, balanced_teen, custom' 
      });
    }
    
    // Generate profile XML and get metadata based on type
    let mobileconfig;
    let finalConfig = config;
    let profileDescription;
    
    if (type === 'essential_kids') {
      mobileconfig = simpleMdmService.generateEssentialKidsProfile(family.name);
      finalConfig = Profile.getDefaultProfiles().essential_kids.config;
      profileDescription = Profile.getProfileMetadata('essential_kids').description;
    } else if (type === 'student_mode') {
      mobileconfig = simpleMdmService.generateStudentModeProfile(family.name);
      finalConfig = Profile.getDefaultProfiles().student_mode.config;
      profileDescription = Profile.getProfileMetadata('student_mode').description;
    } else if (type === 'balanced_teen') {
      mobileconfig = simpleMdmService.generateBalancedTeenProfile(family.name);
      finalConfig = Profile.getDefaultProfiles().balanced_teen.config;
      profileDescription = Profile.getProfileMetadata('balanced_teen').description;
    } else if (type === 'custom') {
      if (!config) {
        return res.status(400).json({ error: 'Config is required for custom profiles' });
      }
      
      mobileconfig = simpleMdmService.generateCustomProfile(family.name, config);
      finalConfig = config;
      profileDescription = description || 'Custom profile with personalized restrictions';
    }
    
    console.log('Creating SimpleMDM profile with name:', name);
    console.log('Profile XML length:', mobileconfig.length);
    
    // Create profile in SimpleMDM
    const simpleMdmProfile = await simpleMdmService.createProfile(name, mobileconfig);
    
    console.log('SimpleMDM profile created:', simpleMdmProfile);
    
    // Assign profile to family's device group in SimpleMDM
    if (family.simplemdm_group_id) {
      console.log('Assigning profile to device group:', family.simplemdm_group_id);
      try {
        await simpleMdmService.assignProfileToGroup(simpleMdmProfile.id, family.simplemdm_group_id);
        console.log('Profile successfully assigned to device group');
      } catch (assignError) {
        console.error('Failed to assign profile to device group:', assignError);
        // Continue anyway - profile is created, just not assigned
      }
    } else {
      console.log('Family has no SimpleMDM group ID, skipping assignment');
    }
    
    // Create profile in database
    const profile = await Profile.create({
      name,
      familyId,
      simpleMdmProfileId: simpleMdmProfile.id,
      type,
      description: profileDescription,
      config: finalConfig
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