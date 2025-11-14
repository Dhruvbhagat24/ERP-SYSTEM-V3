// Debug script to check stocks data structure
const { Pool } = require('pg');
require('dotenv').config({ path: './server/.env' });

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function debugStocks() {
  try {
    console.log('Connecting to database...');
    
    // Check raw stocks data
    const rawResult = await pool.query('SELECT * FROM stocks WHERE company_id = 24 LIMIT 3');
    console.log('\nRaw stocks data:');
    console.log(rawResult.rows);
    
    // Check the processed data (same as API)
    const apiResult = await pool.query(`
      SELECT 
        id,
        name as productName,
        symbol as sku,
        quantity as currentStock,
        price as unitPrice,
        created_at as lastMovement,
        CASE 
          WHEN quantity = 0 THEN 'out_of_stock'
          WHEN quantity <= 10 THEN 'low_stock'
          WHEN quantity >= 100 THEN 'overstock'
          ELSE 'in_stock'
        END as status,
        10 as minStockLevel,
        100 as maxStockLevel,
        'pieces' as unit,
        'Warehouse A' as location
      FROM stocks 
      WHERE company_id = 24
      ORDER BY created_at DESC
      LIMIT 3
    `);
    
    console.log('\nAPI-formatted data:');
    console.log(apiResult.rows);

    console.log('\nData structure analysis:');
    if (apiResult.rows.length > 0) {
      const sample = apiResult.rows[0];
      console.log('Sample item keys:', Object.keys(sample));
      console.log('Product name field:', sample.productname || sample.productName);
      console.log('SKU field:', sample.sku);
      console.log('Stock field:', sample.currentstock || sample.currentStock);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

debugStocks();