const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function resetPassword() {
  try {
    const email = 'parent@test.com';
    const newPassword = 'password123';
    
    console.log(`🔄 Resetting password for ${email}...`);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    // Update the password in database
    const result = await pool.query(
      `UPDATE users 
       SET password = $1, updated_at = CURRENT_TIMESTAMP
       WHERE email = $2
       RETURNING id, email, first_name, last_name`,
      [hashedPassword, email]
    );
    
    if (result.rows.length === 0) {
      console.log('❌ User not found with that email');
    } else {
      const user = result.rows[0];
      console.log('✅ Password reset successfully!');
      console.log(`User: ${user.first_name} ${user.last_name} (${user.email})`);
      console.log(`New password: ${newPassword}`);
      console.log('\n🔑 You can now login with:');
      console.log(`Email: ${email}`);
      console.log(`Password: ${newPassword}`);
      
      console.log('\n🧪 Test login with:');
      console.log('curl -X POST http://localhost:3000/api/auth/login \\');
      console.log('  -H "Content-Type: application/json" \\');
      console.log(`  -d '{"email": "${email}", "password": "${newPassword}"}'`);
    }
    
  } catch (error) {
    console.error('❌ Error resetting password:', error);
  } finally {
    await pool.end();
  }
}

// Run the password reset
resetPassword();