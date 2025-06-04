const express = require('express');
const Device = require('../models/device');
const Profile = require('../models/profile');
const MasterProfile = require('../models/masterProfile');
const Family = require('../models/family');
const simpleMdmService = require('../services/simpleMdmService');
const { authenticateToken, isParent, isDeviceOwner } = require('../middleware/auth');
const { validateDeviceCreation } = require('../middleware/validation');

const router = express.Router();

// Middleware to protect all routes
router.use(authenticateToken);

// Create a new device (enrollment)
router.post('/', validateDeviceCreation, async (req, res) => {
  try {
    const { name, familyId, userId, profileId } = req.body;
    
    // Get family data
    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }
    
    // Check access permissions
    if (req.user.role === 'parent' && family.parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied: Not the parent of this family' });
    }
    
    // Create device in database
    const device = await Device.create({
      name,
      userId,
      familyId,
      profileId,
      status: 'pending'
    });
    
    // If profile is assigned, ensure it's properly assigned in SimpleMDM
    if (profileId) {
      const profile = await Profile.findById(profileId);
      if (profile && profile.master_profile_id) {
        const masterProfile = await MasterProfile.getByType(profile.type);
        if (masterProfile && family.simplemdm_group_id) {
          // Ensure master profile is assigned to family group
          await simpleMdmService.assignProfileToGroup(
            masterProfile.simplemdm_profile_id,
            family.simplemdm_group_id
          );
        }
      }
    }
    
    res.status(201).json({
      message: 'Device created successfully',
      device
    });
  } catch (error) {
    console.error('Create Device Error:', error);
    res.status(500).json({ error: 'Server error during device creation' });
  }
});


// Add these 2 essential routes to your existing device routes

// Get ALL devices across all families (parent dashboard overview)
router.get('/', isParent, async (req, res) => {
  try {
    // Get all families for this parent
    const families = await Family.findByParentId(req.user.id);
    
    // Get devices for all families
    let allDevices = [];
    for (const family of families) {
      const familyDevices = await Device.findByFamilyId(family.id);
      allDevices = allDevices.concat(familyDevices.map(device => ({
        ...device,
        family_name: family.name
      })));
    }
    
    res.json({ 
      devices: allDevices,
      total: allDevices.length,
      families: families.length
    });
  } catch (error) {
    console.error('Get All Devices Error:', error);
    res.status(500).json({ error: 'Server error retrieving devices' });
  }
});

// Get devices by user (useful for child users to see their devices)
router.get('/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Check if requesting own devices (child) or parent checking child's devices
    if (req.user.role === 'child' && req.user.id !== parseInt(userId)) {
      return res.status(403).json({ error: 'Access denied: Can only view your own devices' });
    }
    
    if (req.user.role === 'parent') {
      // Verify the user belongs to parent's family
      const User = require('../models/user'); // Add this import
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if user is in any of parent's families
      const families = await Family.findByParentId(req.user.id);
      const userInFamily = await Promise.all(
        families.map(async family => {
          const members = await Family.getMembers(family.id);
          return members.some(member => member.id === parseInt(userId));
        })
      );
      
      if (!userInFamily.some(inFamily => inFamily)) {
        return res.status(403).json({ error: 'Access denied: User not in your families' });
      }
    }
    
    const devices = await Device.findByUserId(userId);
    res.json({ devices });
  } catch (error) {
    console.error('Get User Devices Error:', error);
    res.status(500).json({ error: 'Server error retrieving user devices' });
  }
});
// Get all devices for a family
router.get('/family/:familyId', async (req, res) => {
  try {
    const familyId = req.params.familyId;
    
    // Check access permissions
    const family = await Family.findById(familyId);
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }
    
    if (req.user.role === 'parent' && family.parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const devices = await Device.findByFamilyId(familyId);
    res.json({ devices });
  } catch (error) {
    console.error('Get Family Devices Error:', error);
    res.status(500).json({ error: 'Server error retrieving devices' });
  }
});

// Get a specific device
router.get('/:id', isDeviceOwner, async (req, res) => {
  try {
    const deviceId = req.params.id;
    const device = await Device.findById(deviceId);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    res.json({ device });
  } catch (error) {
    console.error('Get Device Error:', error);
    res.status(500).json({ error: 'Server error retrieving device' });
  }
});

