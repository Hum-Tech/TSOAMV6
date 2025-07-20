#!/usr/bin/env node

/**
 * TSOAM Church Management System - System Cleanup Script
 *
 * This script cleans up unnecessary files and folders to prepare
 * the system for production deployment and better organization.
 *
 * Actions performed:
 * - Remove duplicate/unnecessary folders
 * - Clean up build artifacts
 * - Remove development-only files
 * - Organize project structure
 * - Generate file structure report
 *
 * @author TSOAM Development Team
 * @version 2.0.0
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Console colors
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

function log(message, color = "white") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configuration for cleanup
const cleanupConfig = {
  // Folders to remove (if they exist and are not essential)
  foldersToRemove: [
    "TSOAM", // Duplicate folder
    "dist", // Build artifacts (will be regenerated)
    "netlify", // Netlify-specific deployment files (not needed for local)
    ".cursor", // IDE-specific folder
    ".github", // GitHub workflows (not needed for local deployment)
  ],

  // Files to remove (development/unnecessary files)
  filesToRemove: [
    ".dockerignore", // Docker-specific (not needed for basic setup)
    "netlify.toml", // Netlify configuration
    "AGENTS.md", // Development documentation
    "vite.config.server.ts", // Duplicate config
    "server.js", // Duplicate server file (server/server.js is the main one)
    "setup.js", // Old setup script (replaced by setup-system.js)
  ],

  // Folders to create (if they don't exist)
  foldersToCreate: [
    "docs",
    "logs",
    "backups",
    "uploads",
    "uploads/documents",
    "uploads/employee-docs",
    "uploads/welfare",
    "uploads/inventory",
    "server/uploads",
    "server/logs",
    "temp",
  ],

  // Development dependencies to check in package.json
  devDependenciesToKeep: ["concurrently", "dotenv"],
};

// Function to safely remove files/folders
function safeRemove(itemPath, type = "file") {
  try {
    if (fs.existsSync(itemPath)) {
      const stats = fs.statSync(itemPath);

      if (type === "folder" && stats.isDirectory()) {
        fs.rmSync(itemPath, { recursive: true, force: true });
        log(`✅ Removed folder: ${itemPath}`, "green");
        return true;
      } else if (type === "file" && stats.isFile()) {
        fs.unlinkSync(itemPath);
        log(`✅ Removed file: ${itemPath}`, "green");
        return true;
      } else {
        log(`⚠️  Skipped ${itemPath}: Type mismatch`, "yellow");
        return false;
      }
    } else {
      log(`📁 Already clean: ${itemPath}`, "cyan");
      return false;
    }
  } catch (error) {
    log(`❌ Error removing ${itemPath}: ${error.message}`, "red");
    return false;
  }
}

// Function to create directories
function createDirectory(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      log(`✅ Created directory: ${dirPath}`, "green");
      return true;
    } else {
      log(`📁 Directory exists: ${dirPath}`, "cyan");
      return false;
    }
  } catch (error) {
    log(`❌ Error creating ${dirPath}: ${error.message}`, "red");
    return false;
  }
}

// Function to clean up node_modules
function cleanupNodeModules() {
  log("\n🧹 Cleaning up node_modules...", "bright");

  const nodeModulesPaths = [
    "node_modules",
    "client/node_modules",
    "server/node_modules",
  ];

  nodeModulesPaths.forEach((modulePath) => {
    if (fs.existsSync(modulePath)) {
      log(`📦 Found node_modules at: ${modulePath}`, "cyan");

      // Check size of node_modules
      try {
        const size = execSync(
          `du -sh ${modulePath} 2>/dev/null || echo "Unknown size"`,
          {
            encoding: "utf8",
          },
        ).trim();
        log(`📊 Size: ${size}`, "yellow");
      } catch (error) {
        // Size check failed, continue anyway
      }
    }
  });

  log("💡 Run 'npm run install-all' to reinstall clean dependencies", "cyan");
}

// Function to optimize package.json files
function optimizePackageFiles() {
  log("\n📋 Optimizing package.json files...", "bright");

  const packageFiles = [
    "package.json",
    "client/package.json",
    "server/package.json",
  ];

  packageFiles.forEach((packageFile) => {
    if (fs.existsSync(packageFile)) {
      try {
        const packageData = JSON.parse(fs.readFileSync(packageFile, "utf8"));

        // Add useful scripts if they don't exist
        if (packageFile === "package.json") {
          packageData.scripts = packageData.scripts || {};

          // Add cleanup script
          if (!packageData.scripts["cleanup"]) {
            packageData.scripts["cleanup"] = "node cleanup-system.js";
          }

          // Add health check script
          if (!packageData.scripts["health-check"]) {
            packageData.scripts["health-check"] =
              "curl -f http://localhost:3001/api/health || exit 1";
          }
        }

        // Write back the updated package.json
        fs.writeFileSync(packageFile, JSON.stringify(packageData, null, 2));
        log(`✅ Optimized: ${packageFile}`, "green");
      } catch (error) {
        log(`❌ Error optimizing ${packageFile}: ${error.message}`, "red");
      }
    }
  });
}

// Function to generate project structure report
function generateStructureReport() {
  log("\n📊 Generating project structure report...", "bright");

  const reportContent = `# TSOAM Church Management System - Project Structure

Generated on: ${new Date().toISOString()}

## 📁 Main Directories

\`\`\`
tsoam-church-management-system/
├── client/                 # Frontend React application
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts (Auth, Theme, etc.)
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── pages/             # Main application pages
│   ├── services/          # API service layer
│   └── utils/             # Helper utilities
│
├── server/                # Backend Node.js application
│   ├── config/            # Configuration files
│   ├── routes/            # API route handlers
│   ├── uploads/           # File upload storage
│   └── logs/              # Server logs
│
├── database/              # Database files
│   ├── schema.sql         # Database schema
│   ├── optimize_database.sql  # Performance optimizations
│   └── config.js          # Database configuration
│
├── docs/                  # Documentation
├── logs/                  # Application logs
├── backups/               # Database backups
├── uploads/               # File uploads
└── scripts/               # Build and utility scripts
\`\`\`

## 🔧 Configuration Files

- \`.env\` - Environment configuration
- \`package.json\` - Root dependencies and scripts
- \`client/package.json\` - Frontend dependencies
- \`server/package.json\` - Backend dependencies
- \`tsconfig.json\` - TypeScript configuration
- \`tailwind.config.ts\` - Tailwind CSS configuration
- \`vite.config.ts\` - Vite build configuration

## 📚 Documentation Files

- \`INSTALLATION_GUIDE.md\` - Complete installation instructions
- \`SYSTEM_DOCUMENTATION.md\` - Technical system documentation
- \`README.md\` - Project overview and quick start
- \`ENHANCED_FEATURES.md\` - Feature documentation

## 🚀 Setup Scripts

- \`setup-system.js\` - Complete system setup
- \`cleanup-system.js\` - System cleanup and optimization
- \`start-tsoam.sh\` - Linux/macOS startup script
- \`start-tsoam.bat\` - Windows startup script

## 📊 Key Statistics

- Total Pages: ${fs.existsSync("client/pages") ? fs.readdirSync("client/pages").length : 0}
- Total Components: ${fs.existsSync("client/components") ? fs.readdirSync("client/components", { recursive: true }).length : 0}
- Total Services: ${fs.existsSync("client/services") ? fs.readdirSync("client/services").length : 0}
- Database Tables: ~20+ (see schema.sql)

## 🔒 Security Features

- Role-based access control (Admin, HR Officer, Finance Officer, User)
- JWT authentication with session management
- Password hashing with bcrypt
- File upload restrictions and validation
- SQL injection prevention
- XSS protection

## 💡 Next Steps

1. Run setup: \`node setup-system.js\`
2. Start development: \`npm run dev\`
3. Access system: http://localhost:3001
4. Default login: admin@tsoam.org / admin123

---
*Generated by TSOAM Cleanup System v2.0.0*
`;

  fs.writeFileSync("PROJECT_STRUCTURE.md", reportContent);
  log("✅ Project structure report generated: PROJECT_STRUCTURE.md", "green");
}

// Main cleanup function
function main() {
  log("🧹 TSOAM SYSTEM CLEANUP & ORGANIZATION", "bright");
  log("=====================================", "bright");

  let totalRemoved = 0;
  let totalCreated = 0;

  // Step 1: Remove unnecessary folders
  log("\n📁 Removing unnecessary folders...", "bright");
  cleanupConfig.foldersToRemove.forEach((folder) => {
    if (safeRemove(folder, "folder")) {
      totalRemoved++;
    }
  });

  // Step 2: Remove unnecessary files
  log("\n📄 Removing unnecessary files...", "bright");
  cleanupConfig.filesToRemove.forEach((file) => {
    if (safeRemove(file, "file")) {
      totalRemoved++;
    }
  });

  // Step 3: Create necessary directories
  log("\n📁 Creating necessary directories...", "bright");
  cleanupConfig.foldersToCreate.forEach((folder) => {
    if (createDirectory(folder)) {
      totalCreated++;
    }
  });

  // Step 4: Clean up node_modules (information only)
  cleanupNodeModules();

  // Step 5: Optimize package.json files
  optimizePackageFiles();

  // Step 6: Generate structure report
  generateStructureReport();

  // Step 7: Summary
  log("\n" + "=".repeat(50), "cyan");
  log("🎉 CLEANUP COMPLETED SUCCESSFULLY!", "bright");
  log("=".repeat(50), "cyan");
  log(`📊 Removed: ${totalRemoved} items`, "green");
  log(`📁 Created: ${totalCreated} directories`, "green");
  log("📋 Generated: PROJECT_STRUCTURE.md", "green");

  log("\n💡 Recommendations:", "bright");
  log("1. Run 'npm run install-all' to ensure clean dependencies", "cyan");
  log("2. Run 'node setup-system.js' for complete system setup", "cyan");
  log("3. Check PROJECT_STRUCTURE.md for project overview", "cyan");
  log("4. Review INSTALLATION_GUIDE.md for deployment", "cyan");

  log("\n✨ Your TSOAM system is now clean and organized!", "green");
}

// Run cleanup if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  cleanupConfig,
  safeRemove,
  createDirectory,
  generateStructureReport,
};
