// server/auth.js
const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const router = express.Router();

router.post("/login", async (req, res) => {
  console.log("📩 Raw request body:", req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    console.log("❌ Missing email or password in body");
    return res.status(400).json({ error: "Email and password are required" });
  }

  try {
    // 1. Find user
    console.log("🔍 Looking for user:", email);
    const userResult = await pool.query(
      'SELECT id, name, email, password, role FROM "User" WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      console.log("❌ No user found with that email");
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = userResult.rows[0];

    // 2. Check password
    console.log("🔑 Comparing password...");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("❌ Password does not match");
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // 3. DEBUG: Confirm DB & Company table columns
    try {
      const dbInfo = await pool.query(`SELECT current_database() AS db, current_schema() AS schema`);
      console.log("📡 Connected to:", dbInfo.rows[0]);

      const colInfo = await pool.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'Company'
      `);
      console.log("📋 Columns in Company:", colInfo.rows.map(r => r.column_name));
    } catch (debugErr) {
      console.error("⚠️ Could not fetch DB debug info:", debugErr);
    }

    // 4. Check company (quoted to avoid case issues)
    console.log("🏢 Checking if user owns a company...");
    const companyResult = await pool.query(
      'SELECT id FROM "Company" WHERE "ownerId" = $1',
      [user.id]
    );
    const hasCompany = companyResult.rows.length > 0;

    // 5. Create token
    console.log("✅ Creating JWT...");
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // 6. Respond
    console.log("✅ Login successful");
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      hasCompany
    });

  } catch (err) {
    console.error("💥 Database error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;
