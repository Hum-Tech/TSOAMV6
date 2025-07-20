/**
 * Database Connection Configuration
 * TSOAM Church Management System
 *
 * This module handles database connections, connection pooling,
 * and provides a centralized interface for database operations.
 */

const mysql = require("mysql2/promise");
const fs = require("fs").promises;
const path = require("path");

/**
 * Database configuration
 * In production, these should be environment variables
 */
const DB_CONFIG = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tsoam_church_db",
  connectionLimit: 10,
  acquireTimeout: 60000,
  timezone: "+03:00", // Kenya timezone (EAT)
  charset: "utf8mb4",
  multipleStatements: true,
};

/**
 * Connection pool for better performance
 */
let pool = null;

/**
 * Initialize database connection pool
 * @returns {Promise<mysql.Pool>} Database connection pool
 */
async function initializeDatabase() {
  try {
    console.log("Initializing database connection...");

    // Create connection pool
    pool = mysql.createPool(DB_CONFIG);

    // Test connection
    const connection = await pool.getConnection();
    console.log("Database connected successfully");

    // Check if database exists, if not create it
    await ensureDatabaseExists(connection);

    // Check if tables exist, if not create them
    await ensureTablesExist();

    connection.release();

    return pool;
  } catch (error) {
    console.error("Database initialization failed:", error);
    throw error;
  }
}

/**
 * Ensure database exists
 * @param {mysql.Connection} connection Database connection
 */
async function ensureDatabaseExists(connection) {
  try {
    // Create database if it doesn't exist
    const createDbQuery = `CREATE DATABASE IF NOT EXISTS ${DB_CONFIG.database} 
                          CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`;
    await connection.execute(createDbQuery);

    // Use the database
    await connection.execute(`USE ${DB_CONFIG.database}`);

    console.log(`Database ${DB_CONFIG.database} is ready`);
  } catch (error) {
    console.error("Error ensuring database exists:", error);
    throw error;
  }
}

/**
 * Ensure all required tables exist
 */
async function ensureTablesExist() {
  try {
    const connection = await pool.getConnection();

    // Check if users table exists
    const [tables] = await connection.execute(
      `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'users'
    `,
      [DB_CONFIG.database],
    );

    // If tables don't exist, create them from schema
    if (tables[0].count === 0) {
      console.log("Tables not found. Creating database schema...");
      await createTablesFromSchema(connection);
    } else {
      console.log("Database tables already exist");
    }

    connection.release();
  } catch (error) {
    console.error("Error checking/creating tables:", error);
    throw error;
  }
}

/**
 * Create tables from SQL schema file
 * @param {mysql.Connection} connection Database connection
 */
async function createTablesFromSchema(connection) {
  try {
    const schemaPath = path.join(__dirname, "../../database/schema.sql");
    const schemaSQL = await fs.readFile(schemaPath, "utf8");

    // Split schema into individual statements
    const statements = schemaSQL
      .split(";")
      .map((stmt) => stmt.trim())
      .filter(
        (stmt) =>
          stmt.length > 0 &&
          !stmt.startsWith("--") &&
          !stmt.startsWith("CREATE DATABASE"),
      );

    // Execute each statement
    for (const statement of statements) {
      if (
        statement.includes("CREATE TABLE") ||
        statement.includes("CREATE VIEW") ||
        statement.includes("CREATE INDEX") ||
        statement.includes("INSERT INTO")
      ) {
        try {
          await connection.execute(statement);
        } catch (error) {
          // Log error but continue with other statements
          console.warn(`Warning executing statement: ${error.message}`);
        }
      }
    }

    console.log("Database schema created successfully");
  } catch (error) {
    console.error("Error creating schema:", error);
    throw error;
  }
}

/**
 * Get database connection from pool
 * @returns {Promise<mysql.Connection>} Database connection
 */
async function getConnection() {
  if (!pool) {
    throw new Error(
      "Database not initialized. Call initializeDatabase() first.",
    );
  }
  return await pool.getConnection();
}

/**
 * Execute a query with parameters
 * @param {string} query SQL query
 * @param {Array} params Query parameters
 * @returns {Promise<Array>} Query results
 */
