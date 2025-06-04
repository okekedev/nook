const simpleMdmService = require('./src/services/simpleMdmService');
const ProfileGenerators = require('./src/services/profileGenerators');
const db = require('./src/utils/db');
require('dotenv').config();

const MASTER_PROFILES = [
  {
    name: 'First Phone (Global)',
    type: 'first_phone',
    description: 'Basic phone for young kids - calls and texts only, perfect for their first device'
  },
  {
    name: 'Explorer (Global)', 
    type: 'explorer',
    description: 'Enhanced phone for supervised kids - camera, maps, and educational content'
  },
  {
    name: 'Guardian (Global)',
    type: 'guardian', 
    description: 'Full access with social media protection - all apps except dangerous social platforms'
  },
  {
    name: 'Time Out (Global)',
    type: 'time_out',
    description: 'Disciplinary mode - phone calls only when rules are broken'
  }
];

async function createMasterProfiles() {
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
      
      // Wait a bit between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error creating ${profileTemplate.name}:`, error.message);
    }
  }
  
  return createdProfiles;
}

async function storeMasterProfileIds(profiles) {
  console.log('\n💾 Storing master profile IDs in database...\n');
  
  try {
    // Create master_profiles table if it doesn't exist
    await db.query(`
      CREATE TABLE IF NOT EXISTS master_profiles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(50) NOT NULL UNIQUE,
        description TEXT,
        simplemdm_profile_id VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Clear existing master profiles
    await db.query('DELETE FROM master_profiles');
    
    // Insert new master profiles
    for (const profile of profiles) {
      await db.query(
        `INSERT INTO master_profiles (name, type, description, simplemdm_profile_id)
         VALUES ($1, $2, $3, $4)`,
        [profile.name, profile.type, profile.description, profile.simpleMdmId]
      );
      
      console.log(`✅ Stored: ${profile.name} -> ${profile.simpleMdmId}`);
    }
    
    console.log('\n🎯 Master profiles setup complete!');
    
  } catch (error) {
    console.error('❌ Error storing master profile IDs:', error);
  }
}

async function setupMasterProfiles() {
  try {
    console.log('🎯 Setting up global master profiles for Nook MDM\n');
    console.log('This will create 4 reusable profiles that can be assigned to all families.\n');
    
    // Create the profiles in SimpleMDM
    const createdProfiles = await createMasterProfiles();
    
    if (createdProfiles.length === 0) {
      console.log('❌ No profiles were created successfully');
      return;
    }
    
    // Store the IDs in database
    await storeMasterProfileIds(createdProfiles);
    
    console.log('\n📊 Summary:');
    console.log('=====================================');
    createdProfiles.forEach(profile => {
      console.log(`${profile.name}: ${profile.simpleMdmId}`);
    });
    
    console.log('\n🚀 Next steps:');
    console.log('1. Update family creation to auto-assign these profiles');
    console.log('2. Update profile routes to use existing profiles');
    console.log('3. Test with a new family creation');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the setup
setupMasterProfiles();