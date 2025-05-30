const db = require('../utils/db');

class Family {
  // Create a new family
  static async create(familyData) {
    const { name, parentId, simpleMdmGroupId } = familyData;
    
    try {
      const result = await db.query(
        `INSERT INTO families (name, parent_id, simplemdm_group_id)
         VALUES ($1, $2, $3)
         RETURNING id, name, parent_id, simplemdm_group_id, created_at`,
        [name, parentId, simpleMdmGroupId]
      );
      
      // Add the parent as a family member
      await db.query(
        `INSERT INTO family_members (family_id, user_id)
         VALUES ($1, $2)`,
        [result.rows[0].id, parentId]
      );
      
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  }

  // Find family by ID
  static async findById(id) {
    const result = await db.query(
      `SELECT id, name, parent_id, simplemdm_group_id, created_at, updated_at
       FROM families
       WHERE id = $1`,
      [id]
    );
    
    return result.rows[0];
  }

  // Find families by parent ID
  static async findByParentId(parentId) {
    const result = await db.query(
      `SELECT id, name, parent_id, simplemdm_group_id, created_at, updated_at
       FROM families
       WHERE parent_id = $1
       ORDER BY created_at DESC`,
      [parentId]
    );
    
    return result.rows;
  }

  // Update family
  static async update(id, familyData) {
    const { name, simpleMdmGroupId } = familyData;
    
    const result = await db.query(
      `UPDATE families
       SET name = $1, simplemdm_group_id = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, name, parent_id, simplemdm_group_id, created_at, updated_at`,
      [name, simpleMdmGroupId, id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('Family not found');
      error.status = 404;
      throw error;
    }
    
    return result.rows[0];
  }

  // Add member to family
  static async addMember(familyId, userId) {
    try {
      const result = await db.query(
        `INSERT INTO family_members (family_id, user_id)
         VALUES ($1, $2)
         RETURNING id, family_id, user_id, created_at`,
        [familyId, userId]
      );
      
      return result.rows[0];
    } catch (error) {
      // Handle duplicate member
      if (error.code === '23505') { // unique_violation
        const err = new Error('User is already a member of this family');
        err.status = 409;
        throw err;
      }
      throw error;
    }
  }

  // Remove member from family
  static async removeMember(familyId, userId) {
    const result = await db.query(
      `DELETE FROM family_members
       WHERE family_id = $1 AND user_id = $2
       RETURNING id`,
      [familyId, userId]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('Family member not found');
      error.status = 404;
      throw error;
    }
    
    return true;
  }

  // Get family members
  static async getMembers(familyId) {
    const result = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.created_at, u.updated_at
       FROM users u
       JOIN family_members fm ON u.id = fm.user_id
       WHERE fm.family_id = $1`,
      [familyId]
    );
    
    return result.rows;
  }

  // Delete family
  static async delete(id) {
    // This will cascade delete family_members, profiles, and devices
    const result = await db.query(
      `DELETE FROM families
       WHERE id = $1
       RETURNING id`,
      [id]
    );
    
    if (result.rows.length === 0) {
      const error = new Error('Family not found');
      error.status = 404;
      throw error;
    }
    
    return true;
  }
}

module.exports = Family;