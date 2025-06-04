const db = require('../utils/db');

class MasterProfile {
  // Get all master profiles
  static async getAll() {
    const result = await db.query(
      `SELECT id, name, type, description, simplemdm_profile_id, created_at
       FROM master_profiles
       ORDER BY 
         CASE type 
           WHEN 'essential_kids' THEN 1
           WHEN 'student_mode' THEN 2
           WHEN 'balanced_teen' THEN 3
           WHEN 'custom_template' THEN 4
           ELSE 5
         END`
    );
    
    return result.rows;
  }

  // Get master profile by type
  static async getByType(type) {
    const result = await db.query(
      `SELECT id, name, type, description, simplemdm_profile_id, created_at
       FROM master_profiles
       WHERE type = $1`,
      [type]
    );
    
    return result.rows[0];
  }

  // Get master profile by SimpleMDM ID
  static async getBySimpleMdmId(simpleMdmProfileId) {
    const result = await db.query(
      `SELECT id, name, type, description, simplemdm_profile_id, created_at
       FROM master_profiles
       WHERE simplemdm_profile_id = $1`,
      [simpleMdmProfileId]
    );
    
    return result.rows[0];
  }

  // Check if master profiles exist
  static async exist() {
    const result = await db.query(
      `SELECT COUNT(*) as count FROM master_profiles`
    );
    
    return parseInt(result.rows[0].count) > 0;
  }

  // Get master profile IDs for assignment
  static async getAllSimpleMdmIds() {
    const result = await db.query(
      `SELECT simplemdm_profile_id FROM master_profiles ORDER BY id`
    );
    
    return result.rows.map(row => row.simplemdm_profile_id);
  }

  // Create a master profile (used by setup script)
  static async create(profileData) {
    const { name, type, description, simpleMdmProfileId } = profileData;
    
    try {
      const result = await db.query(
        `INSERT INTO master_profiles (name, type, description, simplemdm_profile_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, type, description, simplemdm_profile_id, created_at`,
        [name, type, description, simpleMdmProfileId]
      );
      
      return result.rows[0];
    } catch (error) {
      // Handle duplicate type error
      if (error.code === '23505') { // unique_violation
        const err = new Error(`Master profile type '${type}' already exists`);
        err.status = 409;
        throw err;
      }
      throw error;
    }
  }

  // Update a master profile
  static async update(id, profileData) {
    const { name, description } = profileData;
    
    const result = await db.query(
      `UPDATE master_profiles
       SET name = $1, description = $2
       WHERE id = $3
       RETURNING id, name, type, description, simplemdm_profile_id, created_at`,
      [name, description, id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('Master profile not found');
      error.status = 404;
      throw error;
    }
    
    return result.rows[0];
  }

  // Delete a master profile (careful - this affects all families!)
  static async delete(id) {
    const result = await db.query(
      `DELETE FROM master_profiles
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('Master profile not found');
      error.status = 404;
      throw error;
    }
    
    return true;
  }

  // Get profile metadata with SimpleMDM IDs
  static async getProfileChoices() {
    const profiles = await this.getAll();
    
    return profiles.map(profile => ({
      id: profile.id,
      name: profile.name,
      type: profile.type,
      description: profile.description,
      simpleMdmId: profile.simplemdm_profile_id,
      metadata: this._getTypeMetadata(profile.type)
    }));
  }

  // Get metadata for profile types
  static _getTypeMetadata(type) {
    const metadata = {
      essential_kids: {
        ageRange: 'Ages 6-10',
        apps: ['Phone', 'Messages', 'Photos', 'Mail'],
        restrictions: 'No internet, No app installation, Emergency only'
      },
      student_mode: {
        ageRange: 'Ages 10-14', 
        apps: ['Phone', 'Messages', 'Photos', 'Mail', 'Safari*', 'Calendar', 'Camera', 'Notes'],
        restrictions: 'Educational sites only, Time limits, No social media'
      },
      balanced_teen: {
        ageRange: 'Ages 12-16',
        apps: ['Phone', 'Messages', 'Camera', 'Music', 'Safari*', 'Calendar', 'App Store*'],
        restrictions: 'Content filtering, Evening limits, Parent approval for new apps'
      },
      custom_template: {
        ageRange: 'Any age',
        apps: ['Customizable'],
        restrictions: 'Fully customizable by parent'
      }
    };
    
    return metadata[type] || {};
  }
}

module.exports = MasterProfile;