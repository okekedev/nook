const fs = require('fs');
const path = require('path');

// Profile XML generators for iOS configuration profiles

class ProfileGenerators {
  // Profile metadata - descriptions, allowed apps, etc.
  static getProfileMetadata() {
    return {
      first_phone: {
        name: 'First Phone',
        description: 'Basic phone for young kids getting their first phone - Phone and Messages only',
        target: 'Young kids getting their first phone',
        allowedApps: [
          'com.apple.mobilephone',    // Phone
          'com.apple.MobileSMS'       // Messages
        ],
        restrictions: {
          allow_camera: false,
          allow_safari: false,
          allow_app_installation: false,
          allow_in_app_purchases: false,
          allow_explicit_content: false,
          allow_app_store: false,
          emergency_calls_only: false // They can make regular calls, not just emergency
        }
      },
      explorer: {
        name: 'Explorer',
        description: 'Enhanced features for kids ready for more but still supervised - Camera, YouTube Kids, Maps included',
        target: 'Kids ready for more features but still supervised',
        allowedApps: [
          'com.apple.mobilephone',    // Phone
          'com.apple.MobileSMS',      // Messages
          'com.apple.camera',         // Camera
          'com.google.ios.youtubekids', // YouTube Kids
          'com.apple.Maps',           // Maps
          'com.apple.mobiletimer'     // Clock
        ],
        restrictions: {
          allow_camera: true,
          allow_safari: false,
          allow_app_installation: false,
          allow_in_app_purchases: false,
          allow_explicit_content: false,
          allow_social_media: false,
          filtered_youtube: true
        }
      },
      guardian: {
        name: 'Guardian',
        description: 'Full access with social media protection - All apps except dangerous social platforms',
        target: 'Teens who can handle most apps but need social media protection',
        allowedApps: 'all_except_blacklisted',
        blockedApps: [
          'com.zhiliaoapp.musically',   // TikTok
          'com.burbn.instagram',        // Instagram
          'com.toyopagroup.picaboo',    // Snapchat
          'com.facebook.Facebook',      // Facebook
          'com.atebits.Tweetie2',       // Twitter
          'com.hammerandchisel.discord', // Discord
          'com.bumble.app',             // Bumble
          'com.cardify.tinder',         // Tinder
          'com.pof.pof',                // Plenty of Fish
          'com.match.match',            // Match
          'com.badoo.badoo',            // Badoo
          'com.hinge.hinge'             // Hinge
        ],
        restrictions: {
          allow_camera: true,
          allow_safari: true,
          allow_app_installation: true,
          allow_in_app_purchases: false,
          allow_explicit_content: false,
          app_store_filtered: true,
          blacklist_enforcement: true
        }
      },
      time_out: {
        name: 'Time Out',
        description: 'Disciplinary mode - Phone only when rules are broken',
        target: 'Any age - for when rules are broken',
        allowedApps: [
          'com.apple.mobilephone'     // Phone only
        ],
        restrictions: {
          allow_camera: false,
          allow_safari: false,
          allow_app_installation: false,
          allow_in_app_purchases: false,
          allow_explicit_content: false,
          fully_locked: true,
          no_bypass_possible: true
        }
      }
    };
  }

  // Generate a UUID for profile payloads
  static generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  // Helper method to read XML template file
  static readTemplate(templateName) {
    const templatePath = path.join(__dirname, 'profiles', `${templateName}.xml`);
    
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`);
    }
    
    return fs.readFileSync(templatePath, 'utf8');
  }

  // Helper method to replace placeholders in template
  static processTemplate(template, familyName, replacements = {}) {
    const familySlug = familyName.toLowerCase().replace(/\s/g, '-');
    
    // Default replacements
    const defaultReplacements = {
      '{{FAMILY_NAME}}': familyName,
      '{{FAMILY_SLUG}}': familySlug,
      '{{UUID_MAIN}}': this.generateUUID(),
      '{{UUID_1}}': this.generateUUID(),
      '{{UUID_2}}': this.generateUUID(),
      '{{UUID_3}}': this.generateUUID()
    };
    
    // Merge with custom replacements
    const allReplacements = { ...defaultReplacements, ...replacements };
    
    // Replace all placeholders
    let processedTemplate = template;
    for (const [placeholder, value] of Object.entries(allReplacements)) {
      processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), value);
    }
    
    return processedTemplate;
  }

  // First Phone Profile - Phone and Messages only
  static generateFirstPhoneProfile(familyName) {
    const template = this.readTemplate('first-phone');
    return this.processTemplate(template, familyName);
  }

  // Explorer Profile - Enhanced features for supervised kids
  static generateExplorerProfile(familyName) {
    const template = this.readTemplate('explorer');
    return this.processTemplate(template, familyName);
  }

  // Guardian Profile - Full access with social media blocking
  static generateGuardianProfile(familyName) {
    const template = this.readTemplate('guardian');
    return this.processTemplate(template, familyName);
  }

  // Time Out Profile - Disciplinary mode with phone only
  static generateTimeOutProfile(familyName) {
    const template = this.readTemplate('timeout');
    return this.processTemplate(template, familyName);
  }

  // Custom profile generator
  static generateCustomProfile(familyName, config) {
    const template = this.readTemplate('custom');
    
    const { allowedApps, restrictions } = config;
    
    // Convert allowed apps to XML format
    const appsXml = allowedApps.map(app => `        <string>${app}</string>`).join('\n');
    
    // Convert restrictions to XML format
    let restrictionsXml = '';
    for (const [key, value] of Object.entries(restrictions)) {
      if (typeof value === 'boolean') {
        restrictionsXml += `      <key>${key}</key>\n      <${value}/>\n`;
      } else if (typeof value === 'number') {
        restrictionsXml += `      <key>${key}</key>\n      <integer>${value}</integer>\n`;
      } else if (typeof value === 'string') {
        restrictionsXml += `      <key>${key}</key>\n      <string>${value}</string>\n`;
      }
    }
    
    // Custom replacements for this profile
    const customReplacements = {
      '{{ALLOWED_APPS}}': appsXml,
      '{{RESTRICTIONS}}': restrictionsXml
    };
    
    return this.processTemplate(template, familyName, customReplacements);
  }
}

module.exports = ProfileGenerators;