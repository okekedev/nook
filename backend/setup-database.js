const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('Creating database tables...');
    
    // Users Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        role VARCHAR(10) CHECK (role IN ('parent', 'child')) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Users table created');

    // Families Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS families (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        parent_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        simplemdm_group_id VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Families table created');

    // Family Members Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS family_members (
        id SERIAL PRIMARY KEY,
        family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(family_id, user_id)
      )
    `);
    console.log('✓ Family members table created');

    // Profiles Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        simplemdm_profile_id VARCHAR(100),
        type VARCHAR(20) CHECK (type IN ('essential_kids', 'student_mode', 'balanced_teen', 'custom')) NOT NULL,
        description TEXT,
        config JSONB NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Profiles table created');

    // Devices Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        profile_id INTEGER REFERENCES profiles(id) ON DELETE SET NULL,
        simplemdm_device_id VARCHAR(100),
        model VARCHAR(100),
        serial_number VARCHAR(100),
        os_version VARCHAR(50),
        status VARCHAR(20) CHECK (status IN ('enrolled', 'pending', 'removed')) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Devices table created');

    // Sessions Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Sessions table created');

    // Blocked Apps Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS blocked_apps (
        id SERIAL PRIMARY KEY,
        device_id INTEGER NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
        app_bundle_id VARCHAR(255) NOT NULL,
        app_name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(device_id, app_bundle_id)
      )
    `);
    console.log('✓ Blocked apps table created');

    // Enrollment Codes Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS enrollment_codes (
        id SERIAL PRIMARY KEY,
        family_id INTEGER NOT NULL REFERENCES families(id) ON DELETE CASCADE,
        code VARCHAR(50) NOT NULL,
        simplemdm_enrollment_url TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ Enrollment codes table created');

    console.log('\n🎉 All tables created successfully!');
    
  } catch (error) {
    console.error('Error creating tables:', error);
  } finally {
    client.release();
    await pool.end();
  }
};

// Run the setup
createTables();