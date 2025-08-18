const pool = require("./db");

(async () => {
  try {
    const dbInfo = await pool.query(`SELECT current_database() AS db, current_schema() AS schema`);
    console.log("📡 Connected to:", dbInfo.rows[0]);

    const cols = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Company'
      ORDER BY column_name
    `);
    console.log("📋 Columns in Company:", cols.rows.map(r => r.column_name));
  } catch (err) {
    console.error("❌ DB Debug Error:", err);
  } finally {
    pool.end();
  }
})();
