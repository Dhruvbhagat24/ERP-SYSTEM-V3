const pool = require('./db');

async function addMissingData() {
  try {
    const companyId = 24; // User's company ID
    
    console.log('Adding missing data for company_id:', companyId);
    
    // Check existing assets
    const existingAssets = await pool.query('SELECT COUNT(*) FROM assets WHERE company_id = $1', [companyId]);
    if (existingAssets.rows[0].count === 0) {
      console.log('Adding assets...');
      await pool.query(`
        INSERT INTO assets (company_id, asset_code, name, purchase_date, purchase_cost, current_value, location, status, description)
        VALUES 
          ($1, 'EQUIP-24-001', 'Manufacturing Equipment A', '2024-01-15', 500000, 450000, 'Factory Floor 1', 'active', 'High-precision manufacturing equipment'),
          ($1, 'BLDG-24-001', 'Office Building', '2023-06-01', 2000000, 1950000, 'Downtown Office', 'active', 'Main office building'),
          ($1, 'VEH-24-001', 'Delivery Trucks (5 units)', '2024-03-10', 300000, 280000, 'Vehicle Depot', 'active', 'Fleet of delivery trucks')
      `, [companyId]);
    }
    
    // Check existing purchase orders
    const existingPOs = await pool.query('SELECT COUNT(*) FROM purchase_orders WHERE company_id = $1', [companyId]);
    if (existingPOs.rows[0].count === 0) {
      console.log('Adding purchase orders...');
      const suppliers = await pool.query('SELECT id FROM suppliers WHERE company_id = $1 ORDER BY id LIMIT 3', [companyId]);
      
      await pool.query(`
        INSERT INTO purchase_orders (company_id, supplier_id, order_date, delivery_date, status, total_amount, currency, notes)
        VALUES 
          ($1, $2, '2024-09-15', '2024-10-15', 'pending', 75000, 'USD', 'Electronics components for Q4 production'),
          ($1, $3, '2024-09-20', '2024-10-20', 'delivered', 45000, 'USD', 'Raw materials for manufacturing'),
          ($1, $4, '2024-09-25', '2024-10-25', 'pending', 32000, 'USD', 'Quality parts for maintenance')
      `, [companyId, suppliers.rows[0].id, suppliers.rows[1].id, suppliers.rows[2].id]);
    }
    
    // Check existing sales orders
    const existingSOs = await pool.query('SELECT COUNT(*) FROM sales_orders WHERE company_id = $1', [companyId]);
    if (existingSOs.rows[0].count === 0) {
      console.log('Adding sales orders...');
      const customers = await pool.query('SELECT id FROM customers WHERE company_id = $1 ORDER BY id LIMIT 3', [companyId]);
      
      await pool.query(`
        INSERT INTO sales_orders (company_id, customer_id, order_date, delivery_date, status, total_amount, currency, notes)
        VALUES 
          ($1, $2, '2024-09-18', '2024-10-18', 'processing', 125000, 'USD', 'Custom manufacturing order'),
          ($1, $3, '2024-09-22', '2024-10-22', 'shipped', 89000, 'USD', 'Bulk product delivery'),
          ($1, $4, '2024-09-28', '2024-10-28', 'pending', 156000, 'USD', 'Large retail order')
      `, [companyId, customers.rows[0].id, customers.rows[1].id, customers.rows[2].id]);
    }
    
    console.log('✅ Missing data added successfully!');
    
    // Verify final data
    const supplierCount = await pool.query('SELECT COUNT(*) FROM suppliers WHERE company_id = $1', [companyId]);
    const customerCount = await pool.query('SELECT COUNT(*) FROM customers WHERE company_id = $1', [companyId]);
    const assetCount = await pool.query('SELECT COUNT(*) FROM assets WHERE company_id = $1', [companyId]);
    const poCount = await pool.query('SELECT COUNT(*) FROM purchase_orders WHERE company_id = $1', [companyId]);
    const soCount = await pool.query('SELECT COUNT(*) FROM sales_orders WHERE company_id = $1', [companyId]);
    
    console.log('Final data counts:');
    console.log('- Suppliers:', supplierCount.rows[0].count);
    console.log('- Customers:', customerCount.rows[0].count);
    console.log('- Assets:', assetCount.rows[0].count);
    console.log('- Purchase Orders:', poCount.rows[0].count);
    console.log('- Sales Orders:', soCount.rows[0].count);
    
    process.exit(0);
  } catch (err) {
    console.error('Error adding missing data:', err);
    process.exit(1);
  }
}

addMissingData();