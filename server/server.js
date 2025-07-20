const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
require("dotenv").config();

const { testConnection, initializeDatabase } = require("./config/database");

// Import route modules
const authRoutes = require("./routes/auth");
const membersRoutes = require("./routes/members");
const hrRoutes = require("./routes/hr");
const financeRoutes = require("./routes/finance");
const welfareRoutes = require("./routes/welfare");
const inventoryRoutes = require("./routes/inventory");
const eventsRoutes = require("./routes/events");
const appointmentsRoutes = require("./routes/appointments");
const documentsRoutes = require("./routes/documents");
const dashboardRoutes = require("./routes/dashboard");
const systemLogsRoutes = require("./routes/system-logs");

const app = express();
const PORT = process.env.PORT || 3002;

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(uploadsDir, req.body.category || "general");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname),
    );
  },
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images, PDFs, and Office documents are allowed!"));
    }
  },
});

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  }),
);

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.static(path.join(__dirname, "../client/dist")));
app.use("/uploads", express.static(uploadsDir));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/members", membersRoutes);
app.use("/api/hr", hrRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/welfare", welfareRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/system-logs", systemLogsRoutes);
app.use("/api/users", authRoutes);

// File upload endpoint
app.post("/api/upload", upload.array("files", 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }

    const uploadedFiles = req.files.map((file) => ({
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      size: file.size,
      mimetype: file.mimetype,
    }));

    res.json({
      success: true,
      message: "Files uploaded successfully",
      files: uploadedFiles,
    });
  } catch (error) {
    console.error("File upload error:", error);
    res.status(500).json({ error: "File upload failed" });
  }
});

// Health check endpoint
app.get("/api/health", async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    database: dbStatus ? "Connected" : "Disconnected",
    server: "Running",
  });
});

// Serve React app for all non-API routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist/index.html"));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Server error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  });
});

// Start server
async function startServer() {
  try {
    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.log("⚠️  Server starting without database connection");
      console.log("📋 Please check database configuration in .env file");
    }

    // Initialize database
    if (dbConnected) {
      await initializeDatabase();

      // Setup database tables and default data
      try {
        const setupDatabase = require("./database/setup");
        await setupDatabase();
        console.log("✅ Database setup completed");
      } catch (error) {
        console.log("📋 Database setup not needed or already complete");
      }
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log("🚀 TSOAM Church Management System Server Started");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━��━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log(`🌐 Server running on: http://localhost:${PORT}`);
      console.log(`🔗 LAN Access: http://[YOUR-IP]:${PORT}`);
      console.log(`📁 Upload directory: ${uploadsDir}`);
      console.log(
        `🗄️  Database: ${dbConnected ? "Connected" : "Disconnected"}`,
      );
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🔧 To access from other computers on LAN:");
      console.log("   1. Find your computer's IP address");
      console.log(`   2. Open http://[YOUR-IP]:${PORT} on other devices`);
      console.log(`   3. Ensure firewall allows port ${PORT}`);
      console.log("━���━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━���━━━━━━━━");
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("🔄 Received SIGTERM, shutting down gracefully");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("🔄 Received SIGINT, shutting down gracefully");
  process.exit(0);
});

startServer();
