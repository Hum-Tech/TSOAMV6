const express = require("express");
const { query } = require("../config/database");

const router = express.Router();

// Get all transactions
router.get("/transactions", async (req, res) => {
  try {
    const result = await query("SELECT * FROM transactions ORDER BY date DESC");
    res.json({ success: true, data: result.data || [] });
  } catch (error) {
    console.error("Get transactions error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add new transaction
router.post("/transactions", async (req, res) => {
  try {
    const {
      type,
      category,
      subcategory,
      description,
      amount,
      currency,
      payment_method,
      reference,
      date,
      status,
      account_code,
      notes,
    } = req.body;

    const transactionId = `TXN-${Date.now()}`;

    const result = await query(
      `INSERT INTO transactions (
        id, type, category, subcategory, description, amount, currency,
        payment_method, reference, date, status, account_code, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        transactionId,
        type,
        category,
        subcategory,
        description,
        amount,
        currency,
        payment_method,
        reference,
        date,
        status,
        account_code,
        notes,
      ],
    );

    if (!result.success) {
      return res.status(500).json({ error: "Failed to add transaction" });
    }

    res.json({ success: true, message: "Transaction added successfully" });
  } catch (error) {
    console.error("Add transaction error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all expenses
router.get("/expenses", async (req, res) => {
  try {
    const result = await query("SELECT * FROM expenses ORDER BY date DESC");
    res.json({ success: true, data: result.data || [] });
  } catch (error) {
    console.error("Get expenses error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Add new expense
router.post("/expenses", async (req, res) => {
  try {
    const {
      category,
      subcategory,
      description,
      amount,
      currency,
      payment_method,
      supplier,
      receipt_number,
      date,
      approved_by,
      status,
      vat_amount,
      vat_number,
      account_code,
      department,
      notes,
    } = req.body;

    const expenseId = `EXP-${Date.now()}`;

    const result = await query(
      `INSERT INTO expenses (
        id, category, subcategory, description, amount, currency,
        payment_method, supplier, receipt_number, date, approved_by,
        status, vat_amount, vat_number, account_code, department, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        expenseId,
        category,
        subcategory,
        description,
        amount,
        currency,
        payment_method,
        supplier,
        receipt_number,
        date,
        approved_by,
        status,
        vat_amount,
        vat_number,
        account_code,
        department,
        notes,
      ],
    );

    if (!result.success) {
      return res.status(500).json({ error: "Failed to add expense" });
    }

    res.json({ success: true, message: "Expense added successfully" });
  } catch (error) {
    console.error("Add expense error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
