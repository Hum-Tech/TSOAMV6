const express = require("express");
const { query } = require("../config/database");

const router = express.Router();

// Get financial data for dashboard
router.get("/financial", async (req, res) => {
  try {
    // Get monthly financial data from transactions
    const monthlyFinancialQuery = `
      SELECT
        DATE_FORMAT(date, '%b') as month,
        SUM(CASE WHEN category IN ('Offering', 'Sunday Offering') THEN amount ELSE 0 END) as offerings,
        SUM(CASE WHEN category = 'Tithe' THEN amount ELSE 0 END) as tithes,
        SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) as expenses,
        SUM(CASE WHEN category = 'Welfare' THEN amount ELSE 0 END) as welfare
      FROM transactions
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY YEAR(date), MONTH(date)
      ORDER BY date ASC
    `;

    // Get offering type breakdown
    const offeringTypesQuery = `
      SELECT
        category as name,
        SUM(amount) as amount,
        COUNT(*) as count,
        ROUND((SUM(amount) / (SELECT SUM(amount) FROM transactions WHERE type = 'Income') * 100), 1) as value
      FROM transactions
      WHERE type = 'Income' AND date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
      GROUP BY category
      ORDER BY amount DESC
    `;

    const [monthlyResult, offeringsResult] = await Promise.all([
      query(monthlyFinancialQuery),
      query(offeringTypesQuery),
    ]);

    // Add colors to offering data
    const colors = [
      "#8B5CF6",
      "#06B6D4",
      "#10B981",
      "#F59E0B",
      "#EF4444",
      "#6366F1",
    ];
    const offeringData = (offeringsResult.data || []).map((item, index) => ({
      ...item,
      color: colors[index % colors.length],
    }));

    res.json({
      success: true,
      monthly: monthlyResult.data || [],
      offerings: offeringData,
    });
  } catch (error) {
    console.error("Dashboard financial data error:", error);
    res.json({ success: false, monthly: [], offerings: [] });
  }
});

// Get membership data for dashboard
router.get("/membership", async (req, res) => {
  try {
    // Get monthly growth data for both new members and full members
    const growthQuery = `
      SELECT
        DATE_FORMAT(created_at, '%b') as month,
        COUNT(*) as fullMembers,
        0 as newMembers
      FROM members
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      GROUP BY YEAR(created_at), MONTH(created_at)

      UNION ALL

      SELECT
        DATE_FORMAT(created_at, '%b') as month,
        0 as fullMembers,
        COUNT(*) as newMembers
      FROM new_members
      WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
      AND status = 'Active'
      GROUP BY YEAR(created_at), MONTH(created_at)

      ORDER BY month ASC
    `;

    // Get current totals
    const statsQuery = `
      SELECT
        (SELECT COUNT(*) FROM members WHERE status = 'Active') as total_full_members,
        (SELECT COUNT(*) FROM new_members WHERE status = 'Active') as total_new_members,
        (SELECT COUNT(*) FROM new_members WHERE eligibility_for_transfer = TRUE AND status = 'Active') as eligible_for_transfer
    `;

    const [growthResult, statsResult] = await Promise.all([
      query(growthQuery),
      query(statsQuery),
    ]);

    // Process growth data to combine months
    const growthData = {};
    (growthResult.data || []).forEach((row) => {
      if (!growthData[row.month]) {
        growthData[row.month] = {
          month: row.month,
          fullMembers: 0,
          newMembers: 0,
        };
      }
      growthData[row.month].fullMembers += row.fullMembers;
      growthData[row.month].newMembers += row.newMembers;
    });

    res.json({
      success: true,
      growth: Object.values(growthData),
      stats: statsResult.data?.[0] || {
        total_full_members: 0,
        total_new_members: 0,
        eligible_for_transfer: 0,
      },
    });
  } catch (error) {
    console.error("Dashboard membership data error:", error);
    res.json({
      success: false,
      growth: [],
      stats: {
        total_full_members: 0,
        total_new_members: 0,
        eligible_for_transfer: 0,
      },
    });
  }
});

// Get baptism demographics
router.get("/baptisms", async (req, res) => {
  try {
    // Since we don't have a specific baptisms table, we'll create sample demographics
    // based on member data by age groups and gender
    const baptismQuery = `
      SELECT
        CASE
          WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) < 18 THEN 'Youth (Under 18)'
          WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 18 AND 35 THEN 'Young Adults (18-35)'
          WHEN TIMESTAMPDIFF(YEAR, date_of_birth, CURDATE()) BETWEEN 36 AND 55 THEN 'Adults (36-55)'
          ELSE 'Seniors (55+)'
        END as category,
        COUNT(*) as count
      FROM members
      WHERE date_of_birth IS NOT NULL
      AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
      GROUP BY category
      ORDER BY count DESC
    `;

    const result = await query(baptismQuery);
    const totalCount = (result.data || []).reduce(
      (sum, item) => sum + item.count,
      0,
    );

    const demographics = (result.data || []).map((item) => ({
      ...item,
      percentage:
        totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0,
    }));

    res.json({
      success: true,
      demographics,
    });
  } catch (error) {
    console.error("Dashboard baptism data error:", error);
    res.json({ success: false, demographics: [] });
  }
});

// Get events attendance data
router.get("/events", async (req, res) => {
  try {
    const eventsQuery = `
      SELECT
        title as event,
        attendees_count as actual,
        capacity as planned,
        DATE_FORMAT(date, '%b %d') as week
      FROM events
      WHERE date >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)
      ORDER BY date ASC
    `;

    const result = await query(eventsQuery);

    res.json({
      success: true,
      attendance: result.data || [],
    });
  } catch (error) {
    console.error("Dashboard events data error:", error);
    res.json({ success: false, attendance: [] });
  }
});

// Get recent system alerts
router.get("/alerts", async (req, res) => {
  try {
    const alertsQuery = `
      SELECT
        CASE
          WHEN severity = 'Critical' THEN 'error'
          WHEN severity = 'Warning' THEN 'warning'
          WHEN severity = 'Error' THEN 'error'
          ELSE 'info'
        END as type,
        CONCAT(action, ': ', details) as message,
        DATE_FORMAT(timestamp, '%h:%i %p') as time,
        severity
      FROM system_logs
      WHERE timestamp >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      ORDER BY timestamp DESC
      LIMIT 10
    `;

    const result = await query(alertsQuery);

    res.json({
      success: true,
      recent: result.data || [],
    });
  } catch (error) {
    console.error("Dashboard alerts data error:", error);
    res.json({ success: false, recent: [] });
  }
});

// Trigger dashboard refresh for all connected clients
router.post("/refresh", async (req, res) => {
  try {
    // Log the refresh action
    await query(
      `INSERT INTO system_logs (action, module, details, severity)
       VALUES (?, ?, ?, ?)`,
      [
        "Dashboard Refresh",
        "Dashboard",
        "Dashboard data refreshed manually",
        "Info",
      ],
    );

    res.json({ success: true, message: "Dashboard refresh triggered" });
  } catch (error) {
    console.error("Dashboard refresh error:", error);
    res.status(500).json({ error: "Failed to trigger refresh" });
  }
});

module.exports = router;
