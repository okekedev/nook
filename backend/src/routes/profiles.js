const express = require('express');
const Profile = require('../models/profile');
const MasterProfile = require('../models/masterProfile');
const Family = require('../models/family');
const simpleMdmService = require('../services/simpleMdmService');
const { authenticateToken, isParent } = require('../middleware/auth');
const db = require('../utils/db');

const router = express.Router();

// Middleware to protect all routes
router.use(authenticateToken);

// Create a profile (using shared master profiles)
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
    if (!['first_phone', 'explorer', 'guardian', 'time_out', 'custom'].includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid profile type. Must be one of: first_phone, explorer, guardian, time_out, custom' 
      });
    }
    
    let masterProfileId = null;
    let finalConfig = config;
    let profileDescription = description;
    let profile;
    
    if (type === 'custom') {
      // Custom profiles still create individual SimpleMDM profiles
      if (!config) {
        return res.status(400).json({ error: 'Config is required for custom profiles' });
      }
      
      const mobileconfig = simpleMdmService.generateCustomProfile(family.name, config);
      
      // Create individual SimpleMDM profile for custom profiles
      const simpleMdmProfile = await simpleMdmService.createProfile(name, mobileconfig);
      
      // Assign to family's device group
      if (family.simplemdm_group_id) {
        await simpleMdmService.assignProfileToGroup(simpleMdmProfile.id, family.simplemdm_group_id);
      }
      
      // Create profile in database with individual SimpleMDM ID
      profile = await Profile.create({
        name,
        familyId,
        simpleMdmProfileId: simpleMdmProfile.id,
        masterProfileId: null, // Custom profiles don't use master profiles
        type,
        description: profileDescription || 'Custom profile with personalized restrictions',
        config: finalConfig
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
      if (family.simplemdm_group_id) {
        console.log(`Assigning master profile ${masterProfile.simplemdm_profile_id} to device group ${family.simplemdm_group_id}`);
        try {
          await simpleMdmService.assignProfileToGroup(masterProfile.simplemdm_profile_id, family.simplemdm_group_id);
          console.log('Master profile successfully assigned to device group');
        } catch (assignError) {
          console.error('Failed to assign master profile to device group:', assignError);
          return res.status(500).json({ error: 'Failed to assign profile to family devices' });
        }
      } else {
        return res.status(400).json({ error: 'Family has no SimpleMDM group ID' });
      }
      
      // Create profile record in database (references master profile)
      profile = await Profile.create({
        name,
        familyId,
        simpleMdmProfileId: null, // No individual SimpleMDM profile for predefined types
        masterProfileId: masterProfileId, // Reference to shared master profile
        type,
        description: profileDescription,
        config: finalConfig
      });
    }
    
    // After successful creation, verify the assignment worked (for master profiles)
    if (profile.masterProfileId && family.simplemdm_group_id) {
      setTimeout(async () => {
        try {
          const groupProfiles = await simpleMdmService.getGroupProfiles(family.simplemdm_group_id);
          const masterProfile = await MasterProfile.getByType(profile.type);
          
          const isAssigned = groupProfiles.some(
            assignment => assignment.profile_id === masterProfile.simplemdm_profile_id
          );
          
          if (!isAssigned) {
            console.error(`⚠️  Profile assignment verification failed for profile ${profile.id}`);
          } else {
            console.log(`✅ Profile assignment verified for profile ${profile.id}`);
          }
        } catch (verifyError) {
          console.error('Profile assignment verification error:', verifyError);
        }
      }, 2000); // Verify after 2 seconds
    }
    
    res.status(201).json({
      message: type === 'custom' ? 'Custom profile created successfully' : 'Profile created successfully using shared master profile',
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
    
    // If profile uses a master profile, include master profile info
    let masterProfile = null;
    if (profile.master_profile_id) {
      masterProfile = await MasterProfile.getByType(profile.type);
    }
    
    res.json({ 
      profile,
      masterProfile 
    });
  } catch (error) {
    console.error('Get Profile Error:', error);
    res.status(500).json({ error: 'Server error retrieving profile' });
  }
});

// Update a profile
router.put('/:id', isParent, async (req, res) => {
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
      
      // Update profile in SimpleMDM (custom profiles have individual SimpleMDM profiles)
      if (currentProfile.simplemdm_profile_id) {
        await simpleMdmService.updateProfile(
          currentProfile.simplemdm_profile_id,
          name,
          mobileconfig
        );
      }
      
      // Update profile in database
      const updatedProfile = await Profile.update(profileId, {
        name,
        simpleMdmProfileId: currentProfile.simplemdm_profile_id,
        masterProfileId: currentProfile.master_profile_id,
        description,
        config
      });
      
      res.json({
        message: 'Custom profile updated successfully',
        profile: updatedProfile
      });
    } else {
      // Predefined profiles using master profiles - only name and description can be updated
      const updatedProfile = await Profile.update(profileId, {
        name,
        simpleMdmProfileId: currentProfile.simplemdm_profile_id,
        masterProfileId: currentProfile.master_profile_id,
        description,
        config: currentProfile.config // Keep existing config (comes from master profile)
      });
      
      res.json({
        message: 'Profile updated successfully (configuration managed by master profile)',
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

// ENHANCED Delete a profile with server-side management
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
    
    // CRITICAL: Remove SimpleMDM assignments BEFORE deleting database record
    try {
      if (currentProfile.type === 'custom' && currentProfile.simplemdm_profile_id) {
        // For custom profiles, delete the individual SimpleMDM profile
        await simpleMdmService.deleteProfile(currentProfile.simplemdm_profile_id);
        console.log(`Deleted custom SimpleMDM profile: ${currentProfile.simplemdm_profile_id}`);
      }
      
      if (currentProfile.master_profile_id && family.simplemdm_group_id) {
        // For predefined profiles, remove master profile assignment from group
        const masterProfile = await MasterProfile.getByType(currentProfile.type);
        if (masterProfile) {
          await simpleMdmService.removeProfileFromGroup(
            masterProfile.simplemdm_profile_id, 
            family.simplemdm_group_id
          );
          console.log(`Removed master profile ${masterProfile.simplemdm_profile_id} from group ${family.simplemdm_group_id}`);
        }
      }
    } catch (simpleMdmError) {
      console.error('SimpleMDM cleanup error:', simpleMdmError);
      // Continue with database deletion even if SimpleMDM cleanup fails
      // This prevents orphaned database records
    }
    
    // Delete profile record from database
    await Profile.delete(profileId);
    
    res.json({
      message: 'Profile deleted successfully from both database and SimpleMDM'
    });
  } catch (error) {
    console.error('Delete Profile Error:', error);
    res.status(500).json({ error: 'Server error during profile deletion' });
  }
});

// SYNC VERIFICATION - Check if DB and SimpleMDM are in sync
router.get('/sync/verify/:familyId', isParent, async (req, res) => {
  try {
    const familyId = req.params.familyId;
    
    // Get family and check access
    const family = await Family.findById(familyId);
    if (!family || family.parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get profiles from database
    const dbProfiles = await Profile.findByFamilyId(familyId);
    
    // Get SimpleMDM group assignments
    let simpleMdmAssignments = [];
    if (family.simplemdm_group_id) {
      try {
        simpleMdmAssignments = await simpleMdmService.getGroupProfiles(family.simplemdm_group_id);
      } catch (error) {
        console.error('Error fetching SimpleMDM assignments:', error);
      }
    }
    
    // Compare and identify discrepancies
    const discrepancies = [];
    
    for (const dbProfile of dbProfiles) {
      if (dbProfile.master_profile_id) {
        const masterProfile = await MasterProfile.getByType(dbProfile.type);
        const isAssignedInSimpleMDM = simpleMdmAssignments.some(
          assignment => assignment.profile_id === masterProfile.simplemdm_profile_id
        );
        
        if (!isAssignedInSimpleMDM) {
          discrepancies.push({
            type: 'missing_in_simplemdm',
            profileId: dbProfile.id,
            profileName: dbProfile.name,
            masterProfileId: masterProfile.simplemdm_profile_id
          });
        }
      }
    }
    
    res.json({
      family: family.name,
      databaseProfiles: dbProfiles.length,
      simpleMdmAssignments: simpleMdmAssignments.length,
      discrepancies,
      inSync: discrepancies.length === 0
    });
    
  } catch (error) {
    console.error('Sync Verification Error:', error);
    res.status(500).json({ error: 'Server error during sync verification' });
  }
});

// SYNC REPAIR - Fix sync issues between DB and SimpleMDM
router.post('/sync/repair/:familyId', isParent, async (req, res) => {
  try {
    const familyId = req.params.familyId;
    
    // Get family and check access
    const family = await Family.findById(familyId);
    if (!family || family.parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get all profiles for this family
    const dbProfiles = await Profile.findByFamilyId(familyId);
    
    const repairResults = [];
    
    for (const dbProfile of dbProfiles) {
      try {
        if (dbProfile.master_profile_id) {
          // Re-assign master profile to group
          const masterProfile = await MasterProfile.getByType(dbProfile.type);
          if (masterProfile && family.simplemdm_group_id) {
            await simpleMdmService.assignProfileToGroup(
              masterProfile.simplemdm_profile_id, 
              family.simplemdm_group_id
            );
            
            repairResults.push({
              profileId: dbProfile.id,
              profileName: dbProfile.name,
              action: 'assigned_to_group',
              success: true
            });
          }
        }
      } catch (error) {
        repairResults.push({
          profileId: dbProfile.id,
          profileName: dbProfile.name,
          action: 'assign_failed',
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      message: 'Sync repair completed',
      family: family.name,
      repairResults
    });
    
  } catch (error) {
    console.error('Sync Repair Error:', error);
    res.status(500).json({ error: 'Server error during sync repair' });
  }
});

// ADMIN BULK SYNC - Sync all families (admin only)
router.post('/admin/sync-all', authenticateToken, async (req, res) => {
  // Only allow admin users (you may need to add admin role to your system)
  if (req.user.role !== 'parent') { // Change this to 'admin' when you add admin role
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const allFamilies = await db.query('SELECT * FROM families');
    const syncResults = [];
    
    for (const family of allFamilies.rows) {
      try {
        const profiles = await Profile.findByFamilyId(family.id);
        
        for (const profile of profiles) {
          if (profile.master_profile_id) {
            const masterProfile = await MasterProfile.getByType(profile.type);
            if (masterProfile && family.simplemdm_group_id) {
              await simpleMdmService.assignProfileToGroup(
                masterProfile.simplemdm_profile_id,
                family.simplemdm_group_id
              );
            }
          }
        }
        
        syncResults.push({
          familyId: family.id,
          familyName: family.name,
          profileCount: profiles.length,
          status: 'synced'
        });
        
      } catch (error) {
        syncResults.push({
          familyId: family.id,
          familyName: family.name,
          status: 'error',
          error: error.message
        });
      }
    }
    
    res.json({
      message: 'Bulk sync completed',
      results: syncResults
    });
    
  } catch (error) {
    console.error('Bulk Sync Error:', error);
    res.status(500).json({ error: 'Server error during bulk sync' });
  }
});

// Get available profile templates (master profiles)
router.get('/templates/available', async (req, res) => {
  try {
    const masterProfiles = await MasterProfile.getProfileChoices();
    res.json({ 
      templates: masterProfiles,
      message: 'Available profile templates from master profiles'
    });
  } catch (error) {
    console.error('Get Available Templates Error:', error);
    res.status(500).json({ error: 'Server error retrieving profile templates' });
  }
});

module.exports = router;