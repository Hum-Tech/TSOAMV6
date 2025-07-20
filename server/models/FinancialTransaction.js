const { query, getConnection } = require("../config/database");
const { v4: uuidv4 } = require("uuid");

class FinancialTransaction {
  static async create(transactionData) {
    try {
      const id = uuidv4();
      const transactionId = await this.generateTransactionId();

      const sql = `
        INSERT INTO financial_transactions (
          id, transaction_id, type, category, subcategory, amount, 
          description, date, payment_method, reference_number, 
          member_id, created_by, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;

      const params = [
        id,
        transactionId,
        transactionData.type,
        transactionData.category,
        transactionData.subcategory,
        transactionData.amount,
        transactionData.description,
        transactionData.date,
        transactionData.payment_method,
        transactionData.reference_number,
        transactionData.member_id,
        transactionData.created_by,
        transactionData.status || "Pending",
      ];

      const result = await query(sql, params);

      if (result.success) {
        return {
          success: true,
          data: { id, transaction_id: transactionId, ...transactionData },
        };
      }

      return { success: false, error: result.error };
    } catch (error) {
      console.error("Financial transaction creation error:", error);
      return { success: false, error: error.message };
    }
  }

  static async findAll(filters = {}) {
    try {
      let sql = `
        SELECT ft.*, m.full_name as member_name, u.name as created_by_name
        FROM financial_transactions ft
        LEFT JOIN members m ON ft.member_id = m.id
        LEFT JOIN users u ON ft.created_by = u.id
        WHERE 1=1
      `;
      const params = [];

      if (filters.type) {
        sql += " AND ft.type = ?";
        params.push(filters.type);
      }

      if (filters.category) {
        sql += " AND ft.category = ?";
        params.push(filters.category);
      }

      if (filters.status) {
        sql += " AND ft.status = ?";
        params.push(filters.status);
      }

      if (filters.member_id) {
        sql += " AND ft.member_id = ?";
        params.push(filters.member_id);
      }

      if (filters.date_from) {
        sql += " AND ft.date >= ?";
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        sql += " AND ft.date <= ?";
        params.push(filters.date_to);
      }

      if (filters.search) {
        sql +=
          " AND (ft.description LIKE ? OR ft.reference_number LIKE ? OR m.full_name LIKE ?)";
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      sql += " ORDER BY ft.created_at DESC";

      if (filters.limit) {
        sql += " LIMIT ?";
        params.push(parseInt(filters.limit));
      }

      const result = await query(sql, params);
      return result.success ? { success: true, data: result.data } : result;
    } catch (error) {
      console.error("Financial transaction findAll error:", error);
      return { success: false, error: error.message };
    }
  }

  static async findById(id) {
    try {
      const sql = `
        SELECT ft.*, m.full_name as member_name, u.name as created_by_name
        FROM financial_transactions ft
        LEFT JOIN members m ON ft.member_id = m.id
        LEFT JOIN users u ON ft.created_by = u.id
        WHERE ft.id = ?
      `;
      const result = await query(sql, [id]);

      if (result.success && result.data.length > 0) {
        return { success: true, data: result.data[0] };
      }

      return { success: false, error: "Transaction not found" };
    } catch (error) {
      console.error("Financial transaction findById error:", error);
      return { success: false, error: error.message };
    }
  }

  static async updateStatus(id, status, approvedBy = null) {
    try {
      const sql = `
        UPDATE financial_transactions 
        SET status = ?, approved_by = ?, updated_at = NOW() 
        WHERE id = ?
      `;
      const result = await query(sql, [status, approvedBy, id]);

      if (result.success) {
        return await this.findById(id);
      }

      return result;
    } catch (error) {
      console.error("Financial transaction update status error:", error);
      return { success: false, error: error.message };
    }
  }

  static async getFinancialSummary(filters = {}) {
    try {
      const summary = {};

      // Total income
      let incomeParams = [];
      let incomeSql = `
        SELECT COALESCE(SUM(amount), 0) as total_income 
        FROM financial_transactions 
        WHERE type = 'Income' AND status = 'Approved'
      `;

      if (filters.date_from) {
        incomeSql += " AND date >= ?";
        incomeParams.push(filters.date_from);
      }

      if (filters.date_to) {
        incomeSql += " AND date <= ?";
        incomeParams.push(filters.date_to);
      }

      const incomeResult = await query(incomeSql, incomeParams);
      summary.total_income = incomeResult.success
        ? incomeResult.data[0].total_income
        : 0;

      // Total expenses
      let expenseParams = [];
      let expenseSql = `
        SELECT COALESCE(SUM(amount), 0) as total_expenses 
        FROM financial_transactions 
        WHERE type = 'Expense' AND status = 'Approved'
      `;

      if (filters.date_from) {
        expenseSql += " AND date >= ?";
        expenseParams.push(filters.date_from);
      }

      if (filters.date_to) {
        expenseSql += " AND date <= ?";
        expenseParams.push(filters.date_to);
      }

      const expenseResult = await query(expenseSql, expenseParams);
      summary.total_expenses = expenseResult.success
        ? expenseResult.data[0].total_expenses
        : 0;

      // Net balance
      summary.net_balance = summary.total_income - summary.total_expenses;

      // Category breakdown
      let categoryParams = [];
      let categorySql = `
        SELECT category, type, SUM(amount) as total 
        FROM financial_transactions 
        WHERE status = 'Approved'
      `;

      if (filters.date_from) {
        categorySql += " AND date >= ?";
        categoryParams.push(filters.date_from);
      }

      if (filters.date_to) {
        categorySql += " AND date <= ?";
        categoryParams.push(filters.date_to);
      }

      categorySql += " GROUP BY category, type ORDER BY total DESC";

      const categoryResult = await query(categorySql, categoryParams);
      summary.category_breakdown = categoryResult.success
        ? categoryResult.data
        : [];

      // Monthly trends (last 12 months)
      const trendSql = `
        SELECT 
          DATE_FORMAT(date, '%Y-%m') as month,
          type,
          SUM(amount) as total
        FROM financial_transactions 
        WHERE status = 'Approved' 
        AND date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY month, type
        ORDER BY month DESC
      `;

      const trendResult = await query(trendSql);
      summary.monthly_trends = trendResult.success ? trendResult.data : [];

      return { success: true, data: summary };
    } catch (error) {
      console.error("Financial summary error:", error);
      return { success: false, error: error.message };
    }
  }

  static async generateTransactionId() {
    try {
      const currentYear = new Date().getFullYear();
      const prefix = `FTX${currentYear}`;

      const result = await query(
        `
        SELECT transaction_id 
        FROM financial_transactions 
        WHERE transaction_id LIKE ? 
        ORDER BY transaction_id DESC 
        LIMIT 1
      `,
        [`${prefix}%`],
      );

      let nextNumber = 1;

      if (result.success && result.data.length > 0) {
        const lastId = result.data[0].transaction_id;
        const lastNumber = parseInt(lastId.replace(prefix, ""));
        nextNumber = lastNumber + 1;
      }

      return `${prefix}${nextNumber.toString().padStart(4, "0")}`;
    } catch (error) {
      console.error("Generate transaction ID error:", error);
      return `FTX${new Date().getFullYear()}0001`;
    }
  }

  static async delete(id) {
    try {
      const sql = "DELETE FROM financial_transactions WHERE id = ?";
      const result = await query(sql, [id]);
      return result;
    } catch (error) {
      console.error("Financial transaction delete error:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = FinancialTransaction;
