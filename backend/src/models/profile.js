const db = require('../utils/db');
const ProfileGenerators = require('../services/profileGenerators');

class Profile {
  // Create a new profile
  static async create(profileData) {
    const { 
      name, 
      familyId, 
      simpleMdmProfileId, 
      masterProfileId,
      type, 
      description, 
      config 
    } = profileData;
    
    try {
      const result = await db.query(
        `INSERT INTO profiles (name, family_id, simplemdm_profile_id, master_profile_id, type, description, config)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, name, family_id, simplemdm_profile_id, master_profile_id, type, description, config, created_at`,
        [name, familyId, simpleMdmProfileId, masterProfileId, type, description, config]
      );
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find profile by ID
  static async findById(id) {
    const result = await db.query(
      `SELECT id, name, family_id, simplemdm_profile_id, master_profile_id, type, description, config, created_at, updated_at
       FROM profiles
       WHERE id = $1`,
      [id]
    );
    
    return result.rows[0];
  }

  // Find profile by SimpleMDM ID
  static async findBySimpleMdmId(simpleMdmProfileId) {
    const result = await db.query(
      `SELECT id, name, family_id, simplemdm_profile_id, master_profile_id, type, description, config, created_at, updated_at
       FROM profiles
       WHERE simplemdm_profile_id = $1`,
      [simpleMdmProfileId]
    );
    
    return result.rows[0];
  }

  // Find profiles by family ID
  static async findByFamilyId(familyId) {
    const result = await db.query(
      `SELECT id, name, family_id, simplemdm_profile_id, master_profile_id, type, description, config, created_at, updated_at
       FROM profiles
       WHERE family_id = $1
       ORDER BY created_at DESC`,
      [familyId]
    );
    
    return result.rows;
  }

  // Find profiles by master profile ID
  static async findByMasterProfileId(masterProfileId) {
    const result = await db.query(
      `SELECT id, name, family_id, simplemdm_profile_id, master_profile_id, type, description, config, created_at, updated_at
       FROM profiles
       WHERE master_profile_id = $1
       ORDER BY created_at DESC`,
      [masterProfileId]
    );
    
    return result.rows;
  }

  // Update profile
  static async update(id, profileData) {
    const { 
      name, 
      simpleMdmProfileId, 
      masterProfileId,
      description, 
      config 
    } = profileData;
    
    const result = await db.query(
      `UPDATE profiles
       SET name = $1, 
           simplemdm_profile_id = $2, 
           master_profile_id = $3,
           description = $4, 
           config = $5, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, name, family_id, simplemdm_profile_id, master_profile_id, type, description, config, created_at, updated_at`,
      [name, simpleMdmProfileId, masterProfileId, description, config, id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('Profile not found');
      error.status = 404;
      throw error;
    }
    
    return result.rows[0];
  }

  // Update SimpleMDM profile ID
  static async updateSimpleMdmId(id, simpleMdmProfileId) {
    const result = await db.query(
      `UPDATE profiles
       SET simplemdm_profile_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id, simplemdm_profile_id`,
      [simpleMdmProfileId, id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('Profile not found');
      error.status = 404;
      throw error;
    }
    
    return result.rows[0];
  }

  // Delete profile
  static async delete(id) {
    // First, update any devices using this profile to set profile_id to null
    await db.query(
      `UPDATE devices
       SET profile_id = NULL, updated_at = CURRENT_TIMESTAMP
       WHERE profile_id = $1`,
      [id]
    );
    
    const result = await db.query(
      `DELETE FROM profiles
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('Profile not found');
      error.status = 404;
      throw error;
    }
    
    return true;
  }

  // Get profile metadata (name, description, target) for a given type
  static getProfileMetadata(type) {
    const metadata = ProfileGenerators.getProfileMetadata();
    return metadata[type] || null;
  }

  // Get effective SimpleMDM profile ID (either individual or from master profile)
  static async getEffectiveSimpleMdmId(profileId) {
    const profile = await this.findById(profileId);
    
    if (!profile) {
      return null;
    }
    
    // If profile has individual SimpleMDM ID (custom profiles)
    if (profile.simplemdm_profile_id) {
      return profile.simplemdm_profile_id;
    }
    
    // If profile uses master profile, get master profile's SimpleMDM ID
    if (profile.master_profile_id) {
      const MasterProfile = require('./masterProfile');
      const masterProfile = await MasterProfile.getByType(profile.type);
      return masterProfile ? masterProfile.simplemdm_profile_id : null;
    }
    
    return null;
  }

  // Check if profile is using shared master profile
  static isUsingMasterProfile(profile) {
    return profile.master_profile_id !== null && profile.simplemdm_profile_id === null;
  }

  // Check if profile is custom (has individual SimpleMDM profile)
  static isCustomProfile(profile) {
    return profile.type === 'custom' && profile.simplemdm_profile_id !== null;
  }

  // Get summary of profile usage across families
  static async getUsageSummary() {
    const result = await db.query(`
      SELECT 
        type,
        COUNT(*) as total_profiles,
        COUNT(DISTINCT family_id) as families_using,
        COUNT(CASE WHEN master_profile_id IS NOT NULL THEN 1 END) as using_master_profile,
        COUNT(CASE WHEN simplemdm_profile_id IS NOT NULL THEN 1 END) as individual_profiles
      FROM profiles 
      GROUP BY type
      ORDER BY total_profiles DESC
    `);
    
    return result.rows;
  }
}

module.exports = Profile;