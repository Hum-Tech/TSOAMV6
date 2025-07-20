const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
require("dotenv").config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  multipleStatements: true,
};

async function setupDatabase() {
  let connection;

  try {
    console.log("🔄 Connecting to MySQL server...");

    // Connect to MySQL server (without database)
    connection = await mysql.createConnection(dbConfig);

    console.log("✅ Connected to MySQL server");

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || "tsoam_church_db";
    await connection.execute(
      `CREATE DATABASE IF NOT EXISTS ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    console.log(`✅ Database "${dbName}" created/verified`);

    // Use the database
    await connection.execute(`USE ${dbName}`);

    // Read and execute schema file
    const schemaPath = path.join(__dirname, "schema.sql");
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, "utf8");

      console.log("🔄 Executing database schema...");
      await connection.execute(schema);
      console.log("✅ Database schema executed successfully");
    } else {
      console.log("⚠️  Schema file not found, creating basic tables...");

      // Create essential tables if schema file doesn't exist
      const basicTables = `
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(50) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role ENUM('Admin', 'HR Officer', 'Finance Officer', 'User') DEFAULT 'User',
          is_active BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE IF NOT EXISTS password_resets (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(50) NOT NULL,
          email VARCHAR(255) NOT NULL,
          reset_code VARCHAR(6) NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          used BOOLEAN DEFAULT FALSE,
          INDEX idx_email (email),
          INDEX idx_reset_code (reset_code)
        );
        
        CREATE TABLE IF NOT EXISTS system_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          action VARCHAR(255) NOT NULL,
          module VARCHAR(100) NOT NULL,
          details TEXT,
          severity ENUM('Info', 'Warning', 'Error', 'Critical') DEFAULT 'Info',
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      await connection.execute(basicTables);
      console.log("✅ Basic tables created");
    }

    // Verify tables were created
    const [tables] = await connection.execute("SHOW TABLES");
    console.log(`✅ Database setup complete with ${tables.length} tables:`);
    tables.forEach((table) => {
      console.log(`   - ${Object.values(table)[0]}`);
    });

    // Insert default admin user if not exists
    const adminUser = {
      id: "admin-001",
      name: "System Administrator",
      email: "admin@tsoam.org",
      password_hash:
        "$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDjCNVJ7q7Y.Fqe", // admin123
      role: "Admin",
      is_active: true,
    };

    try {
      await connection.execute(
        "INSERT IGNORE INTO users (id, name, email, password_hash, role, is_active) VALUES (?, ?, ?, ?, ?, ?)",
        [
          adminUser.id,
          adminUser.name,
          adminUser.email,
          adminUser.password_hash,
          adminUser.role,
          adminUser.is_active,
        ],
      );
      console.log("✅ Default admin user created/verified");
    } catch (error) {
      console.log("⚠️  Admin user already exists or error:", error.message);
    }

    console.log("\n🎉 Database setup completed successfully!");
    console.log(`📊 Database: ${dbName}`);
    console.log(`🔑 Admin Login: admin@tsoam.org / admin123`);
  } catch (error) {
    console.error("❌ Database setup failed:", error.message);
    console.log("\n💡 Troubleshooting tips:");
    console.log("1. Ensure MySQL server is running");
    console.log("2. Check database credentials in .env file");
    console.log("3. Verify MySQL user has CREATE DATABASE permissions");
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase;
