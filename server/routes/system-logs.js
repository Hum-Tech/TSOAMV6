const express = require("express");
const { query } = require("../config/database");

const router = express.Router();

// Get system logs with real-time updates
router.get("/", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      severity,
      module,
      user_id,
      start_date,
      end_date,
    } = req.query;

    let whereConditions = [];
    let params = [];

    if (severity) {
      whereConditions.push("severity = ?");
      params.push(severity);
    }

    if (module) {
      whereConditions.push("module = ?");
      params.push(module);
    }

    if (user_id) {
      whereConditions.push("user_id = ?");
      params.push(user_id);
    }

    if (start_date) {
      whereConditions.push("timestamp >= ?");
      params.push(start_date);
    }

    if (end_date) {
      whereConditions.push("timestamp <= ?");
      params.push(end_date);
    }

    const whereClause =
      whereConditions.length > 0
        ? "WHERE " + whereConditions.join(" AND ")
        : "";
    const offset = (page - 1) * limit;

    const logsQuery = `
      SELECT
        sl.*,
        u.name as user_name,
        u.role as user_role
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      ${whereClause}
      ORDER BY timestamp DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM system_logs sl
      ${whereClause}
    `;

    try {
      const [logsResult, countResult] = await Promise.all([
        query(logsQuery, [...params, parseInt(limit), parseInt(offset)]),
        query(countQuery, params),
      ]);

      const logs = logsResult.data || [];
      const total = countResult.data?.[0]?.total || 0;

      res.json({
        success: true,
        data: logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (dbError) {
      // Database not available - return in-memory logs as fallback
      const memoryLogs = global.latestLogUpdates || [];
      const filteredLogs = memoryLogs.slice(0, parseInt(limit));

      res.json({
        success: true,
        data: filteredLogs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: memoryLogs.length,
          pages: Math.ceil(memoryLogs.length / parseInt(limit)),
        },
        fallback: true,
        message: "Database unavailable - showing in-memory logs",
      });
    }
  } catch (error) {
    console.error("Get system logs error:", error);
    // Return empty result rather than failing
    res.json({
      success: true,
      data: [],
      pagination: {
        page: parseInt(req.query.page || 1),
        limit: parseInt(req.query.limit || 50),
        total: 0,
        pages: 0,
      },
      fallback: true,
      message: "Logs unavailable",
    });
  }
});

// Add new system log entry
router.post("/", async (req, res) => {
  try {
    const {
      user_id,
      action,
      module,
      details,
      ip_address,
      user_agent,
      severity = "Info",
    } = req.body;

    if (!action || !module) {
      return res.status(400).json({ error: "Action and module are required" });
    }

    const logEntry = {
      user_id: user_id || null,
      action,
      module,
      details: details || null,
      ip_address: ip_address || req.ip,
      user_agent: user_agent || req.get("User-Agent"),
      severity,
      timestamp: new Date(),
    };

    // Try to insert into database
    try {
      const insertQuery = `
        INSERT INTO system_logs (
          user_id, action, module, details, ip_address,
          user_agent, severity, timestamp
        ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
      `;

      const result = await query(insertQuery, [
        logEntry.user_id,
        logEntry.action,
        logEntry.module,
        logEntry.details,
        logEntry.ip_address,
        logEntry.user_agent,
        logEntry.severity,
      ]);

      if (result.success) {
        // Database insert successful
        broadcastLogUpdate(logEntry);
        return res.json({
          success: true,
          message: "Log entry created successfully",
        });
      } else {
        throw new Error("Database insert failed");
      }
    } catch (dbError) {
      // Database is not available - fall back to console logging and in-memory storage
      console.log(
        `[${logEntry.severity}] ${logEntry.module}: ${logEntry.action}`,
        {
          details: logEntry.details,
          user_id: logEntry.user_id,
          timestamp: logEntry.timestamp.toISOString(),
        },
      );

      // Store in memory for retrieval
      broadcastLogUpdate(logEntry);

      // Return success even if database failed - logging should not break the app
      return res.json({
        success: true,
        message: "Log entry stored (database unavailable)",
        fallback: true,
      });
    }
  } catch (error) {
    console.error("Create system log error:", error);

    // Even if everything fails, don't break the calling functionality
    res.json({
      success: true,
      message: "Log entry processed (fallback mode)",
      fallback: true,
    });
  }
});

