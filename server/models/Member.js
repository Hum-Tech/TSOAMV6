const { query, getConnection } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class Member {
  static async create(memberData) {
    try {
      const id = uuidv4();
      const sql = `
        INSERT INTO members (
          id, member_id, tithe_number, full_name, email, phone, 
          date_of_birth, gender, marital_status, address, occupation,
          emergency_contact_name, emergency_contact_phone, membership_date,
          baptism_date, confirmation_date, department, position, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        memberData.member_id,
        memberData.tithe_number,
        memberData.full_name,
        memberData.email,
        memberData.phone,
        memberData.date_of_birth,
        memberData.gender,
        memberData.marital_status,
        memberData.address,
        memberData.occupation,
        memberData.emergency_contact_name,
        memberData.emergency_contact_phone,
        memberData.membership_date,
        memberData.baptism_date,
        memberData.confirmation_date,
        memberData.department,
        memberData.position,
        memberData.is_active !== undefined ? memberData.is_active : true,
      ];

      const result = await query(sql, params);

      if (result.success) {
        return { success: true, data: { id, ...memberData } };
      }

      return { success: false, error: result.error };
    } catch (error) {
      console.error("Member creation error:", error);
      return { success: false, error: error.message };
    }
  }

  static async findAll(filters = {}) {
    try {
      let sql = "SELECT * FROM members WHERE 1=1";
      const params = [];

      if (filters.is_active !== undefined) {
        sql += " AND is_active = ?";
        params.push(filters.is_active);
      }

      if (filters.department) {
        sql += " AND department = ?";
        params.push(filters.department);
      }

      if (filters.search) {
        sql +=
          " AND (full_name LIKE ? OR email LIKE ? OR phone LIKE ? OR member_id LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      sql += " ORDER BY created_at DESC";

      if (filters.limit) {
        sql += " LIMIT ?";
        params.push(parseInt(filters.limit));
      }

      const result = await query(sql, params);
      return result.success ? { success: true, data: result.data } : result;
    } catch (error) {
      console.error("Member findAll error:", error);
      return { success: false, error: error.message };
    }
  }

  static async findById(id) {
    try {
      const sql = "SELECT * FROM members WHERE id = ?";
      const result = await query(sql, [id]);

      if (result.success && result.data.length > 0) {
        return { success: true, data: result.data[0] };
      }

      return { success: false, error: "Member not found" };
    } catch (error) {
      console.error("Member findById error:", error);
      return { success: false, error: error.message };
    }
  }

  static async findByMemberId(memberId) {
    try {
      const sql = "SELECT * FROM members WHERE member_id = ?";
      const result = await query(sql, [memberId]);

      if (result.success && result.data.length > 0) {
        return { success: true, data: result.data[0] };
      }

      return { success: false, error: "Member not found" };
    } catch (error) {
      console.error("Member findByMemberId error:", error);
      return { success: false, error: error.message };
    }
  }

  static async update(id, memberData) {
    try {
      const fields = [];
      const params = [];

      Object.keys(memberData).forEach((key) => {
        if (memberData[key] !== undefined && key !== "id") {
          fields.push(`${key} = ?`);
          params.push(memberData[key]);
        }
      });

      if (fields.length === 0) {
        return { success: false, error: "No fields to update" };
      }

      fields.push("updated_at = NOW()");
      params.push(id);

      const sql = `UPDATE members SET ${fields.join(", ")} WHERE id = ?`;
      const result = await query(sql, params);

      if (result.success) {
        return await this.findById(id);
      }

      return result;
    } catch (error) {
      console.error("Member update error:", error);
      return { success: false, error: error.message };
    }
  }

  static async delete(id) {
    try {
      const sql =
        "UPDATE members SET is_active = false, updated_at = NOW() WHERE id = ?";
      const result = await query(sql, [id]);
      return result;
    } catch (error) {
      console.error("Member delete error:", error);
      return { success: false, error: error.message };
    }
  }

  static async getStats() {
    try {
      const stats = {};

      // Total active members
      const totalResult = await query(
        "SELECT COUNT(*) as total FROM members WHERE is_active = true",
      );
      stats.total = totalResult.success ? totalResult.data[0].total : 0;

      // New members this month
      const newMembersResult = await query(`
        SELECT COUNT(*) as new_members 
        FROM members 
        WHERE is_active = true 
        AND membership_date >= DATE_SUB(NOW(), INTERVAL 1 MONTH)
      `);
      stats.new_this_month = newMembersResult.success
        ? newMembersResult.data[0].new_members
        : 0;

      // Gender distribution
      const genderResult = await query(`
        SELECT gender, COUNT(*) as count 
        FROM members 
        WHERE is_active = true 
        GROUP BY gender
      `);
      stats.gender_distribution = genderResult.success ? genderResult.data : [];

      // Marital status distribution
      const maritalResult = await query(`
        SELECT marital_status, COUNT(*) as count 
        FROM members 
        WHERE is_active = true 
        GROUP BY marital_status
      `);
      stats.marital_distribution = maritalResult.success
        ? maritalResult.data
        : [];

      return { success: true, data: stats };
    } catch (error) {
      console.error("Member stats error:", error);
      return { success: false, error: error.message };
    }
  }

  static async generateMemberId() {
    try {
      const currentYear = new Date().getFullYear();
      const prefix = `TSOAM${currentYear}`;

      const result = await query(
        `
        SELECT member_id 
        FROM members 
        WHERE member_id LIKE ? 
        ORDER BY member_id DESC 
        LIMIT 1
      `,
        [`${prefix}-%`],
      );

      let nextNumber = 1;

      if (result.success && result.data.length > 0) {
        const lastId = result.data[0].member_id;
        const lastNumber = parseInt(lastId.split("-")[1]);
        nextNumber = lastNumber + 1;
      }

      return `${prefix}-${nextNumber.toString().padStart(3, "0")}`;
    } catch (error) {
      console.error("Generate member ID error:", error);
      return `TSOAM${new Date().getFullYear()}-001`;
    }
  }

  static async generateTitheNumber() {
    try {
      const currentYear = new Date().getFullYear();
      const prefix = `TS-${currentYear}`;

      const result = await query(
        `
        SELECT tithe_number 
        FROM members 
        WHERE tithe_number LIKE ? 
        ORDER BY tithe_number DESC 
        LIMIT 1
      `,
        [`${prefix}-%`],
      );

      let nextNumber = 1;

      if (result.success && result.data.length > 0) {
        const lastNumber = result.data[0].tithe_number;
        const lastNum = parseInt(lastNumber.split("-")[2]);
        nextNumber = lastNum + 1;
      }

      return `${prefix}-${nextNumber.toString().padStart(3, "0")}`;
    } catch (error) {
      console.error("Generate tithe number error:", error);
      return `TS-${new Date().getFullYear()}-001`;
    }
  }
}

module.exports = Member;
