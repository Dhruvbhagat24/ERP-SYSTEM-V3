const express = require('express');
const selling = express.Router();
const pool = require('../db'); 
const { verifyToken } = require('../middleware/auth'); 

selling.get('/analytics', async (_req, res) => {
  try {
    const [countRes, totalRes, recentRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS total_orders FROM sales_orders`),
      pool.query(`SELECT COALESCE(SUM(total_amount),0)::numeric AS total_revenue FROM sales_orders`),
      pool.query(`SELECT id, so_number, order_date, status, total_amount, created_at FROM sales_orders ORDER BY created_at DESC LIMIT 10`)
    ]);

    return res.json({
      total_orders: countRes.rows[0]?.total_orders ?? 0,
      total_revenue: Number(totalRes.rows[0]?.total_revenue ?? 0),
      recent_orders: recentRes.rows || []
    });
  } catch (err) {
    console.error('Selling analytics error:', err);
    return res.status(500).json({ error: 'Failed to compute selling analytics' });
  }
});

/**
 * GET /api/selling/sales-orders
 * Query params:
 *   q - search term (so_number or customer name)
 *   limit - page size (default 50, max 100)
 *   offset - offset (default 0)
 * Requires verifyToken (so req.user is set and contains company_id)
 */
selling.get('/sales-orders', verifyToken, async (req, res) => {
  try {
    const company_id = req.user?.company_id || req.user?.companyId;
    if (!company_id) return res.status(400).json({ error: 'Missing company_id in token' });

    const qstr = (req.query.q || '').trim();
    const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 50));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    let baseSql;
    const params = [company_id];

    if (qstr) {
      baseSql = `
        SELECT so.id, so.customer_id, so.so_number, so.order_date, so.delivery_date, so.status, so.total_amount, so.created_at,
               c.name AS customer_name
        FROM sales_orders so
        LEFT JOIN customers c ON c.id = so.customer_id
        WHERE so.company_id = $1
          AND (so.so_number ILIKE $2 OR c.name ILIKE $2)
        ORDER BY so.created_at DESC
        LIMIT $3 OFFSET $4
      `;
      params.push(`%${qstr}%`, limit, offset);
    } else {
      baseSql = `
        SELECT id, customer_id, so_number, order_date, delivery_date, status, total_amount, created_at
        FROM sales_orders
        WHERE company_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
      params.push(limit, offset);
    }

    const r = await pool.query(baseSql, params);
    return res.json(r.rows || []);
  } catch (err) {
    console.error('Fetch sales orders error:', err);
    return res.status(500).json({ error: 'Failed to fetch sales orders' });
  }
});

/**
 * GET /api/selling/sales-orders/:id
 * Returns normalized { order, items }
 * Requires verifyToken and verifies the order belongs to user's company.
 */
selling.get('/sales-orders/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    // fetch order
    const orderRes = await pool.query(
      `SELECT id, company_id, customer_id, so_number, order_date, delivery_date, status, notes, total_amount, created_at
       FROM sales_orders WHERE id=$1`,
      [id]
    );

    if (!orderRes.rows.length) return res.status(404).json({ error: 'Sales order not found' });

    const order = orderRes.rows[0];
    const authCompany = req.user?.company_id || req.user?.companyId;
    if (Number(order.company_id) !== Number(authCompany)) {
      return res.status(403).json({ error: 'Forbidden: order not in your company' });
    }

    // fetch items
    const itemsRes = await pool.query(
      `SELECT id, sales_order_id, product_name, sku, quantity, unit_price, total_price, shipped_quantity, created_at
       FROM sales_order_items WHERE sales_order_id=$1 ORDER BY id ASC`,
      [id]
    );

    return res.json({ order, items: itemsRes.rows || [] });
  } catch (err) {
    console.error('Fetch sales order details error:', err);
    return res.status(500).json({ error: 'Failed to fetch sales order details' });
  }
});

/**
 * GET /api/selling/sales-orders/:id/items
 * Returns { order, items } — reuses the single-order query for consistency.
 * Requires verifyToken.
 */
selling.get('/sales-orders/:id/items', verifyToken, async (req, res) => {
  // delegate to the previous handler's logic by fetching directly here (dup to avoid complex routing)
  try {
    const { id } = req.params;
    if (!id) return res.status(400).json({ error: 'Missing id' });

    const orderRes = await pool.query('SELECT id, company_id, customer_id, so_number, order_date, total_amount FROM sales_orders WHERE id=$1', [id]);
    if (!orderRes.rows.length) return res.status(404).json({ error: 'Sales order not found' });

    const order = orderRes.rows[0];
    const authCompany = req.user?.company_id || req.user?.companyId;
    if (Number(order.company_id) !== Number(authCompany)) {
      return res.status(403).json({ error: 'Forbidden: order not in your company' });
    }

    const itemsRes = await pool.query('SELECT id, sales_order_id, product_name, sku, quantity, unit_price, total_price, shipped_quantity, created_at FROM sales_order_items WHERE sales_order_id=$1 ORDER BY id ASC', [id]);

    return res.json({ order, items: itemsRes.rows || [] });
  } catch (err) {
    console.error('Fetch sales order items error:', err);
    return res.status(500).json({ error: 'Failed to fetch sales order items' });
  }
});

/* ----------------
   Create / Update / Delete Sales Orders
   (If you already have a create/update flow elsewhere you can remove/redirect these)
   ---------------- */

selling.post('/sales-orders', verifyToken, async (req, res) => {
  // if you have a create flow in main server keep it there; otherwise implement here.
  return res.status(501).json({ error: 'Create sales order endpoint implemented elsewhere' });
});

selling.put('/sales-orders/:id', verifyToken, async (req, res) => {
  return res.status(501).json({ error: 'Update sales order - implement as required' });
});

selling.delete('/sales-orders/:id', verifyToken, async (req, res) => {
  return res.status(501).json({ error: 'Delete sales order - implement as required' });
});

module.exports = selling;