// Get log statistics for dashboard
router.get("/stats", async (req, res) => {
  try {
    const statsQuery = `
      SELECT
        severity,
        COUNT(*) as count,
        DATE(timestamp) as date
      FROM system_logs
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY severity, DATE(timestamp)
      ORDER BY date DESC, severity
    `;

    const moduleStatsQuery = `
      SELECT
        module,
        COUNT(*) as count,
        MAX(timestamp) as last_activity
      FROM system_logs
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY module
      ORDER BY count DESC
    `;

    const [statsResult, moduleStatsResult] = await Promise.all([
      query(statsQuery),
      query(moduleStatsQuery),
    ]);

    res.json({
      success: true,
      severity_stats: statsResult.data || [],
      module_stats: moduleStatsResult.data || [],
    });
  } catch (error) {
    console.error("Get log stats error:", error);
    res.status(500).json({ error: "Failed to fetch log statistics" });
  }
});

// Get recent critical logs for security monitoring
router.get("/critical", async (req, res) => {
  try {
    const criticalLogsQuery = `
      SELECT
        sl.*,
        u.name as user_name,
        u.email as user_email
      FROM system_logs sl
      LEFT JOIN users u ON sl.user_id = u.id
      WHERE severity IN ('Critical', 'Error')
      AND timestamp >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      ORDER BY timestamp DESC
      LIMIT 20
    `;

    const result = await query(criticalLogsQuery);

    res.json({
      success: true,
      critical_logs: result.data || [],
    });
  } catch (error) {
    console.error("Get critical logs error:", error);
    res.status(500).json({ error: "Failed to fetch critical logs" });
  }
});

// Clear old logs (maintenance endpoint)
router.delete("/cleanup", async (req, res) => {
  try {
    const { days = 90 } = req.query;

    const cleanupQuery = `
      DELETE FROM system_logs
      WHERE timestamp < DATE_SUB(NOW(), INTERVAL ? DAY)
      AND severity NOT IN ('Critical', 'Error')
    `;

    const result = await query(cleanupQuery, [parseInt(days)]);

    res.json({
      success: true,
      message: `Cleaned up logs older than ${days} days`,
      deleted_count: result.data?.affectedRows || 0,
    });
  } catch (error) {
    console.error("Log cleanup error:", error);
    res.status(500).json({ error: "Failed to cleanup logs" });
  }
});

// Real-time log broadcasting (simplified - in production use WebSockets)
const connectedClients = new Set();

function broadcastLogUpdate(logData) {
  // In a real implementation, this would use WebSockets or Server-Sent Events
  // For now, we'll store the latest log updates in memory
  if (global.latestLogUpdates) {
    global.latestLogUpdates.push({
      ...logData,
      timestamp: new Date().toISOString(),
    });

    // Keep only the last 50 updates
    if (global.latestLogUpdates.length > 50) {
      global.latestLogUpdates = global.latestLogUpdates.slice(-50);
    }
  } else {
    global.latestLogUpdates = [logData];
  }
}

// Get latest log updates
router.get("/updates", async (req, res) => {
  try {
    const { since } = req.query;
    let updates = global.latestLogUpdates || [];

    if (since) {
      const sinceDate = new Date(since);
      updates = updates.filter((log) => new Date(log.timestamp) > sinceDate);
    }

    res.json({
      success: true,
      updates,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Get log updates error:", error);
    res.status(500).json({ error: "Failed to fetch log updates" });
  }
});

module.exports = router;
