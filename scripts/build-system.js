#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

console.log("🏢 TSOAM Church Management System");
console.log("🔨 Building complete system...");
console.log("==================================================");

const rootDir = path.join(__dirname, "..");
const clientDir = path.join(rootDir, "client");
const serverDir = path.join(rootDir, "server");

// Helper function to run commands safely
function runCommand(command, workingDir = rootDir, description = "") {
  try {
    if (description) {
      console.log(`🔄 ${description}...`);
    }

    process.chdir(workingDir);
    execSync(command, { stdio: "inherit" });

    if (description) {
      console.log(`✅ ${description} completed`);
    }
  } catch (error) {
    console.error(`❌ ${description || "Command"} failed:`, error.message);
    process.exit(1);
  }
}

// Step 1: Install server dependencies
runCommand("npm install", rootDir, "Installing server dependencies");

// Step 2: Install client dependencies
runCommand("npm install", clientDir, "Installing client dependencies");

// Step 3: Fix any dependency issues
console.log("🔧 Fixing dependency resolution issues...");
try {
  process.chdir(clientDir);

  // Remove problematic dependencies and reinstall
  if (fs.existsSync(path.join(clientDir, "node_modules"))) {
    console.log("   • Cleaning node_modules...");
    fs.rmSync(path.join(clientDir, "node_modules"), {
      recursive: true,
      force: true,
    });
  }

  if (fs.existsSync(path.join(clientDir, "package-lock.json"))) {
    console.log("   • Cleaning package-lock.json...");
    fs.unlinkSync(path.join(clientDir, "package-lock.json"));
  }

  console.log("   • Reinstalling dependencies...");
  execSync("npm install", { stdio: "inherit" });

  console.log("✅ Dependencies fixed");
} catch (error) {
  console.error("❌ Failed to fix dependencies:", error.message);
  process.exit(1);
}

// Step 4: Build client application
runCommand("npm run build-only", clientDir, "Building client application");

console.log("==================================================");
console.log("🎉 System build completed successfully!");
console.log("");
console.log("📁 Build output: client/dist");
console.log("🚀 Ready for deployment");
console.log("==================================================");
