// run this once in a separate file, e.g., seedUser.js
const bcrypt = require("bcrypt");
const pool = require("./db");

(async () => {
  const passwordHash = await bcrypt.hash("123456", 10);

  await pool.query(
    `INSERT INTO "User" (name, email, password, role)
     VALUES ($1, $2, $3, $4)`,
    ["Test User", "test@example.com", passwordHash, "user"]
  );

  console.log("✅ Test user inserted");
  process.exit();
})();
