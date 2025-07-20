const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { query } = require("../config/database");

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../uploads/employee-documents");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
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
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase(),
    );
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images, PDFs, and Word documents are allowed"));
    }
  },
});

// Get all employees
router.get("/employees", async (req, res) => {
  try {
    const result = await query(
      "SELECT * FROM employees ORDER BY created_at DESC",
    );
    res.json({ success: true, data: result.data || [] });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add new employee
router.post("/employees", async (req, res) => {
  try {
    const {
      employee_id,
      name,
      email,
      phone,
      position,
      department,
      employment_type,
      hire_date,
      salary,
      allowances,
      deductions,
      gender,
      bank_name,
      bank_account,
      kra_pin,
      nssf_number,
      nhif_number,
    } = req.body;

    if (!employee_id || !name || !position) {
      return res
        .status(400)
        .json({ error: "Employee ID, name, and position are required" });
    }

    const result = await query(
      `INSERT INTO employees (
        employee_id, name, email, phone, position, department, employment_type,
        hire_date, salary, allowances, deductions, gender, bank_name, bank_account,
        kra_pin, nssf_number, nhif_number
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        employee_id,
        name,
        email,
        phone,
        position,
        department,
        employment_type,
        hire_date,
        salary || 0,
        allowances || 0,
        deductions || 0,
        gender,
        bank_name,
        bank_account,
        kra_pin,
        nssf_number,
        nhif_number,
      ],
    );

    if (!result.success) {
      return res.status(500).json({ error: "Failed to add employee" });
    }

    res.json({ success: true, message: "Employee added successfully" });
  } catch (error) {
    console.error("Add employee error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Upload employee documents
router.post(
  "/employees/:id/documents",
  upload.array("documents", 10),
  async (req, res) => {
    try {
      const employeeId = req.params.id;
      const { document_types } = req.body; // Array of document types corresponding to files
      const files = req.files;

      if (!files || files.length === 0) {
        return res.status(400).json({ error: "No files uploaded" });
      }

      // Verify employee exists
      const employeeResult = await query(
        "SELECT id FROM employees WHERE id = ?",
        [employeeId],
      );
      if (!employeeResult.success || employeeResult.data.length === 0) {
        return res.status(404).json({ error: "Employee not found" });
      }

      const documentPromises = files.map((file, index) => {
        const documentType = Array.isArray(document_types)
          ? document_types[index]
          : document_types;

        return query(
          `INSERT INTO employee_documents (
          employee_id, document_type, document_name, file_path, file_size, mime_type, uploaded_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            employeeId,
            documentType || "Other",
            file.originalname,
            file.path,
            file.size,
            file.mimetype,
            req.user?.id || "system",
          ],
        );
      });

      await Promise.all(documentPromises);

      res.json({
        success: true,
        message: `${files.length} document(s) uploaded successfully`,
        uploadedFiles: files.map((f) => ({
          name: f.originalname,
          size: f.size,
        })),
      });
    } catch (error) {
      console.error("Upload documents error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  },
);

// Get employee documents
router.get("/employees/:id/documents", async (req, res) => {
  try {
    const employeeId = req.params.id;

    const result = await query(
      `SELECT ed.*, e.name as employee_name
       FROM employee_documents ed
       JOIN employees e ON ed.employee_id = e.id
       WHERE ed.employee_id = ?
       ORDER BY ed.uploaded_at DESC`,
      [employeeId],
    );

    if (!result.success) {
      return res.status(500).json({ error: "Failed to fetch documents" });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Get documents error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Process payroll
router.post("/payroll/process", async (req, res) => {
  try {
    const { employee_ids, pay_period } = req.body;

    if (
      !employee_ids ||
      !Array.isArray(employee_ids) ||
      employee_ids.length === 0
    ) {
      return res.status(400).json({ error: "Employee IDs are required" });
    }

    if (!pay_period) {
      return res
        .status(400)
        .json({ error: "Pay period is required (YYYY-MM format)" });
    }

    // Check if payroll already processed for this period
    const existingResult = await query(
      "SELECT employee_id FROM payroll WHERE pay_period = ? AND employee_id IN (?)",
      [pay_period, employee_ids],
    );

    if (existingResult.success && existingResult.data.length > 0) {
      const processedEmployees = existingResult.data.map((p) => p.employee_id);
      return res.status(400).json({
        error: "Payroll already processed for some employees in this period",
        processedEmployees,
      });
    }

    // Get employee data
    const employeesResult = await query(
      "SELECT * FROM employees WHERE id IN (?) AND status = 'Active'",
      [employee_ids],
    );

    if (!employeesResult.success || employeesResult.data.length === 0) {
      return res.status(404).json({ error: "No active employees found" });
    }

    const employees = employeesResult.data;
    const payrollPromises = employees.map((employee) => {
      // Calculate PAYE (simplified - 30% for salaries above 50,000)
      const grossSalary = (employee.salary || 0) + (employee.allowances || 0);
      const paye = grossSalary > 50000 ? grossSalary * 0.3 : grossSalary * 0.1;
      const nssf = Math.min(grossSalary * 0.06, 2160); // 6% capped at 2160
      const nhif =
        grossSalary > 100000 ? 1700 : grossSalary > 50000 ? 1200 : 500; // Simplified bands

      return query(
        `INSERT INTO payroll (
          employee_id, pay_period, basic_salary, allowances, paye, nssf, nhif,
          other_deductions, processed_date, processed_by, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employee.id,
          pay_period,
          employee.salary || 0,
          employee.allowances || 0,
          paye,
          nssf,
          nhif,
          employee.deductions || 0,
          new Date().toISOString().split("T")[0],
          req.user?.id || "system",
          "Processed",
        ],
      );
    });

    await Promise.all(payrollPromises);

    res.json({
      success: true,
      message: `Payroll processed successfully for ${employees.length} employee(s)`,
      processedCount: employees.length,
      payPeriod: pay_period,
    });
  } catch (error) {
    console.error("Process payroll error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get payroll records
router.get("/payroll", async (req, res) => {
  try {
    const { pay_period, employee_id } = req.query;

    let whereClause = "WHERE 1=1";
    let params = [];

    if (pay_period) {
      whereClause += " AND p.pay_period = ?";
      params.push(pay_period);
    }

    if (employee_id) {
      whereClause += " AND p.employee_id = ?";
      params.push(employee_id);
    }

    const result = await query(
      `SELECT p.*, e.name as employee_name, e.employee_id as emp_id
       FROM payroll p
       JOIN employees e ON p.employee_id = e.id
       ${whereClause}
       ORDER BY p.processed_date DESC, e.name ASC`,
      params,
    );

    if (!result.success) {
      return res.status(500).json({ error: "Failed to fetch payroll records" });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Get payroll error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get leave requests
router.get("/leave-requests", async (req, res) => {
  try {
    const result = await query(
      `SELECT lr.*, e.name as employee_name, e.employee_id as emp_id
       FROM leave_requests lr
       JOIN employees e ON lr.employee_id = e.id
       ORDER BY lr.created_at DESC`,
    );

    if (!result.success) {
      return res.status(500).json({ error: "Failed to fetch leave requests" });
    }

    res.json({ success: true, data: result.data });
  } catch (error) {
    console.error("Get leave requests error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Submit leave request
router.post("/leave-requests", async (req, res) => {
  try {
    const { employee_id, leave_type, start_date, end_date, reason } = req.body;

    if (!employee_id || !leave_type || !start_date || !end_date) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Calculate days requested
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const timeDiff = endDate.getTime() - startDate.getTime();
    const daysRequested = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;

    const result = await query(
      `INSERT INTO leave_requests (
        employee_id, leave_type, start_date, end_date, days_requested, reason
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [employee_id, leave_type, start_date, end_date, daysRequested, reason],
    );

    if (!result.success) {
      return res.status(500).json({ error: "Failed to submit leave request" });
    }

    res.json({
      success: true,
      message: "Leave request submitted successfully",
    });
  } catch (error) {
    console.error("Submit leave request error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
