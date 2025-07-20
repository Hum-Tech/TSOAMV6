#!/usr/bin/env node

/**
 * TSOAM Church Management System - Complete Setup Script
 *
 * This script handles the complete setup of the TSOAM system including:
 * - Dependency installation
 * - Database creation and configuration
 * - Environment setup
 * - Initial data population
 * - System validation
 *
 * Usage: node setup-system.js
 *
 * @author TSOAM Development Team
 * @version 2.0.0
 */

const { execSync, spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Console colors for better output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
};

// Helper function for colored console output
function log(message, color = "white") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Helper function to check if a command exists
function commandExists(command) {
  try {
    execSync(`which ${command}`, { stdio: "ignore" });
    return true;
  } catch (error) {
    return false;
  }
}

// Helper function to execute commands with error handling
function executeCommand(command, description, workingDir = process.cwd()) {
  try {
    log(`\n🔄 ${description}...`, "cyan");
    execSync(command, {
      stdio: "inherit",
      cwd: workingDir,
      env: { ...process.env, NODE_ENV: "development" },
    });
    log(`✅ ${description} completed successfully`, "green");
    return true;
  } catch (error) {
    log(`❌ Error during ${description}: ${error.message}`, "red");
    return false;
  }
}

// Helper function to create readline interface
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Helper function to ask questions
function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

// System requirements check
async function checkSystemRequirements() {
  log("\n🔍 Checking System Requirements...", "bright");

  const requirements = [
    {
      name: "Node.js",
      command: "node",
      version: "--version",
      minVersion: "16.0.0",
    },
    { name: "npm", command: "npm", version: "--version", minVersion: "8.0.0" },
    {
      name: "MySQL",
      command: "mysql",
      version: "--version",
      minVersion: "8.0.0",
    },
  ];

  let allRequirementsMet = true;

  for (const req of requirements) {
    if (commandExists(req.command)) {
      try {
        const version = execSync(`${req.command} ${req.version}`, {
          encoding: "utf8",
        });
        log(`✅ ${req.name}: ${version.trim()}`, "green");
      } catch (error) {
        log(`⚠️  ${req.name}: Installed but version check failed`, "yellow");
      }
    } else {
      log(`❌ ${req.name}: Not found`, "red");
      allRequirementsMet = false;
    }
  }

  if (!allRequirementsMet) {
    log(
      "\n❌ Some system requirements are not met. Please install missing software before continuing.",
      "red",
    );
    process.exit(1);
  }

  log("\n✅ All system requirements are met!", "green");
}

// Environment setup
async function setupEnvironment() {
  log("\n⚙️ Setting up environment configuration...", "bright");

  const rl = createReadlineInterface();

  try {
    // Check if .env already exists
    if (fs.existsSync(".env")) {
      log("📁 .env file already exists", "yellow");
      const overwrite = await askQuestion(
        rl,
        "❓ Do you want to overwrite the existing .env file? (y/N): ",
      );
      if (overwrite.toLowerCase() !== "y") {
        log("⏭️  Skipping environment setup", "cyan");
        rl.close();
        return;
      }
    }

    log("\n📝 Please provide the following configuration:");

    // Database configuration
    const dbHost =
      (await askQuestion(rl, "🗄️  Database Host (localhost): ")) || "localhost";
    const dbPort =
      (await askQuestion(rl, "🔌 Database Port (3306): ")) || "3306";
    const dbName =
      (await askQuestion(rl, "📊 Database Name (tsoam_church_db): ")) ||
      "tsoam_church_db";
    const dbUser =
      (await askQuestion(rl, "👤 Database User (root): ")) || "root";
    const dbPassword = await askQuestion(rl, "🔑 Database Password: ");

    // Server configuration
    const serverPort =
      (await askQuestion(rl, "🌐 Server Port (3001): ")) || "3001";

    // Security configuration
    log("\n🔐 Generating secure JWT and session secrets...");
    const jwtSecret = require("crypto").randomBytes(64).toString("base64");
    const sessionSecret = require("crypto").randomBytes(32).toString("base64");

    // Create environment configuration
    const envContent = `# TSOAM Church Management System - Environment Configuration
# Generated on: ${new Date().toISOString()}

# Database Configuration
DB_HOST=${dbHost}
DB_PORT=${dbPort}
DB_NAME=${dbName}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}

# Server Configuration
NODE_ENV=development
PORT=${serverPort}
HOST=0.0.0.0

# Security Configuration
JWT_SECRET=${jwtSecret}
SESSION_SECRET=${sessionSecret}
BCRYPT_ROUNDS=12
JWT_EXPIRES_IN=86400

# CORS Settings
CLIENT_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:${serverPort}

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ALLOWED_FILE_TYPES=jpeg,jpg,png,gif,pdf,doc,docx,xls,xlsx

# Logging Configuration
LOG_LEVEL=info
LOG_FILE_PATH=./logs
ENABLE_REQUEST_LOGGING=true

# Church Configuration
CHURCH_NAME=The Seed of Abraham Ministry (TSOAM)
CHURCH_ADDRESS=Nairobi, Kenya
CHURCH_PHONE=+254 700 000 000
CHURCH_EMAIL=admin@tsoam.org
DEFAULT_CURRENCY=KSH
DEFAULT_TIMEZONE=Africa/Nairobi
`;

    // Write .env file
    fs.writeFileSync(".env", envContent);
    log("✅ Environment configuration created successfully", "green");

    // Create server .env if it doesn't exist
    const serverEnvPath = "server/.env";
    if (!fs.existsSync(serverEnvPath)) {
      fs.writeFileSync(serverEnvPath, envContent);
      log("✅ Server environment configuration created", "green");
    }
  } catch (error) {
    log(`❌ Error setting up environment: ${error.message}`, "red");
  } finally {
    rl.close();
  }
}

