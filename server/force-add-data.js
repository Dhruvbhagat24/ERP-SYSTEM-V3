const pool = require('./db');

async function forceAddData() {
  try {
    const companyId = 24; // User's company ID
    
    console.log('Force adding data for company_id:', companyId);
    
    // Add assets
    console.log('Adding assets...');
    try {
      await pool.query(`
        INSERT INTO assets (company_id, asset_code, name, purchase_date, purchase_cost, current_value, location, status, description)
        VALUES 
          ($1, 'EQUIP-24-001', 'Manufacturing Equipment A', '2024-01-15', 500000, 450000, 'Factory Floor 1', 'active', 'High-precision manufacturing equipment'),
          ($1, 'BLDG-24-001', 'Office Building', '2023-06-01', 2000000, 1950000, 'Downtown Office', 'active', 'Main office building'),
          ($1, 'VEH-24-001', 'Delivery Trucks (5 units)', '2024-03-10', 300000, 280000, 'Vehicle Depot', 'active', 'Fleet of delivery trucks')
      `, [companyId]);
      console.log('✅ Assets added');
    } catch (err) {
      console.log('Assets already exist or error:', err.message);
    }
    
    // Add purchase orders
    console.log('Adding purchase orders...');
    try {
      await pool.query(`
        INSERT INTO purchase_orders (company_id, supplier_id, order_date, delivery_date, status, total_amount, currency, notes)
        VALUES 
          ($1, 10, '2024-09-15', '2024-10-15', 'pending', 75000, 'USD', 'Electronics components for Q4 production'),
          ($1, 11, '2024-09-20', '2024-10-20', 'delivered', 45000, 'USD', 'Raw materials for manufacturing'),
          ($1, 12, '2024-09-25', '2024-10-25', 'pending', 32000, 'USD', 'Quality parts for maintenance')
      `, [companyId]);
      console.log('✅ Purchase orders added');
    } catch (err) {
      console.log('Purchase orders error:', err.message);
    }
    
    // Add sales orders
    console.log('Adding sales orders...');
    try {
      await pool.query(`
        INSERT INTO sales_orders (company_id, customer_id, order_date, delivery_date, status, total_amount, currency, notes)
        VALUES 
          ($1, 10, '2024-09-18', '2024-10-18', 'processing', 125000, 'USD', 'Custom manufacturing order'),
          ($1, 11, '2024-09-22', '2024-10-22', 'shipped', 89000, 'USD', 'Bulk product delivery'),
          ($1, 12, '2024-09-28', '2024-10-28', 'pending', 156000, 'USD', 'Large retail order')
      `, [companyId]);
      console.log('✅ Sales orders added');
    } catch (err) {
      console.log('Sales orders error:', err.message);
    }
    
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
    console.error('Error:', err);
    process.exit(1);
  }
}

forceAddData();