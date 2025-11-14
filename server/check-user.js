const pool = require('./db');

async function checkUserData() {
  try {
    // Check user data
    const userResult = await pool.query('SELECT id, email, company_id FROM users WHERE email = $1', ['dhruvb24@gmail.com']);
    console.log('User data:', userResult.rows[0]);
    
    if (userResult.rows[0]) {
      const companyId = userResult.rows[0].company_id;
      console.log('\nChecking data for company_id:', companyId);
      
      // Check suppliers
      const suppliers = await pool.query('SELECT COUNT(*) FROM suppliers WHERE company_id = $1', [companyId]);
      console.log('Suppliers for this company:', suppliers.rows[0].count);
      
      // Check customers  
      const customers = await pool.query('SELECT COUNT(*) FROM customers WHERE company_id = $1', [companyId]);
      console.log('Customers for this company:', customers.rows[0].count);
      
      // Check assets
      const assets = await pool.query('SELECT COUNT(*) FROM assets WHERE company_id = $1', [companyId]);
      console.log('Assets for this company:', assets.rows[0].count);
      
      // Check purchase orders
      const pos = await pool.query('SELECT COUNT(*) FROM purchase_orders WHERE company_id = $1', [companyId]);
      console.log('Purchase Orders for this company:', pos.rows[0].count);
      
      // Check sales orders
      const sos = await pool.query('SELECT COUNT(*) FROM sales_orders WHERE company_id = $1', [companyId]);
      console.log('Sales Orders for this company:', sos.rows[0].count);
      
      // Check if there are any records with different company_ids
      console.log('\nAll suppliers company_ids:');
      const allSuppliers = await pool.query('SELECT DISTINCT company_id FROM suppliers');
      console.log(allSuppliers.rows);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

checkUserData();