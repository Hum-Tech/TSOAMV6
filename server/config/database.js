const mysql = require("mysql2/promise");
require("dotenv").config();

// Database configuration for localhost deployment
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "tsoam_church_db",
  charset: "utf8mb4",
  connectionLimit: 20,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  multipleStatements: true,
};

// Create connection pool for better performance
const pool = mysql.createPool(dbConfig);

// Test database connection
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("✅ Database connected successfully to:", dbConfig.database);
    console.log("📍 Host:", dbConfig.host, "Port:", dbConfig.port);
    connection.release();
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error.message);
    console.log(
      "💡 Please ensure MySQL is running and credentials are correct",
    );
    return false;
  }
}

// Initialize database (create tables if they don't exist)
async function initializeDatabase() {
  try {
    console.log("🔄 Initializing database...");

    // Check if database exists, create if not
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true,
    });

    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connection.end();

    // Now connect to the specific database
    const dbConnection = await pool.getConnection();

    // Check if tables exist
    const [tables] = await dbConnection.execute("SHOW TABLES");

    if (tables.length === 0) {
      console.log("📦 Database is empty, please run the schema.sql file");
      console.log(
        "💻 Command: mysql -u root -p tsoam_church_db < database/schema.sql",
      );
    } else {
      console.log(`✅ Database initialized with ${tables.length} tables`);
    }

    dbConnection.release();
    return true;
  } catch (error) {
    console.error("❌ Database initialization failed:", error.message);
    return false;
  }
}

// Execute query with error handling
async function query(sql, params = []) {
  try {
    const [results] = await pool.execute(sql, params);
    return { success: true, data: results };
  } catch (error) {
    console.error("Database query error:", error.message);
    return { success: false, error: error.message };
  }
}

// Get connection from pool
async function getConnection() {
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error("Failed to get database connection:", error.message);
    throw error;
  }
}

// Close all connections
async function closePool() {
  try {
    await pool.end();
    console.log("🔌 Database connection pool closed");
  } catch (error) {
    console.error("Error closing database pool:", error.message);
  }
}

module.exports = {
  pool,
  query,
  getConnection,
  testConnection,
  initializeDatabase,
  closePool,
  dbConfig,
};
