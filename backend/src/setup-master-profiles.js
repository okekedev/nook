const simpleMdmService = require('./services/simpleMdmService');
const ProfileGenerators = require('./services/profileGenerators');
const db = require('./utils/db');
require('dotenv').config();

const MASTER_PROFILES = [
  {
    name: 'First Phone (Global)',
    type: 'first_phone',
    description: 'Basic phone for young kids getting their first phone - Phone and Messages only'
  },
  {
    name: 'Explorer (Global)', 
    type: 'explorer',
    description: 'Enhanced features for kids ready for more but still supervised - Camera, YouTube Kids, Maps included'
  },
  {
    name: 'Guardian (Global)',
    type: 'guardian', 
    description: 'Full access with social media protection - All apps except dangerous social platforms'
  },
  {
    name: 'Time Out (Global)',
    type: 'time_out',
    description: 'Disciplinary mode - Phone only when rules are broken'
  }
];

async function createMasterProfilesInSimpleMDM() {
  console.log('🚀 Creating master profiles in SimpleMDM...\n');
  
  const createdProfiles = [];
  
  for (const profileTemplate of MASTER_PROFILES) {
    try {
      console.log(`📋 Creating ${profileTemplate.name}...`);
      
      // Generate the profile XML
      let mobileconfig;
      switch (profileTemplate.type) {
        case 'first_phone':
          mobileconfig = ProfileGenerators.generateFirstPhoneProfile('Global');
          break;
        case 'explorer':
          mobileconfig = ProfileGenerators.generateExplorerProfile('Global');
          break;
        case 'guardian':
          mobileconfig = ProfileGenerators.generateGuardianProfile('Global');
          break;
        case 'time_out':
          mobileconfig = ProfileGenerators.generateTimeOutProfile('Global');
          break;
      }
      
      // Create profile in SimpleMDM
      const simpleMdmProfile = await simpleMdmService.createProfile(
        profileTemplate.name, 
        mobileconfig
      );
      
      console.log(`✅ Created: ${profileTemplate.name} (ID: ${simpleMdmProfile.id})`);
      
      createdProfiles.push({
        ...profileTemplate,
        simpleMdmId: simpleMdmProfile.id
      });
      
      // Wait a bit between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error creating ${profileTemplate.name}:`, error.message);
      if (error.data) {
        console.error('SimpleMDM Error Details:', error.data);
      }
    }
  }
  
  return createdProfiles;
}

async function storeMasterProfilesInDatabase(profiles) {
  console.log('\n💾 Storing master profile IDs in database...\n');
  
  try {
    // Clear existing master profiles (in case we're re-running)
    await db.query('DELETE FROM master_profiles');
    console.log('🗑️  Cleared existing master profiles');
    
    // Insert new master profiles
    for (const profile of profiles) {
      const result = await db.query(
        `INSERT INTO master_profiles (name, type, description, simplemdm_profile_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, type, simplemdm_profile_id`,
        [profile.name, profile.type, profile.description, profile.simpleMdmId]
      );
      
      const createdProfile = result.rows[0];
      console.log(`✅ Stored: ${createdProfile.name} (DB ID: ${createdProfile.id}, SimpleMDM ID: ${createdProfile.simplemdm_profile_id})`);
    }
    
    console.log('\n🎯 Master profiles setup complete!');
    
  } catch (error) {
    console.error('❌ Error storing master profile IDs:', error);
    throw error;
  }
}

async function verifyMasterProfiles() {
  console.log('\n🔍 Verifying master profiles...\n');
  
  try {
    const result = await db.query(`
      SELECT id, name, type, simplemdm_profile_id, created_at
      FROM master_profiles
      ORDER BY 
        CASE type 
          WHEN 'first_phone' THEN 1
          WHEN 'explorer' THEN 2
          WHEN 'guardian' THEN 3
          WHEN 'time_out' THEN 4
          ELSE 5
        END
    `);
    
    console.log('📊 MASTER PROFILES IN DATABASE:');
    console.log('=====================================');
    result.rows.forEach(profile => {
      console.log(`${profile.type.toUpperCase()}`);
      console.log(`  Name: ${profile.name}`);
      console.log(`  DB ID: ${profile.id}`);
      console.log(`  SimpleMDM ID: ${profile.simplemdm_profile_id}`);
      console.log(`  Created: ${profile.created_at}`);
      console.log('-------------------------------------');
    });
    
    return result.rows;
  } catch (error) {
    console.error('❌ Error verifying master profiles:', error);
    throw error;
  }
}

async function setupMasterProfiles() {
  try {
    console.log('🎯 Setting up shared master profiles for Nook MDM\n');
    console.log('This will create 4 global profiles that all families will share:\n');
    console.log('1. First Phone - Phone and Messages only');
    console.log('2. Explorer - Camera, YouTube Kids, Maps included');
    console.log('3. Guardian - Full access with social media blocking');
    console.log('4. Time Out - Disciplinary mode with phone only\n');
    console.log('🚨 IMPORTANT: This uses SHARED profiles - only 4 total SimpleMDM profiles will be created!\n');
    
    // Check if we already have master profiles
    const existingCheck = await db.query('SELECT COUNT(*) as count FROM master_profiles');
    const existingCount = parseInt(existingCheck.rows[0].count);
    
    if (existingCount > 0) {
      console.log(`⚠️  Found ${existingCount} existing master profiles.`);
      console.log('This will delete existing master profiles and create new ones.\n');
    }
    
    // Create the profiles in SimpleMDM
    const createdProfiles = await createMasterProfilesInSimpleMDM();
    
    if (createdProfiles.length === 0) {
      console.log('❌ No profiles were created successfully');
      console.log('Please check your SimpleMDM API configuration and try again.');
      return;
    }
    
    // Store the IDs in database
    await storeMasterProfilesInDatabase(createdProfiles);
    
    // Verify everything was stored correctly
    const verifiedProfiles = await verifyMasterProfiles();
    
    console.log('\n📊 SETUP SUMMARY:');
    console.log('=====================================');
    console.log(`✅ Created ${verifiedProfiles.length} master profiles in SimpleMDM`);
    console.log(`✅ Stored ${verifiedProfiles.length} master profile records in database`);
    console.log('✅ All families will now share these 4 profiles');
    console.log('✅ No more individual profile creation for predefined types');
    
    console.log('\n🚀 NEXT STEPS:');
    console.log('=====================================');
    console.log('1. ✅ Master profiles are ready');
    console.log('2. 🔄 Update your route files (if not done already)');
    console.log('3. 🧪 Test creating profiles for a family');
    console.log('4. 📊 Verify only master profiles are assigned (not new ones created)');
    
    console.log('\n💡 TESTING:');
    console.log('=====================================');
    console.log('When you create a "First Phone" profile for a family:');
    console.log('- ❌ Should NOT create a new SimpleMDM profile');
    console.log('- ✅ Should assign existing master profile to family device group');
    console.log('- ✅ Should create database record with master_profile_id set');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    console.error('\n🔧 TROUBLESHOOTING:');
    console.error('- Check your SimpleMDM API key in .env file');
    console.error('- Ensure SimpleMDM service is working');
    console.error('- Verify database connection');
    console.error('- Check ProfileGenerators can read XML template files');
  } finally {
    process.exit(0);
  }
}

// Run the setup
setupMasterProfiles();