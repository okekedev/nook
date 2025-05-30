const db = require('../utils/db');
const bcrypt = require('bcrypt');

class User {
  // Create a new user
  static async create(userData) {
    const { email, password, firstName, lastName, role } = userData;
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    try {
      const result = await db.query(
        `INSERT INTO users (email, password, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, first_name, last_name, role, created_at`,
        [email, hashedPassword, firstName, lastName, role]
      );
      
      return result.rows[0];
    } catch (error) {
      // Handle duplicate email error
      if (error.code === '23505') { // unique_violation
        const err = new Error('Email already exists');
        err.status = 409;
        throw err;
      }
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    const result = await db.query(
      `SELECT id, email, first_name, last_name, role, created_at, updated_at
       FROM users
       WHERE id = $1`,
      [id]
    );
    
    return result.rows[0];
  }

  // Find user by email
  static async findByEmail(email) {
    const result = await db.query(
      `SELECT *
       FROM users
       WHERE email = $1`,
      [email]
    );
    
    return result.rows[0];
  }

  // Update user
  static async update(id, userData) {
    const { firstName, lastName, email } = userData;
    
    const result = await db.query(
      `UPDATE users
       SET first_name = $1, last_name = $2, email = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING id, email, first_name, last_name, role, created_at, updated_at`,
      [firstName, lastName, email, id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    
    return result.rows[0];
  }

  // Update password
  static async updatePassword(id, newPassword) {
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    const result = await db.query(
      `UPDATE users
       SET password = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING id`,
      [hashedPassword, id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    
    return true;
  }

  // Verify password
  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.password);
  }

  // Delete user
  static async delete(id) {
    const result = await db.query(
      `DELETE FROM users
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    
    return true;
  }
}

module.exports = User;