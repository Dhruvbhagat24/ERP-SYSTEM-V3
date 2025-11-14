// server/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "./db.js";

const router = express.Router();

// Signup
router.post("/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // check if email already exists
    const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert new user
    await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3)",
      [name, email, hashedPassword]
    );

    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const user = result.rows[0];

    // compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // generate JWT
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// routes/auth.js or in your server.js

// ---------------- Company Login ----------------
router.post("/company-login", async (req, res) => {
  const { companyName, adminEmail, adminPassword } = req.body;

  if (!companyName || !adminEmail || !adminPassword) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    // Find the company
    const companyResult = await pool.query(
      "SELECT * FROM companies WHERE name = $1",
      [companyName]
    );
    if (companyResult.rows.length === 0) {
      return res.status(404).json({ error: "Company not found" });
    }
    const company = companyResult.rows[0];

    // Find admin user for that company
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND company_id = $2",
      [adminEmail, company.id]
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: "Admin not found for this company" });
    }
    const user = userResult.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(adminPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: "Incorrect password" });
    }

    // Optional: generate a token
    const token = "dummy-token"; // replace with JWT if needed

    // Return user + company data
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
      company: {
        id: company.id,
        name: company.name,
        currency: company.currency,
        taxId: company.tax_id,
        address1: company.address1,
        address2: company.address2,
        city: company.city,
        state: company.state,
        country: company.country,
        postalCode: company.postal_code,
      },
    });
  } catch (err) {
    console.error("Company login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
