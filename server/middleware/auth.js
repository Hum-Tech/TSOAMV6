const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to verify JWT token
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user from database
    const userResult = await User.findById(decoded.id);

    if (!userResult.success) {
      return res.status(401).json({
        success: false,
        error: "Invalid token. User not found.",
      });
    }

    if (!userResult.data.is_active) {
      return res.status(401).json({
        success: false,
        error: "Account is deactivated.",
      });
    }

    req.user = userResult.data;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: "Token has expired.",
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: "Invalid token.",
      });
    }

    console.error("Auth middleware error:", error);
    res.status(500).json({
      success: false,
      error: "Authentication failed.",
    });
  }
};

// Middleware to check user roles
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Authentication required.",
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions.",
      });
    }

    next();
  };
};

// Middleware to check if user is admin
const requireAdmin = (req, res, next) => {
  return requireRole(["Admin"])(req, res, next);
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userResult = await User.findById(decoded.id);

      if (userResult.success && userResult.data.is_active) {
        req.user = userResult.data;
      }
    }

    next();
  } catch (error) {
    // Ignore token errors for optional auth
    next();
  }
};

// Rate limiting middleware
const rateLimit = (max, windowMs) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();

    if (!attempts.has(key)) {
      attempts.set(key, []);
    }

    const userAttempts = attempts.get(key);

    // Remove old attempts outside the window
    const validAttempts = userAttempts.filter((time) => now - time < windowMs);
    attempts.set(key, validAttempts);

    if (validAttempts.length >= max) {
      return res.status(429).json({
        success: false,
        error: "Too many requests. Please try again later.",
      });
    }

    validAttempts.push(now);
    next();
  };
};

module.exports = {
  authMiddleware,
  requireRole,
  requireAdmin,
  optionalAuth,
  rateLimit,
};
