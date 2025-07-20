const express = require("express");
const { query } = require("../config/database");
const router = express.Router();

router.post("/upload", async (req, res) => {
  try {
    const { entity_type, entity_id, document_category, files } = req.body;

    if (!files || files.length === 0) {
      return res.status(400).json({ error: "No files provided" });
    }

    // Save file metadata to database
    for (const file of files) {
      await query(
        `INSERT INTO document_uploads (
          entity_type, entity_id, document_category, file_name, 
          file_path, file_size, mime_type, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          entity_type,
          entity_id,
          document_category,
          file.originalName,
          file.path,
          file.size,
          file.mimetype,
          req.user?.id || "system",
        ],
      );
    }

    res.json({ success: true, message: "Documents uploaded successfully" });
  } catch (error) {
    console.error("Document upload error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
