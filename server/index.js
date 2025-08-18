// server/index.js
const express = require("express");
const cors = require("cors");

const app = express();

// ✅ Always put middleware FIRST
app.use(cors()); // Allow CORS
app.use(express.json()); // Parse application/json
app.use(express.urlencoded({ extended: true })); // Parse application/x-www-form-urlencoded

// ✅ Debug log: check if body is parsed
app.use((req, res, next) => {
  console.log("Incoming request:", req.method, req.url);
  console.log("Body:", req.body);
  next();
});

// ✅ Import routes AFTER middleware
const authRoutes = require("./auth");
const companyRoutes = require("./company");
const registerRoutes = require("./register");

app.use(authRoutes);
app.use(companyRoutes);
app.use(registerRoutes);

// ✅ Start server
app.listen(5000, () => {
  console.log("✅ Server running on port 5000");
});
