const pool = require('./db');

async function addUniqueOrders() {
  try {
    const companyId = 24;
    
    console.log('Adding orders with unique numbers...');
    
    // Add purchase orders
    await pool.query(`
      INSERT INTO purchase_orders (company_id, po_number, supplier_id, order_date, expected_delivery_date, status, total_amount, final_amount, notes)
      VALUES 
        ($1, 'PO-24-001', 10, '2024-09-15', '2024-10-15', 'pending', 75000, 75000, 'Electronics components'),
        ($1, 'PO-24-002', 11, '2024-09-20', '2024-10-20', 'delivered', 45000, 45000, 'Raw materials'),
        ($1, 'PO-24-003', 12, '2024-09-25', '2024-10-25', 'pending', 32000, 32000, 'Quality parts')
    `, [companyId]);
    console.log('✅ Purchase orders added');
    
    // Add sales orders
    await pool.query(`
      INSERT INTO sales_orders (company_id, so_number, customer_id, order_date, delivery_date, status, total_amount, final_amount, payment_status, notes)
      VALUES 
        ($1, 'SO-24-001', 10, '2024-09-18', '2024-10-18', 'processing', 125000, 125000, 'pending', 'Custom order'),
        ($1, 'SO-24-002', 11, '2024-09-22', '2024-10-22', 'shipped', 89000, 89000, 'paid', 'Bulk delivery'),
        ($1, 'SO-24-003', 12, '2024-09-28', '2024-10-28', 'pending', 156000, 156000, 'pending', 'Large order')
    `, [companyId]);
    console.log('✅ Sales orders added');
    
    // Final verification
    const poCount = await pool.query('SELECT COUNT(*) FROM purchase_orders WHERE company_id = $1', [companyId]);
    const soCount = await pool.query('SELECT COUNT(*) FROM sales_orders WHERE company_id = $1', [companyId]);
    
    console.log('✅ All data added successfully!');
    console.log('- Purchase Orders:', poCount.rows[0].count);
    console.log('- Sales Orders:', soCount.rows[0].count);
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

addUniqueOrders();