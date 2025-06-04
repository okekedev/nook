const express = require('express');
const Family = require('../models/family');
const Profile = require('../models/profile');
const MasterProfile = require('../models/masterProfile');
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

// ENHANCED Delete a family with complete cleanup
router.delete('/:id', isParent, isFamilyMember, async (req, res) => {
  try {
    const familyId = req.params.id;
    
    // Get current family data
    const currentFamily = await Family.findById(familyId);
    
    if (!currentFamily) {
      return res.status(404).json({ error: 'Family not found' });
    }
    
    // CRITICAL: Clean up SimpleMDM assignments before deleting database records
    try {
      // Get all family profiles to clean up assignments
      const familyProfiles = await Profile.findByFamilyId(familyId);
      
      for (const profile of familyProfiles) {
        // Clean up custom profiles
        if (profile.type === 'custom' && profile.simplemdm_profile_id) {
          await simpleMdmService.deleteProfile(profile.simplemdm_profile_id);
          console.log(`Deleted custom SimpleMDM profile: ${profile.simplemdm_profile_id}`);
        }
        
        // Clean up master profile assignments
        if (profile.master_profile_id && currentFamily.simplemdm_group_id) {
          const masterProfile = await MasterProfile.getByType(profile.type);
          if (masterProfile) {
            await simpleMdmService.removeProfileFromGroup(
              masterProfile.simplemdm_profile_id, 
              currentFamily.simplemdm_group_id
            );
            console.log(`Removed master profile ${masterProfile.simplemdm_profile_id} from group ${currentFamily.simplemdm_group_id}`);
          }
        }
      }
      
      // Delete device group in SimpleMDM
      await simpleMdmService.deleteDeviceGroup(currentFamily.simplemdm_group_id);
      console.log(`Deleted SimpleMDM device group: ${currentFamily.simplemdm_group_id}`);
      
    } catch (simpleMdmError) {
      console.error('SimpleMDM cleanup error during family deletion:', simpleMdmError);
      // Continue with database deletion even if SimpleMDM cleanup fails
    }
    
    // Delete family in database (will cascade delete members, profiles, devices)
    await Family.delete(familyId);
    
    res.json({
      message: 'Family and all associated data deleted successfully from both database and SimpleMDM'
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
    
    // Enrich profiles with master profile information
    const enrichedProfiles = await Promise.all(profiles.map(async (profile) => {
      if (profile.master_profile_id) {
        const masterProfile = await MasterProfile.getByType(profile.type);
        return {
          ...profile,
          masterProfile: masterProfile ? {
            id: masterProfile.id,
            name: masterProfile.name,
            simpleMdmId: masterProfile.simplemdm_profile_id
          } : null
        };
      }
      return profile;
    }));
    
    res.json({ profiles: enrichedProfiles });
  } catch (error) {
    console.error('Get Family Profiles Error:', error);
    res.status(500).json({ error: 'Server error retrieving family profiles' });
  }
});

// Create a profile for a family (using shared master profiles)
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
    if (!['first_phone', 'explorer', 'guardian', 'time_out', 'custom'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid profile type. Must be one of: first_phone, explorer, guardian, time_out, custom' 
      });
    }
    
    let masterProfileId = null;
    let finalConfig;
    let profileDescription;
    
    if (type === 'custom') {
      // Custom profiles still create individual SimpleMDM profiles
      if (!config) {
        return res.status(400).json({ error: 'Config is required for custom profiles' });
      }
      
      const mobileconfig = simpleMdmService.generateCustomProfile(family.name, config);
      
      // Create individual SimpleMDM profile for custom profiles
      const simpleMdmProfile = await simpleMdmService.createProfile(name, mobileconfig);
      
      // Assign to family's device group
      await simpleMdmService.assignProfileToGroup(simpleMdmProfile.id, family.simplemdm_group_id);
      
      // Create profile in database
      const profile = await Profile.create({
        name,
        familyId,
        simpleMdmProfileId: simpleMdmProfile.id,
        masterProfileId: null,
        type,
        description: description || 'Custom profile with personalized restrictions',
        config: config
      });
      
      return res.status(201).json({
        message: 'Custom profile created successfully',
        profile
      });
    } else {
      // Use shared master profiles for predefined types
      const masterProfile = await MasterProfile.getByType(type);
      
      if (!masterProfile) {
        return res.status(404).json({ 
          error: `Master profile for type '${type}' not found. Please run setup-master-profiles.js first.` 
        });
      }
      
      masterProfileId = masterProfile.id;
      finalConfig = Profile.getProfileMetadata(type);
      profileDescription = masterProfile.description;
      
      // Assign existing master profile to family's device group
      console.log(`Assigning master profile ${masterProfile.simplemdm_profile_id} to device group ${family.simplemdm_group_id}`);
      await simpleMdmService.assignProfileToGroup(masterProfile.simplemdm_profile_id, family.simplemdm_group_id);
      
      // Create profile record in database (references master profile)
      const profile = await Profile.create({
        name,
        familyId,
        simpleMdmProfileId: null, // No individual SimpleMDM profile for predefined types
        masterProfileId: masterProfileId,
        type,
        description: profileDescription,
        config: finalConfig
      });
      
      res.status(201).json({
        message: 'Profile created successfully using shared master profile',
        profile,
        masterProfile: {
          id: masterProfile.id,
          name: masterProfile.name,
          simpleMdmId: masterProfile.simplemdm_profile_id
        }
      });
    }
  } catch (error) {
    console.error('Create Profile Error:', error);
    
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Server error during profile creation' });
  }
});

module.exports = router;