// Database setup
async function setupDatabase() {
  log("\n🗄️ Setting up database...", "bright");

  try {
    // Load environment variables
    require("dotenv").config();

    const dbConfig = {
      host: process.env.DB_HOST || "localhost",
      port: process.env.DB_PORT || "3306",
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "tsoam_church_db",
    };

    // Test MySQL connection
    log("🔍 Testing MySQL connection...", "cyan");
    const testCommand = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ""} -e "SELECT 1"`;

    try {
      execSync(testCommand, { stdio: "ignore" });
      log("✅ MySQL connection successful", "green");
    } catch (error) {
      log("❌ MySQL connection failed", "red");
      log(
        "💡 Please check your MySQL credentials and ensure MySQL is running",
        "yellow",
      );
      return false;
    }

    // Create database
    log("📊 Creating database...", "cyan");
    const createDbCommand = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ""} -e "CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"`;

    if (executeCommand(createDbCommand, "Create database")) {
      log("✅ Database created successfully", "green");
    }

    // Import schema
    if (fs.existsSync("database/schema.sql")) {
      log("📋 Importing database schema...", "cyan");
      const importCommand = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ""} ${dbConfig.database} < database/schema.sql`;

      if (executeCommand(importCommand, "Import database schema")) {
        log("✅ Database schema imported successfully", "green");
      }
    } else {
      log("⚠️  Database schema file not found", "yellow");
    }

    // Apply optimizations
    if (fs.existsSync("database/optimize_database.sql")) {
      log("⚡ Applying database optimizations...", "cyan");
      const optimizeCommand = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} ${dbConfig.password ? `-p${dbConfig.password}` : ""} ${dbConfig.database} < database/optimize_database.sql`;

      if (executeCommand(optimizeCommand, "Apply database optimizations")) {
        log("✅ Database optimizations applied successfully", "green");
      }
    }

    return true;
  } catch (error) {
    log(`❌ Database setup failed: ${error.message}`, "red");
    return false;
  }
}

// Install dependencies
async function installDependencies() {
  log("\n📦 Installing dependencies...", "bright");

  // Install root dependencies
  if (!executeCommand("npm install", "Install root dependencies")) {
    return false;
  }

  // Install client dependencies
  if (fs.existsSync("client/package.json")) {
    if (
      !executeCommand("npm install", "Install client dependencies", "client")
    ) {
      return false;
    }
  }

  // Install server dependencies
  if (fs.existsSync("server/package.json")) {
    if (
      !executeCommand("npm install", "Install server dependencies", "server")
    ) {
      return false;
    }
  }

  log("✅ All dependencies installed successfully", "green");
  return true;
}

// Create necessary directories
function createDirectories() {
  log("\n📁 Creating necessary directories...", "bright");

  const directories = [
    "logs",
    "backups",
    "uploads",
    "uploads/documents",
    "uploads/employee-docs",
    "uploads/welfare",
    "uploads/inventory",
    "server/uploads",
    "server/logs",
  ];

  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`✅ Created directory: ${dir}`, "green");
    } else {
      log(`📁 Directory already exists: ${dir}`, "yellow");
    }
  });
}

