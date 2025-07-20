const express = require("express");
const router = express.Router();
const Member = require("../models/Member");
const { authMiddleware, requireRole } = require("../middleware/auth");

// Get all members
router.get("/", authMiddleware, async (req, res) => {
  try {
    const filters = {
      is_active:
        req.query.is_active !== undefined
          ? req.query.is_active === "true"
          : undefined,
      department: req.query.department,
      search: req.query.search,
      limit: req.query.limit,
    };

    const result = await Member.findAll(filters);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        total: result.data.length,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Get members error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch members",
    });
  }
});

// Get member by ID
router.get("/:id", authMiddleware, async (req, res) => {
  try {
    const result = await Member.findById(req.params.id);

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(404).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Get member error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch member",
    });
  }
});

// Create new member
router.post(
  "/",
  authMiddleware,
  requireRole(["Admin", "HR Officer"]),
  async (req, res) => {
    try {
      const memberData = {
        ...req.body,
        member_id: await Member.generateMemberId(),
        tithe_number: await Member.generateTitheNumber(),
        membership_date:
          req.body.membership_date || new Date().toISOString().split("T")[0],
      };

      const result = await Member.create(memberData);

      if (result.success) {
        res.status(201).json({
          success: true,
          data: result.data,
          message: "Member created successfully",
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Create member error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create member",
      });
    }
  },
);

// Update member
router.put(
  "/:id",
  authMiddleware,
  requireRole(["Admin", "HR Officer"]),
  async (req, res) => {
    try {
      const result = await Member.update(req.params.id, req.body);

      if (result.success) {
        res.json({
          success: true,
          data: result.data,
          message: "Member updated successfully",
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Update member error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update member",
      });
    }
  },
);

// Delete member (soft delete)
router.delete(
  "/:id",
  authMiddleware,
  requireRole(["Admin"]),
  async (req, res) => {
    try {
      const result = await Member.delete(req.params.id);

      if (result.success) {
        res.json({
          success: true,
          message: "Member deleted successfully",
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
        });
      }
    } catch (error) {
      console.error("Delete member error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete member",
      });
    }
  },
);

// Get member statistics
router.get("/stats/overview", authMiddleware, async (req, res) => {
  try {
    const result = await Member.getStats();

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Get member stats error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch member statistics",
    });
  }
});

// Search members
router.get("/search/:query", authMiddleware, async (req, res) => {
  try {
    const result = await Member.findAll({
      search: req.params.query,
      limit: 50,
    });

    if (result.success) {
      res.json({
        success: true,
        data: result.data,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Search members error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to search members",
    });
  }
});

// Generate new member ID
router.get(
  "/generate/member-id",
  authMiddleware,
  requireRole(["Admin", "HR Officer"]),
  async (req, res) => {
    try {
      const memberId = await Member.generateMemberId();
      const titheNumber = await Member.generateTitheNumber();

      res.json({
        success: true,
        data: {
          member_id: memberId,
          tithe_number: titheNumber,
        },
      });
    } catch (error) {
      console.error("Generate member ID error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to generate member ID",
      });
    }
  },
);

module.exports = router;
