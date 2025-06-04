const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function queryUsers() {
  try {
    console.log('🔍 Querying database for users...\n');
    
    // Get all users
    const usersResult = await pool.query(`
      SELECT id, email, first_name, last_name, role, created_at
      FROM users
      ORDER BY created_at DESC
    `);
    
    console.log('👥 USERS:');
    console.log('=====================================');
    if (usersResult.rows.length === 0) {
      console.log('No users found in database');
    } else {
      usersResult.rows.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Email: ${user.email}`);
        console.log(`Name: ${user.first_name} ${user.last_name}`);
        console.log(`Role: ${user.role}`);
        console.log(`Created: ${user.created_at}`);
        console.log('-------------------------------------');
      });
    }
    
    // Get all families
    const familiesResult = await pool.query(`
      SELECT f.id, f.name, f.parent_id, f.simplemdm_group_id, 
             u.email as parent_email, u.first_name as parent_first_name
      FROM families f
      JOIN users u ON f.parent_id = u.id
      ORDER BY f.created_at DESC
    `);
    
    console.log('\n👨‍👩‍👧‍👦 FAMILIES:');
    console.log('=====================================');
    if (familiesResult.rows.length === 0) {
      console.log('No families found in database');
    } else {
      familiesResult.rows.forEach(family => {
        console.log(`ID: ${family.id}`);
        console.log(`Name: ${family.name}`);
        console.log(`Parent: ${family.parent_first_name} (${family.parent_email})`);
        console.log(`SimpleMDM Group ID: ${family.simplemdm_group_id || 'None'}`);
        console.log('-------------------------------------');
      });
    }
    
    // Get all profiles
    const profilesResult = await pool.query(`
      SELECT p.id, p.name, p.type, p.family_id, p.simplemdm_profile_id,
             f.name as family_name
      FROM profiles p
      JOIN families f ON p.family_id = f.id
      ORDER BY p.created_at DESC
    `);
    
    console.log('\n📋 PROFILES:');
    console.log('=====================================');
    if (profilesResult.rows.length === 0) {
      console.log('No profiles found in database');
    } else {
      profilesResult.rows.forEach(profile => {
        console.log(`ID: ${profile.id}`);
        console.log(`Name: ${profile.name}`);
        console.log(`Type: ${profile.type}`);
        console.log(`Family: ${profile.family_name}`);
        console.log(`SimpleMDM Profile ID: ${profile.simplemdm_profile_id || 'None'}`);
        console.log('-------------------------------------');
      });
    }
    
    console.log('\n💡 LOGIN TIPS:');
    console.log('=====================================');
    console.log('For the parent account, you can login with:');
    console.log('Email: parent@test.com');
    console.log('Password: password123 (or whatever you used when creating the user)');
    console.log('\nIf you need to create a new user, run:');
    console.log('curl -X POST http://localhost:3000/api/auth/register \\');
    console.log('  -H "Content-Type: application/json" \\');
    console.log('  -d \'{"email": "parent@test.com", "password": "password123", "firstName": "John", "lastName": "Doe", "role": "parent"}\'');
    
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await pool.end();
  }
}

// Run the query
queryUsers();