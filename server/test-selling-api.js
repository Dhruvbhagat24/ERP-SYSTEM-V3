const pool = require('./db');

async function testSellingAPI() {
  try {
    console.log('Testing customers API...');
    const customers = await pool.query('SELECT * FROM customers WHERE company_id = 24 ORDER BY created_at DESC');
    console.log('Customers count:', customers.rows.length);
    console.log('Sample customer:', customers.rows[0]);
    
    console.log('\nTesting sales orders API...');
    const salesOrders = await pool.query(`SELECT so.*, c.name as customer_name 
       FROM sales_orders so 
       LEFT JOIN customers c ON so.customer_id = c.id 
       WHERE so.company_id = 24 ORDER BY so.created_at DESC`);
    console.log('Sales Orders count:', salesOrders.rows.length);
    console.log('Sample sales order:', salesOrders.rows[0]);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

testSellingAPI();