const db = require('../utils/db');

class Profile {
  // Create a new profile
  static async create(profileData) {
    const { 
      name, 
      familyId, 
      simpleMdmProfileId, 
      type, 
      description, 
      config 
    } = profileData;
    
    try {
      const result = await db.query(
        `INSERT INTO profiles (name, family_id, simplemdm_profile_id, type, description, config)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, name, family_id, simplemdm_profile_id, type, description, config, created_at`,
        [name, familyId, simpleMdmProfileId, type, description, JSON.stringify(config)]
      );
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find profile by ID
  static async findById(id) {
    const result = await db.query(
      `SELECT id, name, family_id, simplemdm_profile_id, type, description, config, created_at, updated_at
       FROM profiles
       WHERE id = $1`,
      [id]
    );
    
    if (result.rows[0]) {
      result.rows[0].config = JSON.parse(result.rows[0].config);
    }
    
    return result.rows[0];
  }

  // Find profile by SimpleMDM ID
  static async findBySimpleMdmId(simpleMdmProfileId) {
    const result = await db.query(
      `SELECT id, name, family_id, simplemdm_profile_id, type, description, config, created_at, updated_at
       FROM profiles
       WHERE simplemdm_profile_id = $1`,
      [simpleMdmProfileId]
    );
    
    if (result.rows[0]) {
      result.rows[0].config = JSON.parse(result.rows[0].config);
    }
    
    return result.rows[0];
  }

  // Find profiles by family ID
  static async findByFamilyId(familyId) {
    const result = await db.query(
      `SELECT id, name, family_id, simplemdm_profile_id, type, description, config, created_at, updated_at
       FROM profiles
       WHERE family_id = $1
       ORDER BY created_at DESC`,
      [familyId]
    );
    
    return result.rows.map(row => {
      row.config = JSON.parse(row.config);
      return row;
    });
  }

  // Update profile
  static async update(id, profileData) {
    const { 
      name, 
      simpleMdmProfileId, 
      description, 
      config 
    } = profileData;
    
    const result = await db.query(
      `UPDATE profiles
       SET name = $1, 
           simplemdm_profile_id = $2, 
           description = $3, 
           config = $4, 
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING id, name, family_id, simplemdm_profile_id, type, description, config, created_at, updated_at`,
      [name, simpleMdmProfileId, description, JSON.stringify(config), id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('Profile not found');
      error.status = 404;
      throw error;
    }
    
    if (result.rows[0]) {
      result.rows[0].config = JSON.parse(result.rows[0].config);
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
  
  // Get default profile configurations
  static getDefaultProfiles() {
    return {
      essential_kids: {
        name: 'Essential Kids',
        type: 'essential_kids',
        description: 'Basic profile for young children with only essential apps',
        config: {
          allowed_apps: [
            'com.apple.mobilephone', // Phone
            'com.apple.MobileSMS', // Messages
            'com.apple.mobileslideshow', // Photos
            'com.apple.mobilemail', // Mail
          ],
          restrictions: {
            allow_app_installation: false,
            allow_camera: true,
            allow_safari: false,
            allow_itunes: false,
            allow_in_app_purchases: false,
            allow_explicit_content: false,
            allow_account_modification: false,
            allow_find_my_friends: false,
            force_encrypted_backup: true,
            allow_passcode_modification: false,
            allow_device_name_modification: false,
            allow_cellular_data_modification: false,
            allow_host_pairing: false,
            allow_screen_time_modification: false
          },
          screen_time_limits: {
            weekday_usage_limit_minutes: 60,
            weekend_usage_limit_minutes: 120,
            bedtime_hours: {
              start_hour: 20, // 8 PM
              end_hour: 7 // 7 AM
            }
          }
        }
      },
      student_mode: {
        name: 'Student Mode',
        type: 'student_mode',
        description: 'Profile for school-age children with educational apps',
        config: {
          allowed_apps: [
            'com.apple.mobilephone', // Phone
            'com.apple.MobileSMS', // Messages
            'com.apple.mobileslideshow', // Photos
            'com.apple.mobilemail', // Mail
            'com.apple.mobilesafari', // Safari (with content filtering)
            'com.apple.mobilecal', // Calendar
            'com.apple.camera', // Camera
            'com.apple.mobilenotes', // Notes
          ],
          restrictions: {
            allow_app_installation: false,
            allow_camera: true,
            allow_safari: true,
            safari_content_filter: {
              enabled: true,
              whitelist_only: true,
              whitelisted_domains: [
                'wikipedia.org',
                'khanacademy.org',
                'education.com',
                'scholastic.com',
                'newsela.com'
              ]
            },
            allow_itunes: false,
            allow_in_app_purchases: false,
            allow_explicit_content: false,
            allow_account_modification: false,
            allow_find_my_friends: true,
            force_encrypted_backup: true,
            allow_passcode_modification: true,
            allow_device_name_modification: false,
            allow_cellular_data_modification: false,
            allow_host_pairing: false,
            allow_screen_time_modification: false
          },
          screen_time_limits: {
            weekday_usage_limit_minutes: 120,
            weekend_usage_limit_minutes: 180,
            bedtime_hours: {
              start_hour: 21, // 9 PM
              end_hour: 6 // 6 AM
            }
          }
        }
      },
      balanced_teen: {
        name: 'Balanced Teen',
        type: 'balanced_teen',
        description: 'Profile for teenagers with more freedom but still some limits',
        config: {
          allowed_apps: [
            'com.apple.mobilephone', // Phone
            'com.apple.MobileSMS', // Messages
            'com.apple.mobileslideshow', // Photos
            'com.apple.mobilemail', // Mail
            'com.apple.mobilesafari', // Safari
            'com.apple.mobilecal', // Calendar
            'com.apple.camera', // Camera
            'com.apple.mobilenotes', // Notes
            'com.apple.Music', // Music
            'com.burbn.instagram', // Instagram (with time limits)
            'com.atebits.Tweetie2', // Twitter (with time limits)
            'com.google.ios.youtube', // YouTube (with time limits)
          ],
          restrictions: {
            allow_app_installation: true,
            allow_camera: true,
            allow_safari: true,
            safari_content_filter: {
              enabled: true,
              blacklist_only: true,
              blacklisted_domains: [
                'adult-content-domains.com'
              ]
            },
            allow_itunes: true,
            allow_in_app_purchases: false,
            allow_explicit_content: false,
            allow_account_modification: false,
            allow_find_my_friends: true,
            force_encrypted_backup: true,
            allow_passcode_modification: true,
            allow_device_name_modification: true,
            allow_cellular_data_modification: true,
            allow_host_pairing: true,
            allow_screen_time_modification: false
          },
          screen_time_limits: {
            weekday_usage_limit_minutes: 180,
            weekend_usage_limit_minutes: 240,
            bedtime_hours: {
              start_hour: 22, // 10 PM
              end_hour: 6 // 6 AM
            },
            app_specific_limits: {
              'com.burbn.instagram': 30, // 30 min/day
              'com.atebits.Tweetie2': 30, // 30 min/day
              'com.google.ios.youtube': 60 // 60 min/day
            }
          }
        }
      }
    };
  }
}

module.exports = Profile;