async function executeQuery(query, params = []) {
  const connection = await getConnection();
  try {
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error("Query execution error:", error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Execute a transaction (multiple queries atomically)
 * @param {Array} queries Array of {query, params} objects
 * @returns {Promise<Array>} Results from all queries
 */
async function executeTransaction(queries) {
  const connection = await getConnection();
  try {
    await connection.beginTransaction();

    const results = [];
    for (const { query, params = [] } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
    }

    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    console.error("Transaction error:", error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Get the next ID for a given table
 * @param {string} tableName Name of the table
 * @param {string} idColumn Name of the ID column
 * @returns {Promise<number>} Next available ID
 */
async function getNextId(tableName, idColumn = "id") {
  const query = `SELECT COALESCE(MAX(${idColumn}), 0) + 1 as next_id FROM ${tableName}`;
  const results = await executeQuery(query);
  return results[0].next_id;
}

/**
 * Generate next formatted ID for entities
 * @param {string} prefix ID prefix (e.g., 'TSOAM-EMP-', 'TXN-2025-')
 * @param {string} tableName Table to check for existing IDs
 * @param {string} columnName Column containing the formatted ID
 * @returns {Promise<string>} Next formatted ID
 */
async function generateNextFormattedId(prefix, tableName, columnName) {
  const query = `
    SELECT ${columnName} 
    FROM ${tableName} 
    WHERE ${columnName} LIKE ? 
    ORDER BY ${columnName} DESC 
    LIMIT 1
  `;

  const results = await executeQuery(query, [`${prefix}%`]);

  if (results.length === 0) {
    return `${prefix}001`;
  }

  const lastId = results[0][columnName];
  const lastNumber = parseInt(lastId.split("-").pop());
  const nextNumber = lastNumber + 1;

  return `${prefix}${nextNumber.toString().padStart(3, "0")}`;
}

/**
 * Create database backup
 * @param {string} backupPath Path to save backup file
 * @returns {Promise<string>} Backup file path
 */
async function createBackup(backupPath) {
  const connection = await getConnection();
  try {
    // Get all table names
    const [tables] = await connection.execute(
      `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ?
    `,
      [DB_CONFIG.database],
    );

    let backupSQL = `-- TSOAM Church Management System Backup\n`;
    backupSQL += `-- Generated on: ${new Date().toISOString()}\n\n`;
    backupSQL += `USE ${DB_CONFIG.database};\n\n`;

    // Export each table
    for (const table of tables) {
      const tableName = table.table_name || table.TABLE_NAME;

      // Get table structure
      const [createTable] = await connection.execute(
        `SHOW CREATE TABLE ${tableName}`,
      );
      backupSQL += `-- Table: ${tableName}\n`;
      backupSQL += `DROP TABLE IF EXISTS ${tableName};\n`;
      backupSQL += `${createTable[0]["Create Table"] || createTable[0]["CREATE TABLE"]};\n\n`;

      // Get table data
      const [rows] = await connection.execute(`SELECT * FROM ${tableName}`);
      if (rows.length > 0) {
        backupSQL += `-- Data for table: ${tableName}\n`;
        backupSQL += `INSERT INTO ${tableName} VALUES\n`;

        const values = rows.map((row) => {
          const rowValues = Object.values(row).map((value) => {
            if (value === null) return "NULL";
            if (typeof value === "string")
              return `'${value.replace(/'/g, "''")}'`;
            if (value instanceof Date)
              return `'${value.toISOString().slice(0, 19).replace("T", " ")}'`;
            return value;
          });
          return `(${rowValues.join(", ")})`;
        });

        backupSQL += values.join(",\n") + ";\n\n";
      }
    }

    // Write backup to file
    await fs.writeFile(backupPath, backupSQL, "utf8");
    console.log(`Database backup created: ${backupPath}`);

    return backupPath;
  } catch (error) {
    console.error("Backup creation error:", error);
    throw error;
  } finally {
    connection.release();
  }
}

/**
 * Close database connection pool
 */
async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log("Database connections closed");
  }
}

/**
 * Health check for database connection
 * @returns {Promise<boolean>} True if database is healthy
 */
async function healthCheck() {
  try {
    const connection = await getConnection();
    await connection.execute("SELECT 1");
    connection.release();
    return true;
  } catch (error) {
    console.error("Database health check failed:", error);
    return false;
  }
}

module.exports = {
  initializeDatabase,
  getConnection,
  executeQuery,
  executeTransaction,
  getNextId,
  generateNextFormattedId,
  createBackup,
  closeDatabase,
  healthCheck,
  pool: () => pool,
};
