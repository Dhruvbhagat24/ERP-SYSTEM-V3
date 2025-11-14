const express = require("express");
const router = express.Router();
const pool = require("../db");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

/* ---------------- AUTH ---------------- */
router.post("/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "All fields required" });

  try {
    const existing = await pool.query("SELECT id FROM users WHERE email=$1", [email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: "Email already registered" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO users (name,email,password) VALUES ($1,$2,$3) RETURNING id,name,email",
      [name, email, hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ message: "✅ User registered", user, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    if (result.rows.length === 0) return res.status(400).json({ error: "Invalid credentials" });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ user: { id: user.id, name: user.name, email: user.email, company_id: user.company_id }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// JWT Middleware
const verifyToken = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token provided" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await pool.query("SELECT id,name,email,company_id FROM users WHERE id=$1", [decoded.id]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Invalid token" });

    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: "Unauthorized" });
  }
};

// Get current user
router.get("/auth/me", verifyToken, (req, res) => res.json({ user: req.user }));

/* ---------------- CRUD FACTORY ---------------- */
const crudRoutes = (table, fields, computeTotal = false) => {
  const r = express.Router();

  r.get("/", async (_, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${table} ORDER BY id DESC`);
      res.json(result.rows);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to fetch data" });
    }
  });

  r.post("/", async (req, res) => {
    try {
      const values = fields.map(f => req.body[f]);
      if (computeTotal) {
        values.push((parseFloat(req.body.quantity) || 0) * (parseFloat(req.body.price) || 0));
      }
      const cols = fields.join(",") + (computeTotal ? ",total" : "");
      const placeholders = values.map((_, i) => `$${i+1}`).join(",");
      const result = await pool.query(`INSERT INTO ${table} (${cols}) VALUES (${placeholders}) RETURNING *`, values);
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to create record" });
    }
  });

  r.put("/:id", async (req, res) => {
    try {
      const sets = fields.map((f,i)=>`${f}=$${i+1}`);
      const values = fields.map(f => req.body[f]);
      if (computeTotal) {
        sets.push(`total=$${fields.length+1}`);
        values.push((parseFloat(req.body.quantity)||0)*(parseFloat(req.body.price)||0));
      }
      values.push(req.params.id);
      const result = await pool.query(`UPDATE ${table} SET ${sets.join(", ")} WHERE id=$${values.length} RETURNING *`, values);
      res.json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to update record" });
    }
  });

  r.delete("/:id", async (req, res) => {
    try {
      await pool.query(`DELETE FROM ${table} WHERE id=$1`, [req.params.id]);
      res.json({ message: "✅ Deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Failed to delete record" });
    }
  });

  return r;
};

// Attach CRUD routes
router.use("/buying", crudRoutes("buying", ["user_id","stock_id","quantity","price"], true));
router.use("/selling", crudRoutes("selling", ["user_id","stock_id","quantity","price"], true));
router.use("/stocks", crudRoutes("stocks", ["company_id","name","symbol","price","quantity"]));
router.use("/assets", crudRoutes("assets", ["company_id","name","description","value","acquired_at"]));
router.use("/accounts", crudRoutes("accounts", ["account_name","account_type","balance"]));
router.use("/settings", crudRoutes("settings", ["key","value"]));

// Accounting routes
router.use("/accounting", crudRoutes("accounting_entries", ["company_id","type","amount","description"]));

// Accounting summary
router.get("/accounting/summary/:companyId", async (req,res)=>{
  const {companyId}=req.params;
  try{
    const result = await pool.query(
      `SELECT SUM(CASE WHEN type='Credit' THEN amount ELSE 0 END) as total_credits,
              SUM(CASE WHEN type='Debit' THEN amount ELSE 0 END) as total_debits,
              COUNT(*) as total_entries
       FROM accounting_entries WHERE company_id=$1`,
      [companyId]
    );
    res.json(result.rows[0]);
  }catch(err){
    console.error(err);
    res.status(500).json({error:"Failed to fetch accounting summary"});
  }
});

router.post("/add-asset", (req, res) => {
  const { assetName, email } = req.body;

  if (!assetName || !email) {
    return res.status(400).json({ error: "Asset name and email are required." });
  }

  // Simulate asset creation
  console.log(`Asset created: ${assetName}, Email: ${email}`);
  res.status(200).json({ message: "Asset added successfully!" });
});

module.exports = router;
