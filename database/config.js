// TSOAM Church Management System - Database Configuration

// Database connection configuration
const dbConfig = {
  // SQLite configuration for local development and downloaded systems
  sqlite: {
    database: "./database/tsoam_church.db",
    options: {
      // Enable foreign keys
      pragma: {
        foreign_keys: "ON",
        journal_mode: "WAL",
        synchronous: "NORMAL",
        temp_store: "MEMORY",
        mmap_size: 67108864, // 64MB
      },
    },
  },

  // MySQL configuration for production
  mysql: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "church_admin",
    password: process.env.DB_PASSWORD || "secure_password",
    database: process.env.DB_NAME || "tsoam_church",
    charset: "utf8mb4",
    timezone: "local",
    acquireTimeout: 60000,
    timeout: 60000,
    reconnect: true,
  },
};

// Data separation configuration
const dataConfig = {
  // Demo data markers
  demoDataFlag: "is_demo_data",

  // Tables that support demo/real data separation
  separatedTables: [
    "users",
    "members",
    "financial_transactions",
    "employees",
    "inventory_items",
    "welfare_requests",
    "message_history",
    "events",
    "appointments",
    "system_logs",
  ],

  // Tables that are always real (no demo separation)
  realDataOnlyTables: [
    "system_settings",
    "welfare_budget",
    "message_templates",
  ],
};

// Database operations utility
class DatabaseManager {
  constructor() {
    this.connection = null;
    this.dbType = "sqlite"; // Default to SQLite for local development
  }

  // Initialize database connection
  async connect(type = "sqlite") {
    this.dbType = type;

    try {
      if (type === "sqlite") {
        const Database = require("better-sqlite3");
        this.connection = new Database(dbConfig.sqlite.database);

        // Apply SQLite pragmas
        Object.entries(dbConfig.sqlite.options.pragma).forEach(
          ([key, value]) => {
            this.connection.pragma(`${key} = ${value}`);
          },
        );

        console.log("Connected to SQLite database successfully");
      } else if (type === "mysql") {
        const mysql = require("mysql2/promise");
        this.connection = await mysql.createConnection(dbConfig.mysql);
        console.log("Connected to MySQL database successfully");
      }

      return this.connection;
    } catch (error) {
      console.error("Database connection failed:", error);
      throw error;
    }
  }

  // Execute SQL with demo data filtering
  async query(sql, params = [], includeDemo = false) {
    if (!this.connection) {
      throw new Error("Database not connected");
    }

    try {
      // Modify query to filter demo data if needed
      if (!includeDemo && this.shouldFilterDemo(sql)) {
        sql = this.addDemoFilter(sql);
      }

      if (this.dbType === "sqlite") {
        const stmt = this.connection.prepare(sql);
        return params.length > 0 ? stmt.all(params) : stmt.all();
      } else {
        const [rows] = await this.connection.execute(sql, params);
        return rows;
      }
    } catch (error) {
      console.error("Query execution failed:", error);
      throw error;
    }
  }

  // Insert data with demo flag
  async insert(table, data, isDemo = false) {
    // Add demo flag to data if table supports separation
    if (dataConfig.separatedTables.includes(table)) {
      data[dataConfig.demoDataFlag] = isDemo;
    }

    const columns = Object.keys(data).join(", ");
    const placeholders = Object.keys(data)
      .map(() => "?")
      .join(", ");
    const values = Object.values(data);

    const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})`;

    try {
      if (this.dbType === "sqlite") {
        const stmt = this.connection.prepare(sql);
        return stmt.run(values);
      } else {
        const [result] = await this.connection.execute(sql, values);
        return result;
      }
    } catch (error) {
      console.error("Insert failed:", error);
      throw error;
    }
  }

  // Update data
  async update(table, data, whereClause, whereParams = []) {
    const setClause = Object.keys(data)
      .map((key) => `${key} = ?`)
      .join(", ");
    const values = [...Object.values(data), ...whereParams];

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${whereClause}`;

    try {
      if (this.dbType === "sqlite") {
        const stmt = this.connection.prepare(sql);
        return stmt.run(values);
      } else {
        const [result] = await this.connection.execute(sql, values);
        return result;
      }
    } catch (error) {
      console.error("Update failed:", error);
      throw error;
    }
  }

  // Delete data
  async delete(table, whereClause, whereParams = []) {
    const sql = `DELETE FROM ${table} WHERE ${whereClause}`;

    try {
      if (this.dbType === "sqlite") {
        const stmt = this.connection.prepare(sql);
        return stmt.run(whereParams);
      } else {
        const [result] = await this.connection.execute(sql, whereParams);
        return result;
      }
    } catch (error) {
      console.error("Delete failed:", error);
      throw error;
    }
  }

  // Clean all demo data
  async cleanDemoData() {
    const tables = dataConfig.separatedTables;

    try {
      for (const table of tables) {
        await this.delete(table, `${dataConfig.demoDataFlag} = ?`, [true]);
      }
      console.log("Demo data cleaned successfully");
    } catch (error) {
      console.error("Demo data cleanup failed:", error);
      throw error;
    }
  }

  // Check if query should filter demo data
  shouldFilterDemo(sql) {
    const upperSql = sql.toUpperCase();
    return (
      upperSql.includes("SELECT") &&
      dataConfig.separatedTables.some((table) =>
        upperSql.includes(table.toUpperCase()),
      )
    );
  }

  // Add demo data filter to query
  addDemoFilter(sql) {
    // Simple demo filter addition (can be enhanced)
    if (sql.toUpperCase().includes("WHERE")) {
      return sql + ` AND ${dataConfig.demoDataFlag} = 0`;
    } else {
      return sql + ` WHERE ${dataConfig.demoDataFlag} = 0`;
    }
  }

  // Initialize database schema
  async initializeSchema() {
    const fs = require("fs");
    const path = require("path");

    try {
      const schemaPath = path.join(__dirname, "init.sql");
      const schema = fs.readFileSync(schemaPath, "utf8");

      // Split schema into individual statements
      const statements = schema.split(";").filter((stmt) => stmt.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          await this.query(statement);
        }
      }

      console.log("Database schema initialized successfully");
    } catch (error) {
      console.error("Schema initialization failed:", error);
      throw error;
    }
  }

  // Export data for backup
  async exportData(includeDemo = false) {
    const exportData = {};

    try {
      for (const table of [
        ...dataConfig.separatedTables,
        ...dataConfig.realDataOnlyTables,
      ]) {
        const sql = `SELECT * FROM ${table}`;
        exportData[table] = await this.query(sql, [], includeDemo);
      }

      return exportData;
    } catch (error) {
      console.error("Data export failed:", error);
      throw error;
    }
  }

  // Close database connection
  async close() {
    if (this.connection) {
      if (this.dbType === "sqlite") {
        this.connection.close();
      } else {
        await this.connection.end();
      }
      this.connection = null;
      console.log("Database connection closed");
    }
  }
}

// Export configuration and manager
module.exports = {
  dbConfig,
  dataConfig,
  DatabaseManager,
};

// Example usage:
// const { DatabaseManager } = require('./database/config');
// const db = new DatabaseManager();
// await db.connect('sqlite');
// await db.initializeSchema();