// Build the application
async function buildApplication() {
  log("\n🔨 Building application...", "bright");

  // Build client
  if (fs.existsSync("client/package.json")) {
    if (
      !executeCommand(
        "npm run build-only",
        "Build client application",
        "client",
      )
    ) {
      log("⚠️  Client build failed, but continuing...", "yellow");
    }
  }

  return true;
}

// Validate installation
async function validateInstallation() {
  log("\n✅ Validating installation...", "bright");

  try {
    // Check database connection
    log("🔍 Testing database connection...", "cyan");
    if (executeCommand("npm run test-connection", "Test database connection")) {
      log("✅ Database connection validated", "green");
    }

    // Check file structure
    const criticalFiles = [
      "package.json",
      "client/package.json",
      "server/package.json",
      "database/schema.sql",
      ".env",
    ];

    let allFilesExist = true;
    criticalFiles.forEach((file) => {
      if (fs.existsSync(file)) {
        log(`✅ ${file}`, "green");
      } else {
        log(`❌ Missing: ${file}`, "red");
        allFilesExist = false;
      }
    });

    if (allFilesExist) {
      log("\n🎉 Installation validation completed successfully!", "green");
      return true;
    } else {
      log(
        "\n❌ Installation validation failed - missing critical files",
        "red",
      );
      return false;
    }
  } catch (error) {
    log(`❌ Validation error: ${error.message}`, "red");
    return false;
  }
}

// Show post-installation instructions
function showPostInstallInstructions() {
  log("\n" + "=".repeat(60), "cyan");
  log("🎉 TSOAM CHURCH MANAGEMENT SYSTEM SETUP COMPLETE!", "bright");
  log("=".repeat(60), "cyan");

  log("\n📋 Next Steps:", "bright");
  log("1. Start the development server:", "white");
  log("   npm run dev", "cyan");
  log("", "white");
  log("2. Access the application:", "white");
  log("   • Frontend: http://localhost:3000", "cyan");
  log("   • Backend:  http://localhost:3001", "cyan");
  log("", "white");
  log("3. Default login credentials:", "white");
  log("   • Email:    admin@tsoam.org", "cyan");
  log("   • Password: admin123", "cyan");
  log("", "white");
  log("4. For production deployment:", "white");
  log("   • Update .env with production values", "cyan");
  log("   • Run: npm run build-production", "cyan");
  log("   • Run: npm start", "cyan");
  log("", "white");

  log("📚 Documentation:", "bright");
  log("• Installation Guide: INSTALLATION_GUIDE.md", "cyan");
  log("• System Documentation: SYSTEM_DOCUMENTATION.md", "cyan");
  log("• API Documentation: /docs folder", "cyan");

  log("\n🔧 Troubleshooting:", "bright");
  log("• Check logs in the logs/ directory", "cyan");
  log("• Verify database connection with: npm run test-connection", "cyan");
  log("• For help, contact: support@tsoam.org", "cyan");

  log("\n" + "=".repeat(60), "cyan");
}

// Main setup function
async function main() {
  log("🚀 TSOAM CHURCH MANAGEMENT SYSTEM SETUP", "bright");
  log("======================================", "bright");

  try {
    // Step 1: Check system requirements
    await checkSystemRequirements();

    // Step 2: Setup environment
    await setupEnvironment();

    // Step 3: Create directories
    createDirectories();

    // Step 4: Install dependencies
    if (!(await installDependencies())) {
      log("❌ Failed to install dependencies", "red");
      process.exit(1);
    }

    // Step 5: Setup database
    if (!(await setupDatabase())) {
      log("❌ Database setup failed", "red");
      log(
        "💡 You can manually setup the database later using the SQL files in the database/ folder",
        "yellow",
      );
    }

    // Step 6: Build application
    await buildApplication();

    // Step 7: Validate installation
    if (!(await validateInstallation())) {
      log("⚠️  Installation completed with warnings", "yellow");
    }

    // Step 8: Show instructions
    showPostInstallInstructions();
  } catch (error) {
    log(`❌ Setup failed: ${error.message}`, "red");
    log("💡 Please check the error messages above and try again", "yellow");
    process.exit(1);
  }
}

// Handle script termination
process.on("SIGINT", () => {
  log("\n⚠️  Setup interrupted by user", "yellow");
  process.exit(0);
});

process.on("SIGTERM", () => {
  log("\n⚠️  Setup terminated", "yellow");
  process.exit(0);
});

// Run the setup
if (require.main === module) {
  main().catch((error) => {
    log(`❌ Unexpected error: ${error.message}`, "red");
    process.exit(1);
  });
}

module.exports = {
  checkSystemRequirements,
  setupEnvironment,
  setupDatabase,
  installDependencies,
  validateInstallation,
};
