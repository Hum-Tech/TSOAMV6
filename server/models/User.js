const { query, getConnection } = require("../config/database");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

class User {
  static async create(userData) {
    try {
      const id = uuidv4();
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const sql = `
        INSERT INTO users (
          id, name, email, password_hash, role, department, 
          employee_id, phone, is_active, address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        userData.name,
        userData.email.toLowerCase(),
        hashedPassword,
        userData.role || "User",
        userData.department,
        userData.employee_id,
        userData.phone,
        userData.is_active !== undefined ? userData.is_active : false,
        userData.address,
      ];

      const result = await query(sql, params);

      if (result.success) {
        const { password_hash, ...userWithoutPassword } = { id, ...userData };
        return { success: true, data: userWithoutPassword };
      }

      return { success: false, error: result.error };
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return { success: false, error: "Email already exists" };
      }
      console.error("User creation error:", error);
      return { success: false, error: error.message };
    }
  }

  static async findByEmail(email) {
    try {
      const sql = "SELECT * FROM users WHERE email = ?";
      const result = await query(sql, [email.toLowerCase()]);

      if (result.success && result.data.length > 0) {
        return { success: true, data: result.data[0] };
      }

      return { success: false, error: "User not found" };
    } catch (error) {
      console.error("User findByEmail error:", error);
      return { success: false, error: error.message };
    }
  }

  static async findById(id) {
    try {
      const sql = "SELECT * FROM users WHERE id = ?";
      const result = await query(sql, [id]);

      if (result.success && result.data.length > 0) {
        const { password_hash, ...userWithoutPassword } = result.data[0];
        return { success: true, data: userWithoutPassword };
      }

      return { success: false, error: "User not found" };
    } catch (error) {
      console.error("User findById error:", error);
      return { success: false, error: error.message };
    }
  }

  static async findAll(filters = {}) {
    try {
      let sql =
        "SELECT id, name, email, role, department, employee_id, phone, is_active, created_at, last_login FROM users WHERE 1=1";
      const params = [];

      if (filters.role) {
        sql += " AND role = ?";
        params.push(filters.role);
      }

      if (filters.department) {
        sql += " AND department = ?";
        params.push(filters.department);
      }

      if (filters.is_active !== undefined) {
        sql += " AND is_active = ?";
        params.push(filters.is_active);
      }

      if (filters.search) {
        sql += " AND (name LIKE ? OR email LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      sql += " ORDER BY created_at DESC";

      const result = await query(sql, params);
      return result.success ? { success: true, data: result.data } : result;
    } catch (error) {
      console.error("User findAll error:", error);
      return { success: false, error: error.message };
    }
  }

  static async validatePassword(email, password) {
    try {
      const userResult = await this.findByEmail(email);

      if (!userResult.success) {
        return { success: false, error: "Invalid credentials" };
      }

      const user = userResult.data;

      if (!user.is_active) {
        return { success: false, error: "Account is not active" };
      }

      const isValid = await bcrypt.compare(password, user.password_hash);

      if (!isValid) {
        return { success: false, error: "Invalid credentials" };
      }

      // Update last login
      await query("UPDATE users SET last_login = NOW() WHERE id = ?", [
        user.id,
      ]);

      const { password_hash, ...userWithoutPassword } = user;
      return { success: true, data: userWithoutPassword };
    } catch (error) {
      console.error("Password validation error:", error);
      return { success: false, error: error.message };
    }
  }

  static async updatePassword(id, newPassword) {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      const sql =
        "UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?";
      const result = await query(sql, [hashedPassword, id]);

      return result;
    } catch (error) {
      console.error("Update password error:", error);
      return { success: false, error: error.message };
    }
  }

  static async update(id, userData) {
    try {
      const fields = [];
      const params = [];

      Object.keys(userData).forEach((key) => {
        if (userData[key] !== undefined && key !== "id" && key !== "password") {
          if (key === "email") {
            fields.push(`${key} = ?`);
            params.push(userData[key].toLowerCase());
          } else {
            fields.push(`${key} = ?`);
            params.push(userData[key]);
          }
        }
      });

      if (fields.length === 0) {
        return { success: false, error: "No fields to update" };
      }

      fields.push("updated_at = NOW()");
      params.push(id);

      const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
      const result = await query(sql, params);

      if (result.success) {
        return await this.findById(id);
      }

      return result;
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return { success: false, error: "Email already exists" };
      }
      console.error("User update error:", error);
      return { success: false, error: error.message };
    }
  }

  static async activate(id) {
    try {
      const sql =
        "UPDATE users SET is_active = true, updated_at = NOW() WHERE id = ?";
      const result = await query(sql, [id]);

      if (result.success) {
        return await this.findById(id);
      }

      return result;
    } catch (error) {
      console.error("User activation error:", error);
      return { success: false, error: error.message };
    }
  }

  static async deactivate(id) {
    try {
      const sql =
        "UPDATE users SET is_active = false, updated_at = NOW() WHERE id = ?";
      const result = await query(sql, [id]);

      if (result.success) {
        return await this.findById(id);
      }

      return result;
    } catch (error) {
      console.error("User deactivation error:", error);
      return { success: false, error: error.message };
    }
  }

  static async delete(id) {
    try {
      const sql = "DELETE FROM users WHERE id = ?";
      const result = await query(sql, [id]);
      return result;
    } catch (error) {
      console.error("User delete error:", error);
      return { success: false, error: error.message };
    }
  }

  static async getUserStats() {
    try {
      const stats = {};

      // Total users
      const totalResult = await query("SELECT COUNT(*) as total FROM users");
      stats.total = totalResult.success ? totalResult.data[0].total : 0;

      // Active users
      const activeResult = await query(
        "SELECT COUNT(*) as active FROM users WHERE is_active = true",
      );
      stats.active = activeResult.success ? activeResult.data[0].active : 0;

      // Role distribution
      const roleResult = await query(`
        SELECT role, COUNT(*) as count 
        FROM users 
        WHERE is_active = true 
        GROUP BY role
      `);
      stats.role_distribution = roleResult.success ? roleResult.data : [];

      // Recent logins (last 7 days)
      const recentResult = await query(`
        SELECT COUNT(*) as recent_logins 
        FROM users 
        WHERE last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      `);
      stats.recent_logins = recentResult.success
        ? recentResult.data[0].recent_logins
        : 0;

      return { success: true, data: stats };
    } catch (error) {
      console.error("User stats error:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = User;
