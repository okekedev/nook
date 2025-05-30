const db = require('../utils/db');

class Device {
  // Create a new device
  static async create(deviceData) {
    const { 
      name, 
      userId, 
      familyId, 
      profileId, 
      simpleMdmDeviceId, 
      model, 
      serialNumber, 
      osVersion, 
      status 
    } = deviceData;
    
    try {
      const result = await db.query(
        `INSERT INTO devices (
          name, 
          user_id, 
          family_id, 
          profile_id, 
          simplemdm_device_id, 
          model, 
          serial_number, 
          os_version, 
          status
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id, name, user_id, family_id, profile_id, simplemdm_device_id, 
                   model, serial_number, os_version, status, created_at`,
        [
          name, 
          userId, 
          familyId, 
          profileId, 
          simpleMdmDeviceId, 
          model, 
          serialNumber, 
          osVersion, 
          status || 'pending'
        ]
      );
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find device by ID
  static async findById(id) {
    const result = await db.query(
      `SELECT d.*, p.name as profile_name, p.type as profile_type
       FROM devices d
       LEFT JOIN profiles p ON d.profile_id = p.id
       WHERE d.id = $1`,
      [id]
    );
    
    return result.rows[0];
  }

  // Find device by SimpleMDM ID
  static async findBySimpleMdmId(simpleMdmDeviceId) {
    const result = await db.query(
      `SELECT d.*, p.name as profile_name, p.type as profile_type
       FROM devices d
       LEFT JOIN profiles p ON d.profile_id = p.id
       WHERE d.simplemdm_device_id = $1`,
      [simpleMdmDeviceId]
    );
    
    return result.rows[0];
  }

  // Find devices by family ID
  static async findByFamilyId(familyId) {
    const result = await db.query(
      `SELECT d.*, p.name as profile_name, p.type as profile_type, 
              u.first_name as user_first_name, u.last_name as user_last_name
       FROM devices d
       LEFT JOIN profiles p ON d.profile_id = p.id
       LEFT JOIN users u ON d.user_id = u.id
       WHERE d.family_id = $1
       ORDER BY d.created_at DESC`,
      [familyId]
    );
    
    return result.rows;
  }

  // Find devices by user ID
  static async findByUserId(userId) {
    const result = await db.query(
      `SELECT d.*, p.name as profile_name, p.type as profile_type
       FROM devices d
       LEFT JOIN profiles p ON d.profile_id = p.id
       WHERE d.user_id = $1
       ORDER BY d.created_at DESC`,
      [userId]
    );
    
    return result.rows;
  }

  // Update device
  static async update(id, deviceData) {
    const { 
      name, 
      userId, 
      profileId, 
      model, 
      serialNumber, 
      osVersion, 
      status 
    } = deviceData;
    
    const result = await db.query(
      `UPDATE devices
       SET name = $1, 
           user_id = $2, 
           profile_id = $3, 
           model = $4, 
           serial_number = $5, 
           os_version = $6, 
           status = $7, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING id, name, user_id, family_id, profile_id, simplemdm_device_id, 
                 model, serial_number, os_version, status, created_at, updated_at`,
      [name, userId, profileId, model, serialNumber, osVersion, status, id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('Device not found');
      error.status = 404;
      throw error;
    }
    
    return result.rows[0];
  }

  // Update SimpleMDM device ID
  static async updateSimpleMdmId(id, simpleMdmDeviceId) {
    const result = await db.query(
      `UPDATE devices
       SET simplemdm_device_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, simplemdm_device_id`,
      [simpleMdmDeviceId, id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('Device not found');
      error.status = 404;
      throw error;
    }
    
    return result.rows[0];
  }

  // Update device status
  static async updateStatus(id, status) {
    const result = await db.query(
      `UPDATE devices
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, status`,
      [status, id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('Device not found');
      error.status = 404;
      throw error;
    }
    
    return result.rows[0];
  }

  // Block app on device
  static async blockApp(deviceId, appData) {
    const { appBundleId, appName } = appData;
    
    try {
      const result = await db.query(
        `INSERT INTO blocked_apps (device_id, app_bundle_id, app_name)
         VALUES ($1, $2, $3)
         RETURNING id, device_id, app_bundle_id, app_name, created_at`,
        [deviceId, appBundleId, appName]
      );
      
      return result.rows[0];
    } catch (error) {
      // Handle duplicate app
      if (error.code === '23505') { // unique_violation
        const err = new Error('App is already blocked on this device');
        err.status = 409;
        throw err;
      }
      throw error;
    }
  }

  // Unblock app on device
  static async unblockApp(deviceId, appBundleId) {
    const result = await db.query(
      `DELETE FROM blocked_apps
       WHERE device_id = $1 AND app_bundle_id = $2
       RETURNING id`,
      [deviceId, appBundleId]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('Blocked app not found');
      error.status = 404;
      throw error;
    }
    
    return true;
  }

  // Get blocked apps for device
  static async getBlockedApps(deviceId) {
    const result = await db.query(
      `SELECT id, app_bundle_id, app_name, created_at
       FROM blocked_apps
       WHERE device_id = $1
       ORDER BY created_at DESC`,
      [deviceId]
    );
    
    return result.rows;
  }

  // Delete device
  static async delete(id) {
    const result = await db.query(
      `DELETE FROM devices
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('Device not found');
      error.status = 404;
      throw error;
    }
    
    return true;
  }
}

module.exports = Device;