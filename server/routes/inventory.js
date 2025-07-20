const express = require("express");
const { query } = require("../config/database");
const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM inventory_items ORDER BY created_at DESC",
    );
    res.json({ success: true, data: result.data || [] });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
