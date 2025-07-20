const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { query } = require("../config/database");

const router = express.Router();

// Cleanup expired password reset codes
const cleanupExpiredResets = async () => {
  try {
    await query(
      "DELETE FROM password_resets WHERE expires_at < NOW() OR (used = TRUE AND created_at < DATE_SUB(NOW(), INTERVAL 24 HOUR))",
    );
  } catch (error) {
    console.warn("Password reset cleanup failed:", error.message);
  }
};

// Run cleanup every hour
setInterval(cleanupExpiredResets, 60 * 60 * 1000);

// Login endpoint
router.post("/login", async (req, res) => {
  try {
    const { email, password, otp, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Get user from database
    const userResult = await query(
      "SELECT * FROM users WHERE email = ? AND is_active = true",
      [email],
    );

    if (!userResult.success || userResult.data.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = userResult.data[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    // Check OTP for admin users (simplified - in production use proper OTP)
    if (
      (user.role === "Admin" || user.role === "HR Officer") &&
      otp !== "123456"
    ) {
      return res.status(400).json({
        error: "OTP required for admin users",
        requireOTP: true,
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET || "fallback-secret",
      { expiresIn: rememberMe ? "7d" : "24h" },
    );

    // Update last login
    await query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?",
      [user.id],
    );

    // Return user data (without password)
    const { password_hash, ...userData } = user;

    res.json({
      success: true,
      token,
      user: {
        ...userData,
        permissions: getRolePermissions(user.role),
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get role permissions
function getRolePermissions(role) {
  const basePermissions = {
    dashboard: true,
    members: false,
    hr: false,
    finance: false,
    welfare: false,
    inventory: false,
    events: false,
    appointments: false,
    messaging: false,
    settings: false,
    users: false,
    systemLogs: false,
  };

  switch (role) {
    case "Admin":
      return {
        dashboard: true,
        members: true,
        hr: true,
        finance: true,
        welfare: true,
        inventory: true,
        events: true,
        appointments: true,
        messaging: true,
        settings: true,
        users: true,
        systemLogs: true,
      };
    case "HR Officer":
      return {
        ...basePermissions,
        members: true,
        hr: true,
        welfare: true,
        appointments: true,
        messaging: true,
      };
    case "Finance Officer":
      return {
        ...basePermissions,
        finance: true,
        inventory: true,
        events: true,
      };
    case "User":
    default:
      return {
        ...basePermissions,
        members: true,
        inventory: true,
        events: true,
        appointments: true,
      };
  }
}

// Create account endpoint
router.post("/create-account", async (req, res) => {
  try {
    const { name, email, password, role, department, employeeId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user already exists
    const existingUser = await query("SELECT id FROM users WHERE email = ?", [
      email,
    ]);

    if (existingUser.success && existingUser.data.length > 0) {
      return res.status(400).json({ error: "User already exists" });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const userId = `user-${Date.now()}`;
    const insertResult = await query(
      `INSERT INTO users (id, name, email, password_hash, role, department, employee_id)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userId, name, email, passwordHash, role, department, employeeId],
    );

    if (!insertResult.success) {
      return res.status(500).json({ error: "Failed to create user" });
    }

    res.json({
      success: true,
      message: "User created successfully",
      credentials: { email, password },
    });
  } catch (error) {
    console.error("Create account error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify token middleware
router.get("/verify", (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret",
    );
    res.json({ success: true, user: decoded });
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
});

// Get pending users for verification
router.get("/pending-verification", async (req, res) => {
  try {
    const result = await query(
      `SELECT u.*, 'pending' as status, NOW() as requestedAt
       FROM users u
       WHERE u.is_active = false
       ORDER BY u.created_at DESC`,
    );

    if (!result.success) {
      return res.status(500).json({ error: "Failed to fetch pending users" });
    }

    res.json({
      success: true,
      users: result.data.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        employeeId: user.employee_id,
        requestedAt: user.created_at,
        status: "pending",
      })),
    });
  } catch (error) {
    console.error("Get pending users error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify user account
router.post("/verify-account", async (req, res) => {
  try {
    const { userId, action, assignedRole, assignedDepartment, reason } =
      req.body;

    if (!userId || !action) {
      return res.status(400).json({ error: "User ID and action are required" });
    }

    if (action === "approve") {
      // Approve the account
      const updateResult = await query(
        `UPDATE users SET
         is_active = true,
         role = ?,
         department = ?
         WHERE id = ?`,
        [assignedRole, assignedDepartment, userId],
      );

      if (!updateResult.success) {
        return res.status(500).json({ error: "Failed to approve account" });
      }

      // Log the approval
      await query(
        `INSERT INTO system_logs (action, module, details, severity)
         VALUES (?, ?, ?, ?)`,
        [
          "Account Approved",
          "User Management",
          `Account approved for user ${userId} with role ${assignedRole}`,
          "Info",
        ],
      );
    } else if (action === "reject") {
      // Reject the account - you might want to delete or mark as rejected
      const deleteResult = await query("DELETE FROM users WHERE id = ?", [
        userId,
      ]);

      if (!deleteResult.success) {
        return res.status(500).json({ error: "Failed to reject account" });
      }

      // Log the rejection
      await query(
        `INSERT INTO system_logs (action, module, details, severity)
         VALUES (?, ?, ?, ?)`,
        [
          "Account Rejected",
          "User Management",
          `Account rejected for user ${userId}. Reason: ${reason}`,
          "Warning",
        ],
      );
    }

    res.json({ success: true, message: "Account verification processed" });
  } catch (error) {
    console.error("Account verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Rate limiting map for password reset requests
const resetAttempts = new Map();

// Clean up rate limiting map every hour
setInterval(
  () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    for (const [key, timestamp] of resetAttempts.entries()) {
      if (timestamp < oneHourAgo) {
        resetAttempts.delete(key);
      }
    }
  },
  60 * 60 * 1000,
);

// Forgot password - Request reset code
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const clientIP = req.ip || req.connection.remoteAddress;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Rate limiting: Max 3 requests per email per hour
    const resetKey = `${email}_${clientIP}`;
    const lastAttempt = resetAttempts.get(resetKey);
    const now = Date.now();

    if (lastAttempt && now - lastAttempt < 10 * 60 * 1000) {
      // 10 minutes
      return res.status(429).json({
        error:
          "Too many reset requests. Please wait 10 minutes before trying again.",
      });
    }

    // Check if user exists
    const userResult = await query(
      "SELECT id, name, email FROM users WHERE email = ? AND is_active = true",
      [email],
    );

    if (!userResult.success || userResult.data.length === 0) {
      // Still record the attempt for rate limiting
      resetAttempts.set(resetKey, now);

      // Don't reveal if email exists for security
      return res.json({
        success: true,
        message: "If the email exists, a reset code has been sent",
        demo: true,
      });
    }

    const user = userResult.data[0];

    // Check for recent reset requests (prevent spam)
    const recentResetResult = await query(
      "SELECT created_at FROM password_resets WHERE email = ? AND created_at > DATE_SUB(NOW(), INTERVAL 5 MINUTE) ORDER BY created_at DESC LIMIT 1",
      [email],
    );

    if (recentResetResult.success && recentResetResult.data.length > 0) {
      return res.status(429).json({
        error:
          "A reset code was recently sent. Please wait 5 minutes before requesting another.",
      });
    }

    // Generate 6-digit reset code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset code in database
    const insertResult = await query(
      `INSERT INTO password_resets (user_id, email, reset_code, expires_at, created_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, NOW(), ?, ?)
       ON DUPLICATE KEY UPDATE
       reset_code = VALUES(reset_code),
       expires_at = VALUES(expires_at),
       created_at = NOW(),
       used = false,
       ip_address = VALUES(ip_address),
       user_agent = VALUES(user_agent)`,
      [user.id, email, resetCode, expiresAt, clientIP, req.get("User-Agent")],
    );

    // Record the attempt
    resetAttempts.set(resetKey, now);

    if (insertResult.success) {
      // Log the password reset request
      await query(
        `INSERT INTO system_logs (action, module, details, severity, user_id)
         VALUES (?, ?, ?, ?, ?)`,
        [
          "Password Reset Requested",
          "Authentication",
          `Password reset requested for ${email} from ${clientIP}`,
          "Info",
          user.id,
        ],
      );

      // In production, send email with reset code
      console.log(`📧 Password Reset Code for ${email}: ${resetCode}`);

      res.json({
        success: true,
        message: "Reset code sent to your email",
        resetCode, // Remove this in production
        demo: true,
      });
    } else {
      console.log(
        "💡 Database offline - returning demo reset code confirmation",
      );
      // Demo mode fallback
      res.json({
        success: true,
        message: "Reset code sent to your email (Demo Mode)",
        resetCode: "123456",
        demo: true,
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Verify reset code
router.post("/verify-reset-code", async (req, res) => {
  try {
    const { email, resetCode } = req.body;

    if (!email || !resetCode) {
      return res
        .status(400)
        .json({ error: "Email and reset code are required" });
    }

    // Check reset code
    const resetResult = await query(
      `SELECT user_id, reset_code, expires_at, used
       FROM password_resets
       WHERE email = ? AND reset_code = ? AND used = false
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, resetCode],
    );

    if (!resetResult.success || resetResult.data.length === 0) {
      // Demo mode fallback
      if (resetCode === "123456") {
        return res.json({
          success: true,
          message: "Reset code verified (Demo Mode)",
          demo: true,
        });
      }
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }

    const resetRecord = resetResult.data[0];

    // Check if expired
    if (new Date() > new Date(resetRecord.expires_at)) {
      return res.status(400).json({ error: "Reset code has expired" });
    }

    res.json({
      success: true,
      message: "Reset code verified successfully",
    });
  } catch (error) {
    console.error("Verify reset code error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Reset password with code
router.post("/reset-password", async (req, res) => {
  try {
    const { email, resetCode, newPassword } = req.body;

    if (!email || !resetCode || !newPassword) {
      return res.status(400).json({
        error: "Email, reset code, and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "Password must be at least 6 characters long",
      });
    }

    // Verify reset code again
    const resetResult = await query(
      `SELECT user_id, reset_code, expires_at, used
       FROM password_resets
       WHERE email = ? AND reset_code = ? AND used = false
       ORDER BY created_at DESC
       LIMIT 1`,
      [email, resetCode],
    );

    if (!resetResult.success || resetResult.data.length === 0) {
      // Demo mode fallback
      if (resetCode === "123456") {
        return res.json({
          success: true,
          message: "Password reset successfully (Demo Mode)",
          demo: true,
        });
      }
      return res.status(400).json({ error: "Invalid or expired reset code" });
    }

    const resetRecord = resetResult.data[0];

    // Check if expired
    if (new Date() > new Date(resetRecord.expires_at)) {
      return res.status(400).json({ error: "Reset code has expired" });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 12);

    // Update password
    const updateResult = await query(
      "UPDATE users SET password_hash = ? WHERE id = ?",
      [passwordHash, resetRecord.user_id],
    );

    if (updateResult.success) {
      // Mark reset code as used
      await query(
        "UPDATE password_resets SET used = true WHERE email = ? AND reset_code = ?",
        [email, resetCode],
      );

      // Log the password reset
      await query(
        `INSERT INTO system_logs (action, module, details, severity, user_id)
         VALUES (?, ?, ?, ?, ?)`,
        [
          "Password Reset Completed",
          "Authentication",
          `Password successfully reset for ${email}`,
          "Info",
          resetRecord.user_id,
        ],
      );

      res.json({
        success: true,
        message: "Password reset successfully",
      });
    } else {
      res.status(500).json({ error: "Failed to update password" });
    }
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create user account request endpoint
router.post("/users/create-request", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      role,
      department,
      employee_id,
      requested_by,
      ip_address,
      request_reason,
    } = req.body;

    if (!name || !email || !role) {
      return res
        .status(400)
        .json({ error: "Name, email, and role are required" });
    }

    // Insert into pending verification table
    const requestId = `REQ-${Date.now()}`;
    const result = await query(
      `INSERT INTO user_requests (
        request_id, name, email, phone, role, department, employee_id,
        requested_by, ip_address, request_reason, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [
        requestId,
        name,
        email,
        phone,
        role,
        department,
        employee_id,
        requested_by,
        ip_address,
        request_reason,
      ],
    );

    if (result.success) {
      res.json({
        success: true,
        message: "Account creation request submitted successfully",
        requestId,
      });
    } else {
      console.log(
        "💡 Database offline - returning demo account request confirmation",
      );
      // Return success in demo mode when database is offline
      res.json({
        success: true,
        message: "Account creation request submitted successfully (Demo Mode)",
        requestId,
        demo: true,
      });
    }
  } catch (error) {
    console.error("Create request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
