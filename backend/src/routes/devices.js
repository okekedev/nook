const express = require('express');
const Device = require('../models/device');
const Profile = require('../models/profile');
const Family = require('../models/family');
const simpleMdmService = require('../services/simpleMdmService');
const { authenticateToken, isParent, isDeviceOwner } = require('../middleware/auth');
const { validateDeviceCreation, validateAppBlocking } = require('../middleware/validation');

const router = express.Router();

// Middleware to protect all routes
router.use(authenticateToken);

// Get a specific device by ID
router.get('/:id', isDeviceOwner, async (req, res) => {
  try {
    const deviceId = req.params.id;
    
    // Get device from database
    const device = await Device.findById(deviceId);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Get blocked apps for device
    const blockedApps = await Device.getBlockedApps(deviceId);
    
    res.json({
      device,
      blockedApps
    });
  } catch (error) {
    console.error('Get Device Error:', error);
    res.status(500).json({ error: 'Server error retrieving device' });
  }
});

// Update a device
router.put('/:id', isParent, isDeviceOwner, validateDeviceCreation, async (req, res) => {
  try {
    const deviceId = req.params.id;
    const { name, userId, profileId } = req.body;
    
    // Get current device data
    const currentDevice = await Device.findById(deviceId);
    
    if (!currentDevice) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // If changing profile, get profile data
    let profile = null;
    if (profileId && profileId !== currentDevice.profile_id) {
      profile = await Profile.findById(profileId);
      
      if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
      }
      
      // Make sure profile belongs to same family as device
      if (profile.family_id !== currentDevice.family_id) {
        return res.status(400).json({ error: 'Profile must belong to the same family as device' });
      }
      
      // Remove current profile from device in SimpleMDM if there is one
      if (currentDevice.profile_id) {
        const currentProfile = await Profile.findById(currentDevice.profile_id);
        if (currentProfile && currentProfile.simplemdm_profile_id && currentDevice.simplemdm_device_id) {
          await simpleMdmService.removeProfileFromDevice(
            currentProfile.simplemdm_profile_id, 
            currentDevice.simplemdm_device_id
          );
        }
      }
      
      // Assign new profile to device in SimpleMDM
      if (profile.simplemdm_profile_id && currentDevice.simplemdm_device_id) {
        await simpleMdmService.assignProfileToDevice(
          profile.simplemdm_profile_id, 
          currentDevice.simplemdm_device_id
        );
      }
    }
    
    // Update device in database
    const updatedDevice = await Device.update(deviceId, {
      name,
      userId,
      profileId,
      model: currentDevice.model,
      serialNumber: currentDevice.serial_number,
      osVersion: currentDevice.os_version,
      status: currentDevice.status
    });
    
    res.json({
      message: 'Device updated successfully',
      device: updatedDevice
    });
  } catch (error) {
    console.error('Update Device Error:', error);
    
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Server error during device update' });
  }
});

// Delete a device
router.delete('/:id', isParent, isDeviceOwner, async (req, res) => {
  try {
    const deviceId = req.params.id;
    
    // Get current device data
    const currentDevice = await Device.findById(deviceId);
    
    if (!currentDevice) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Delete device in SimpleMDM if it exists
    if (currentDevice.simplemdm_device_id) {
      try {
        // Remove device from group first
        const family = await Family.findById(currentDevice.family_id);
        if (family && family.simplemdm_group_id) {
          await simpleMdmService.removeDeviceFromGroup(
            currentDevice.simplemdm_device_id, 
            family.simplemdm_group_id
          );
        }
        
        // We don't actually delete the device in SimpleMDM as that would unenroll it
        // Just update status in our database
      } catch (mdmError) {
        console.error('SimpleMDM Error:', mdmError);
        // Continue with local deletion even if SimpleMDM fails
      }
    }
    
    // Delete device in database
    await Device.delete(deviceId);
    
    res.json({
      message: 'Device deleted successfully'
    });
  } catch (error) {
    console.error('Delete Device Error:', error);
    
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Server error during device deletion' });
  }
});