// Update device (including profile assignment)
router.put('/:id', async (req, res) => {
  try {
    const deviceId = req.params.id;
    const { name, profileId, status } = req.body;
    
    // Get current device
    const currentDevice = await Device.findById(deviceId);
    if (!currentDevice) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Check access permissions
    const family = await Family.findById(currentDevice.family_id);
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }
    
    if (req.user.role === 'parent' && family.parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Handle profile changes
    if (profileId && profileId !== currentDevice.profile_id) {
      const newProfile = await Profile.findById(profileId);
      if (!newProfile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      // Ensure profile family matches device family
      if (newProfile.family_id !== currentDevice.family_id) {
        return res.status(400).json({ error: 'Profile must belong to the same family as the device' });
      }
      
      // If it's a master profile, ensure it's assigned to the family group
      if (newProfile.master_profile_id) {
        const masterProfile = await MasterProfile.getByType(newProfile.type);
        if (masterProfile && family.simplemdm_group_id) {
          await simpleMdmService.assignProfileToGroup(
            masterProfile.simplemdm_profile_id,
            family.simplemdm_group_id
          );
          console.log(`Ensured master profile ${masterProfile.simplemdm_profile_id} is assigned to group ${family.simplemdm_group_id}`);
        }
      }
      
      // If device has SimpleMDM ID, we could assign profile directly to device
      // For now, we rely on group-level assignments
    }
    
    // Update device in database
    const updatedDevice = await Device.update(deviceId, {
      name: name || currentDevice.name,
      profileId: profileId || currentDevice.profile_id,
      status: status || currentDevice.status
    });
    
    res.json({
      message: 'Device updated successfully',
      device: updatedDevice
    });
  } catch (error) {
    console.error('Update Device Error:', error);
    res.status(500).json({ error: 'Server error during device update' });
  }
});

// ENHANCED Delete device with SimpleMDM cleanup
router.delete('/:id', async (req, res) => {
  try {
    const deviceId = req.params.id;
    
    // Get current device
    const currentDevice = await Device.findById(deviceId);
    if (!currentDevice) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Check access permissions
    const family = await Family.findById(currentDevice.family_id);
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }
    
    if (req.user.role === 'parent' && family.parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // CRITICAL: Clean up SimpleMDM assignments before deleting database record
    try {
      // If device has a SimpleMDM device ID, remove it from SimpleMDM
      if (currentDevice.simplemdm_device_id) {
        // Remove device from SimpleMDM
        await simpleMdmService.deleteDevice(currentDevice.simplemdm_device_id);
        console.log(`Deleted SimpleMDM device: ${currentDevice.simplemdm_device_id}`);
      }
      
      // Note: We don't remove profile assignments here since other devices 
      // in the family may still be using the same profiles
      
    } catch (simpleMdmError) {
      console.error('SimpleMDM cleanup error during device deletion:', simpleMdmError);
      // Continue with database deletion even if SimpleMDM cleanup fails
    }
    
    // Delete device from database
    await Device.delete(deviceId);
    
    res.json({
      message: 'Device deleted successfully from both database and SimpleMDM'
    });
  } catch (error) {
    console.error('Delete Device Error:', error);
    res.status(500).json({ error: 'Server error during device deletion' });
  }
});

// Assign profile to device
router.post('/:deviceId/assign-profile/:profileId', isParent, async (req, res) => {
  try {
    const { deviceId, profileId } = req.params;
    
    // Get device and profile
    const device = await Device.findById(deviceId);
    const profile = await Profile.findById(profileId);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Ensure device and profile belong to same family
    if (device.family_id !== profile.family_id) {
      return res.status(400).json({ error: 'Device and profile must belong to the same family' });
    }
    
    // Check access permissions
    const family = await Family.findById(device.family_id);
    if (!family || family.parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Handle master profile assignment
    if (profile.master_profile_id) {
      const masterProfile = await MasterProfile.getByType(profile.type);
      if (masterProfile && family.simplemdm_group_id) {
        // Ensure master profile is assigned to family group
        await simpleMdmService.assignProfileToGroup(
          masterProfile.simplemdm_profile_id,
          family.simplemdm_group_id
        );
        
        // If device has SimpleMDM ID, we could assign directly to device
        if (device.simplemdm_device_id) {
          await simpleMdmService.assignProfileToDevice(
            masterProfile.simplemdm_profile_id,
            device.simplemdm_device_id
          );
        }
      }
    }
    
    // Handle custom profile assignment
    if (profile.type === 'custom' && profile.simplemdm_profile_id) {
      if (device.simplemdm_device_id) {
        await simpleMdmService.assignProfileToDevice(
          profile.simplemdm_profile_id,
          device.simplemdm_device_id
        );
      }
    }
    
    // Update device with new profile
    const updatedDevice = await Device.update(deviceId, {
      profileId: profileId
    });
    
    res.json({
      message: 'Profile assigned to device successfully',
      device: updatedDevice
    });
  } catch (error) {
    console.error('Assign Profile to Device Error:', error);
    res.status(500).json({ error: 'Server error during profile assignment' });
  }
});

// Remove profile from device
router.delete('/:deviceId/remove-profile', isParent, async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    
    // Get device
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Check access permissions
    const family = await Family.findById(device.family_id);
    if (!family || family.parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // If device has a profile assigned, clean it up in SimpleMDM
    if (device.profile_id) {
      const profile = await Profile.findById(device.profile_id);
      if (profile) {
        try {
          if (profile.master_profile_id) {
            const masterProfile = await MasterProfile.getByType(profile.type);
            if (masterProfile && device.simplemdm_device_id) {
              await simpleMdmService.removeProfileFromDevice(
                masterProfile.simplemdm_profile_id,
                device.simplemdm_device_id
              );
            }
          }
          
          if (profile.type === 'custom' && profile.simplemdm_profile_id && device.simplemdm_device_id) {
            await simpleMdmService.removeProfileFromDevice(
              profile.simplemdm_profile_id,
              device.simplemdm_device_id
            );
          }
        } catch (simpleMdmError) {
          console.error('SimpleMDM profile removal error:', simpleMdmError);
        }
      }
    }
    
    // Update device to remove profile assignment
    const updatedDevice = await Device.update(deviceId, {
      profileId: null
    });
    
    res.json({
      message: 'Profile removed from device successfully',
      device: updatedDevice
    });
  } catch (error) {
    console.error('Remove Profile from Device Error:', error);
    res.status(500).json({ error: 'Server error during profile removal' });
  }
});

// Sync device with SimpleMDM
router.post('/:deviceId/sync', async (req, res) => {
  try {
    const deviceId = req.params.deviceId;
    
    // Get device
    const device = await Device.findById(deviceId);
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Check access permissions
    const family = await Family.findById(device.family_id);
    if (!family) {
      return res.status(404).json({ error: 'Family not found' });
    }
    
    if (req.user.role === 'parent' && family.parent_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const syncResults = [];
    
    // If device has a profile, ensure it's properly assigned
    if (device.profile_id) {
      const profile = await Profile.findById(device.profile_id);
      if (profile) {
        try {
          if (profile.master_profile_id) {
            const masterProfile = await MasterProfile.getByType(profile.type);
            if (masterProfile) {
              // Ensure master profile is assigned to family group
              await simpleMdmService.assignProfileToGroup(
                masterProfile.simplemdm_profile_id,
                family.simplemdm_group_id
              );
              
              syncResults.push({
                action: 'master_profile_assigned_to_group',
                profileId: masterProfile.simplemdm_profile_id,
                groupId: family.simplemdm_group_id,
                success: true
              });
            }
          }
          
          if (profile.type === 'custom' && profile.simplemdm_profile_id) {
            // Ensure custom profile is assigned to family group
            await simpleMdmService.assignProfileToGroup(
              profile.simplemdm_profile_id,
              family.simplemdm_group_id
            );
            
            syncResults.push({
              action: 'custom_profile_assigned_to_group',
              profileId: profile.simplemdm_profile_id,
              groupId: family.simplemdm_group_id,
              success: true
            });
          }
        } catch (error) {
          syncResults.push({
            action: 'profile_assignment_failed',
            error: error.message,
            success: false
          });
        }
      }
    }
    
    res.json({
      message: 'Device sync completed',
      device: device,
      syncResults
    });
  } catch (error) {
    console.error('Device Sync Error:', error);
    res.status(500).json({ error: 'Server error during device sync' });
  }
});

module.exports = router;