#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🚀 TSOAM Church Management System - Build Optimization");
console.log("═══════════════════════════════════════════════════════════");

// Configuration
const config = {
  clientDir: path.join(__dirname, "../client"),
  serverDir: path.join(__dirname, "../server"),
  buildDir: path.join(__dirname, "../client/dist"),
  outputDir: path.join(__dirname, "../production-build"),
};

// Create output directory
if (!fs.existsSync(config.outputDir)) {
  fs.mkdirSync(config.outputDir, { recursive: true });
}

// Step 1: Clean previous builds
console.log("🧹 Cleaning previous builds...");
try {
  if (fs.existsSync(config.buildDir)) {
    fs.rmSync(config.buildDir, { recursive: true, force: true });
  }
  if (fs.existsSync(config.outputDir)) {
    fs.rmSync(config.outputDir, { recursive: true, force: true });
    fs.mkdirSync(config.outputDir, { recursive: true });
  }
  console.log("✅ Previous builds cleaned");
} catch (error) {
  console.error("❌ Failed to clean builds:", error.message);
  process.exit(1);
}

// Step 2: Install and optimize dependencies
console.log("📦 Installing and optimizing dependencies...");
try {
  // Client dependencies
  process.chdir(config.clientDir);
  execSync("npm ci --production", { stdio: "inherit" });

  // Server dependencies
  process.chdir(config.serverDir);
  execSync("npm ci --production", { stdio: "inherit" });

  console.log("✅ Dependencies optimized");
} catch (error) {
  console.error("❌ Failed to install dependencies:", error.message);
  process.exit(1);
}

// Step 3: Build client application
console.log("🔨 Building client application...");
try {
  process.chdir(config.clientDir);
  execSync("npm run build", { stdio: "inherit" });
  console.log("✅ Client built successfully");
} catch (error) {
  console.error("❌ Failed to build client:", error.message);
  process.exit(1);
}

// Step 4: Copy files to production build
console.log("📁 Copying files to production build...");
try {
  // Copy server files
  const serverFiles = ["server.js", "package.json", "config", "routes"];

  fs.mkdirSync(path.join(config.outputDir, "server"), { recursive: true });

  serverFiles.forEach((file) => {
    const srcPath = path.join(config.serverDir, file);
    const destPath = path.join(config.outputDir, "server", file);

    if (fs.existsSync(srcPath)) {
      if (fs.statSync(srcPath).isDirectory()) {
        fs.cpSync(srcPath, destPath, { recursive: true });
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  });

  // Copy client build
  if (fs.existsSync(config.buildDir)) {
    fs.cpSync(config.buildDir, path.join(config.outputDir, "client/dist"), {
      recursive: true,
    });
  }

  // Copy database files
  const dbDir = path.join(__dirname, "../database");
  if (fs.existsSync(dbDir)) {
    fs.cpSync(dbDir, path.join(config.outputDir, "database"), {
      recursive: true,
    });
  }

  // Copy environment template
  const envTemplate = path.join(__dirname, "../.env.example");
  if (fs.existsSync(envTemplate)) {
    fs.copyFileSync(envTemplate, path.join(config.outputDir, ".env.example"));
  }

  // Copy setup scripts
  const setupFiles = ["setup.js", "README.md", "package.json"];
  setupFiles.forEach((file) => {
    const srcPath = path.join(__dirname, "..", file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(config.outputDir, file));
    }
  });

  // Copy startup scripts
  const startupFiles = ["start-tsoam.bat", "start-tsoam.sh"];
  startupFiles.forEach((file) => {
    const srcPath = path.join(__dirname, "..", file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(config.outputDir, file));
    }
  });

  console.log("✅ Files copied successfully");
} catch (error) {
  console.error("❌ Failed to copy files:", error.message);
  process.exit(1);
}

// Step 5: Create optimized package.json for production
console.log("⚙️ Creating optimized configuration...");
try {
  const originalPackageJson = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../package.json"), "utf8"),
  );

  const optimizedPackageJson = {
    ...originalPackageJson,
    scripts: {
      start: "cd server && npm start",
      setup: "node setup.js",
      "install-deps": "cd server && npm install",
      "create-db": originalPackageJson.scripts["create-db"],
      "import-schema": originalPackageJson.scripts["import-schema"],
      "backup-db": originalPackageJson.scripts["backup-db"],
    },
    devDependencies: {}, // Remove dev dependencies for production
  };

  fs.writeFileSync(
    path.join(config.outputDir, "package.json"),
    JSON.stringify(optimizedPackageJson, null, 2),
  );

  console.log("✅ Configuration optimized");
} catch (error) {
  console.error("❌ Failed to optimize configuration:", error.message);
  process.exit(1);
}

