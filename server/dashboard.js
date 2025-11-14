const express = require("express");
const pool = require("./db");
const router = express.Router();

// GET /api/dashboard/:companyId
router.get("/:companyId", async (req, res) => {
  try {
    const { companyId } = req.params;

    const revenue = await pool.query(
      "SELECT COALESCE(SUM(amount),0) AS total FROM invoices WHERE company_id=$1",
      [companyId]
    );

    const sales = await pool.query(
      "SELECT COUNT(*) AS count FROM orders WHERE company_id=$1",
      [companyId]
    );

    const products = await pool.query(
      "SELECT COUNT(*) AS count FROM products WHERE company_id=$1",
      [companyId]
    );

    const users = await pool.query(
      "SELECT COUNT(*) AS count FROM users WHERE company_id=$1",
      [companyId]
    );

    const lowStock = await pool.query(
      "SELECT COUNT(*) AS count FROM products WHERE company_id=$1 AND stock < 10",
      [companyId]
    );

    const pendingOrders = await pool.query(
      "SELECT COUNT(*) AS count FROM orders WHERE company_id=$1 AND status='pending'",
      [companyId]
    );

    const overdueInvoices = await pool.query(
      "SELECT COUNT(*) AS count FROM invoices WHERE company_id=$1 AND status='overdue'",
      [companyId]
    );

    const activities = await pool.query(
      "SELECT details, created_at FROM activity_log WHERE company_id=$1 ORDER BY created_at DESC LIMIT 10",
      [companyId]
    );

    res.json({
      revenue: revenue.rows[0].total,
      sales: sales.rows[0].count,
      products: products.rows[0].count,
      users: users.rows[0].count,
      lowStock: lowStock.rows[0].count,
      pendingOrders: pendingOrders.rows[0].count,
      overdueInvoices: overdueInvoices.rows[0].count,
      activities: activities.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