// Update device restrictions
router.put('/:id/restrictions', isParent, isDeviceOwner, async (req, res) => {
  try {
    const deviceId = req.params.id;
    const { profileId } = req.body;
    
    if (!profileId) {
      return res.status(400).json({ error: 'Profile ID is required' });
    }
    
    // Get current device data
    const device = await Device.findById(deviceId);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Get profile data
    const profile = await Profile.findById(profileId);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    // Make sure profile belongs to same family as device
    if (profile.family_id !== device.family_id) {
      return res.status(400).json({ error: 'Profile must belong to the same family as device' });
    }
    
    // Remove current profile from device in SimpleMDM if there is one
    if (device.profile_id) {
      const currentProfile = await Profile.findById(device.profile_id);
      if (currentProfile && currentProfile.simplemdm_profile_id && device.simplemdm_device_id) {
        await simpleMdmService.removeProfileFromDevice(
          currentProfile.simplemdm_profile_id, 
          device.simplemdm_device_id
        );
      }
    }
    
    // Assign new profile to device in SimpleMDM
    if (profile.simplemdm_profile_id && device.simplemdm_device_id) {
      await simpleMdmService.assignProfileToDevice(
        profile.simplemdm_profile_id, 
        device.simplemdm_device_id
      );
    }
    
    // Update device in database
    const updatedDevice = await Device.update(deviceId, {
      name: device.name,
      userId: device.user_id,
      profileId,
      model: device.model,
      serialNumber: device.serial_number,
      osVersion: device.os_version,
      status: device.status
    });
    
    res.json({
      message: 'Device restrictions updated successfully',
      device: updatedDevice
    });
  } catch (error) {
    console.error('Update Device Restrictions Error:', error);
    
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Server error updating device restrictions' });
  }
});

// Block an app on a device
router.post('/:id/apps/block', isParent, isDeviceOwner, validateAppBlocking, async (req, res) => {
  try {
    const deviceId = req.params.id;
    const { appBundleId, appName } = req.body;
    
    // Get current device data
    const device = await Device.findById(deviceId);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Block app in database
    const blockedApp = await Device.blockApp(deviceId, {
      appBundleId,
      appName
    });
    
    // In a real implementation, we would update the device profile in SimpleMDM
    // to block this specific app, but for simplicity we'll just return success
    
    res.status(201).json({
      message: 'App blocked successfully',
      blockedApp
    });
  } catch (error) {
    console.error('Block App Error:', error);
    
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Server error blocking app' });
  }
});

// Allow an app on a device (unblock)
router.post('/:id/apps/allow', isParent, isDeviceOwner, async (req, res) => {
  try {
    const deviceId = req.params.id;
    const { appBundleId } = req.body;
    
    if (!appBundleId) {
      return res.status(400).json({ error: 'App bundle ID is required' });
    }
    
    // Get current device data
    const device = await Device.findById(deviceId);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Unblock app in database
    await Device.unblockApp(deviceId, appBundleId);
    
    // In a real implementation, we would update the device profile in SimpleMDM
    // to allow this specific app, but for simplicity we'll just return success
    
    res.json({
      message: 'App allowed successfully'
    });
  } catch (error) {
    console.error('Allow App Error:', error);
    
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Server error allowing app' });
  }
});

// Lock a device
router.post('/:id/lock', isParent, isDeviceOwner, async (req, res) => {
  try {
    const deviceId = req.params.id;
    const { message } = req.body;
    
    // Get current device data
    const device = await Device.findById(deviceId);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    if (!device.simplemdm_device_id) {
      return res.status(400).json({ error: 'Device is not enrolled in MDM' });
    }
    
    // Lock device in SimpleMDM
    await simpleMdmService.lockDevice(device.simplemdm_device_id, message || 'Device locked by Nook');
    
    res.json({
      message: 'Device locked successfully'
    });
  } catch (error) {
    console.error('Lock Device Error:', error);
    
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    
    res.status(500).json({ error: 'Server error locking device' });
  }
});

// Get blocked apps for a device
router.get('/:id/apps/blocked', isDeviceOwner, async (req, res) => {
  try {
    const deviceId = req.params.id;
    
    // Get device from database
    const device = await Device.findById(deviceId);
    
    if (!device) {
      return res.status(404).json({ error: 'Device not found' });
    }
    
    // Get blocked apps for device
    const blockedApps = await Device.getBlockedApps(deviceId);
    
    res.json({
      blockedApps
    });
  } catch (error) {
    console.error('Get Blocked Apps Error:', error);
    res.status(500).json({ error: 'Server error retrieving blocked apps' });
  }
});

module.exports = router;