// Step 6: Create deployment instructions
console.log("📝 Creating deployment instructions...");
try {
  const deploymentInstructions = `# TSOAM Church Management System - Production Deployment

## Quick Start

1. **Extract Files**
   - Extract this folder to your desired location
   - Ensure you have Node.js 16+ and MySQL 8+ installed

2. **Setup Database**
   \`\`\`bash
   # Create database
   mysql -u root -p -e "CREATE DATABASE tsoam_church_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
   
   # Import schema
   mysql -u root -p tsoam_church_db < database/schema.sql
   \`\`\`

3. **Configure Environment**
   \`\`\`bash
   # Copy environment template
   cp .env.example .env
   
   # Edit with your settings
   nano .env
   \`\`\`

4. **Install Dependencies**
   \`\`\`bash
   npm run install-deps
   \`\`\`

5. **Start System**
   \`\`\`bash
   npm start
   \`\`\`

## Access
- **Local**: http://localhost:3001
- **Network**: http://[YOUR-IP]:3001

## Default Login
- **Email**: admin@tsoam.org
- **Password**: admin123

⚠️ **IMPORTANT**: Change the default password after first login!

## Production Features
- ✅ Optimized build with minimal dependencies
- ✅ Real-time dashboard updates
- ✅ Comprehensive system logging
- ✅ Role-based access control
- ✅ File upload functionality
- ✅ Database-driven data with zero demo interference
- ✅ LAN support for multi-computer access
- ✅ Professional PDF exports with church branding

## Support
For technical support, contact: admin@tsoam.org
`;

  fs.writeFileSync(
    path.join(config.outputDir, "DEPLOYMENT.md"),
    deploymentInstructions,
  );

  console.log("✅ Deployment instructions created");
} catch (error) {
  console.error("❌ Failed to create deployment instructions:", error.message);
  process.exit(1);
}

// Step 7: Final optimizations
console.log("🎯 Applying final optimizations...");
try {
  // Create uploads directories
  const uploadsDir = path.join(config.outputDir, "server/uploads");
  ["finance", "inventory", "welfare", "general"].forEach((dir) => {
    fs.mkdirSync(path.join(uploadsDir, dir), { recursive: true });
  });

  // Create logs directory
  fs.mkdirSync(path.join(config.outputDir, "logs"), { recursive: true });

  // Create backups directory
  fs.mkdirSync(path.join(config.outputDir, "backups"), { recursive: true });

  // Make startup scripts executable (Unix systems)
  try {
    execSync(`chmod +x "${path.join(config.outputDir, "start-tsoam.sh")}"`);
  } catch (e) {
    // Ignore on Windows
  }

  console.log("✅ Final optimizations applied");
} catch (error) {
  console.error("❌ Failed to apply optimizations:", error.message);
  process.exit(1);
}

// Build summary
console.log("═══════════════════════════════════════════════════════════");
console.log("🎉 Build completed successfully!");
console.log("");
console.log("📁 Production build location:", config.outputDir);
console.log("📊 Build statistics:");

try {
  const getDirectorySize = (dirPath) => {
    let totalSize = 0;
    const items = fs.readdirSync(dirPath);

    items.forEach((item) => {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);

      if (stats.isDirectory()) {
        totalSize += getDirectorySize(itemPath);
      } else {
        totalSize += stats.size;
      }
    });

    return totalSize;
  };

  const buildSize = getDirectorySize(config.outputDir);
  console.log(`   • Total size: ${(buildSize / 1024 / 1024).toFixed(2)} MB`);

  const fileCount = execSync(`find "${config.outputDir}" -type f | wc -l`, {
    encoding: "utf8",
  }).trim();
  console.log(`   • Files: ${fileCount}`);
} catch (error) {
  // Skip stats on Windows or if find command not available
}

console.log("");
console.log("📋 Next steps:");
console.log("   1. Copy the production-build folder to your server");
console.log("   2. Follow the instructions in DEPLOYMENT.md");
console.log("   3. Configure your database and environment");
console.log("   4. Start the system with 'npm start'");
console.log("");
console.log("═══════════���═══════════════════════════════════════════════");
