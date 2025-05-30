const db = require('../utils/db');
const crypto = require('crypto');

class Enrollment {
  // Create a new enrollment code
  static async create(familyId, simpleMdmEnrollmentUrl) {
    // Generate a random 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    
    // Set expiration time to 24 hours from now
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    
    try {
      const result = await db.query(
        `INSERT INTO enrollment_codes (family_id, code, simplemdm_enrollment_url, expires_at)
         VALUES ($1, $2, $3, $4)
         RETURNING id, family_id, code, simplemdm_enrollment_url, expires_at, used, created_at`,
        [familyId, code, simpleMdmEnrollmentUrl, expiresAt]
      );
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find enrollment by code
  static async findByCode(code) {
    const result = await db.query(
      `SELECT id, family_id, code, simplemdm_enrollment_url, expires_at, used, created_at
       FROM enrollment_codes
       WHERE code = $1`,
      [code]
    );
    
    return result.rows[0];
  }

  // Find enrollment by ID
  static async findById(id) {
    const result = await db.query(
      `SELECT id, family_id, code, simplemdm_enrollment_url, expires_at, used, created_at
       FROM enrollment_codes
       WHERE id = $1`,
      [id]
    );
    
    return result.rows[0];
  }

  // Find enrollments by family ID
  static async findByFamilyId(familyId) {
    const result = await db.query(
      `SELECT id, family_id, code, simplemdm_enrollment_url, expires_at, used, created_at
       FROM enrollment_codes
       WHERE family_id = $1
       ORDER BY created_at DESC`,
      [familyId]
    );
    
    return result.rows;
  }

  // Mark enrollment as used
  static async markAsUsed(id) {
    const result = await db.query(
      `UPDATE enrollment_codes
       SET used = TRUE
       WHERE id = $1
       RETURNING id, used`,
      [id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('Enrollment code not found');
      error.status = 404;
      throw error;
    }
    
    return result.rows[0];
  }

  // Check if enrollment is valid
  static async isValid(code) {
    const enrollment = await this.findByCode(code);
    
    if (!enrollment) {
      return { valid: false, message: 'Enrollment code not found' };
    }
    
    if (enrollment.used) {
      return { valid: false, message: 'Enrollment code has already been used' };
    }
    
    if (new Date(enrollment.expires_at) < new Date()) {
      return { valid: false, message: 'Enrollment code has expired' };
    }
    
    return { valid: true, enrollment };
  }

  // Delete enrollment
  static async delete(id) {
    const result = await db.query(
      `DELETE FROM enrollment_codes
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('Enrollment code not found');
      error.status = 404;
      throw error;
    }
    
    return true;
  }
}

module.exports = Enrollment;