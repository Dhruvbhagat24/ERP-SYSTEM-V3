// server/register.js
const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("./db");
const router = express.Router();

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Name, email, and password are required" });
  }

  try {
    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM "User" WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const userResult = await pool.query(
      'INSERT INTO "User" (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, hashedPassword, "user"]
    );

    const userId = userResult.rows[0].id;

    // Create empty company with ownerId = new user
    await pool.query(
      'INSERT INTO "Company" (name, "ownerId") VALUES ($1, $2)',
      [`${name}'s Company`, userId]
    );

    res.status(201).json({
      message: "User and company created successfully",
      userId,
      hasCompany: true
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
