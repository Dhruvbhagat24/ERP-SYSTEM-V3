const pool = require('./db');

async function testDashboardAPI() {
  try {
    const stocksResult = await pool.query(`
      SELECT 
        COUNT(*) as total_products,
        SUM(CASE WHEN quantity <= 10 THEN 1 ELSE 0 END) as low_stock_items,
        SUM(CASE WHEN quantity = 0 THEN 1 ELSE 0 END) as out_of_stock_items,
        SUM(quantity * price) as total_stock_value,
        AVG(quantity) as avg_stock_level
      FROM stocks 
      WHERE company_id = 16
    `);
    
    const stockMetrics = stocksResult.rows[0];
    console.log('Raw stock metrics:', stockMetrics);
    
    const metrics = {
      totalProducts: parseInt(stockMetrics.total_products) || 0,
      totalRevenue: parseFloat(stockMetrics.total_stock_value) || 0,
      lowStockItems: parseInt(stockMetrics.low_stock_items) || 0,
      outOfStockItems: parseInt(stockMetrics.out_of_stock_items) || 0,
    };
    
    console.log('Final metrics structure:', { data: metrics });
    pool.end();
  } catch (error) {
    console.error('Error:', error);
    pool.end();
  }
}

testDashboardAPI();