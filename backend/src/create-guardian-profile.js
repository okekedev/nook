const simpleMdmService = require('./services/simpleMdmService');
const ProfileGenerators = require('./services/profileGenerators');
const db = require('./utils/db');
require('dotenv').config();

async function createGuardianProfile() {
  try {
    console.log('🛡️  Creating Guardian profile in SimpleMDM...\n');
    
    // Generate the Guardian profile XML
    const mobileconfig = ProfileGenerators.generateGuardianProfile('Global');
    
    // Create profile in SimpleMDM
    const simpleMdmProfile = await simpleMdmService.createProfile(
      'Guardian (Global)', 
      mobileconfig
    );
    
    console.log(`✅ Created Guardian profile in SimpleMDM (ID: ${simpleMdmProfile.id})`);
    
    // Update the database record with the SimpleMDM ID
    await db.query(
      `UPDATE master_profiles 
       SET simplemdm_profile_id = $1 
       WHERE type = 'guardian'`,
      [simpleMdmProfile.id]
    );
    
    console.log(`✅ Updated database record with SimpleMDM ID: ${simpleMdmProfile.id}`);
    
    // Verify the update
    const result = await db.query(
      `SELECT * FROM master_profiles WHERE type = 'guardian'`
    );
    
    if (result.rows.length > 0) {
      const guardian = result.rows[0];
      console.log('\n🎯 Guardian Profile Complete:');
      console.log(`  Name: ${guardian.name}`);
      console.log(`  Type: ${guardian.type}`);
      console.log(`  DB ID: ${guardian.id}`);
      console.log(`  SimpleMDM ID: ${guardian.simplemdm_profile_id}`);
      console.log(`  Description: ${guardian.description}`);
    }
    
    console.log('\n✅ Guardian profile setup complete!');
    console.log('🚀 All 4 master profiles are now ready for use.');
    
  } catch (error) {
    console.error('❌ Error creating Guardian profile:', error);
    if (error.data) {
      console.error('SimpleMDM Error Details:', error.data);
    }
  } finally {
    process.exit(0);
  }
}

createGuardianProfile();