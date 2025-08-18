// server/company.js
const express = require("express");
const pool = require("./db");
const jwt = require("jsonwebtoken");
const router = express.Router();

const JWT_SECRET = "supersecret"; // same secret as in auth.js

// Middleware to check token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: "No token" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ error: "Invalid token" });
    req.userId = decoded.userId;
    next();
  });
}

// POST /company
router.post("/company", authMiddleware, async (req, res) => {
  const { name, address } = req.body;

  try {
    // Insert company
    const companyRes = await pool.query(
      'INSERT INTO "Company" (name, addressLine1) VALUES ($1, $2) RETURNING id',
      [name, address]
    );

    const companyId = companyRes.rows[0].id;

    // Link company to user
    await pool.query(
      'UPDATE "User" SET company_id = $1 WHERE id = $2',
      [companyId, req.userId]
    );

    res.json({ message: "Company created", companyId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
