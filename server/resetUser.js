// resetUser.js
const { Pool } = require("pg");
const bcrypt = require("bcrypt");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "erpdb",
  password: "Password@24",
  port: 5432,
});

async function resetUser() {
  const email = "dhruv242005@gmail.com";
  const password = "Password";

  try {
    await pool.query("DELETE FROM users WHERE email = $1", [email]);
    console.log("✅ Old user deleted (if existed)");

    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id",
      ["Dhruv", email, hashedPassword]
    );

    console.log(`✅ User reset successfully. ID: ${result.rows[0].id}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Error resetting user:", err.message);
    process.exit(1);
  }
}

resetUser();
