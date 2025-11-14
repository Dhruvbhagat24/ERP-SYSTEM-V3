require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('./db');
const stocksRouter = express.Router();

const app = express();

/* ---------------- Core Middleware ---------------- */
app.use(cors({
  origin: ['http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

app.use((req,res,next)=>{
  if (req.url.includes('.hot-update')) return next();
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

/* ---------------- Auth / JWT ---------------- */
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

const verifyToken = async (req,res,next)=>{
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const userRes = await pool.query(
      'SELECT id,name,email,role,company_id FROM users WHERE id=$1',
      [decoded.id]
    );
    if (!userRes.rows.length) return res.status(401).json({ error: 'Invalid token' });
    req.user = userRes.rows[0];
    next();
  } catch(e){
    console.error('JWT error:', e.message);
    return res.status(401).json({ error: 'Unauthorized' });
  }
};

/* ---------------- Helpers ---------------- */
const q = async (res, sql, params=[], single=false)=>{
  try {
    const r = await pool.query(sql, params);
    res.json(single ? r.rows[0] : r.rows);
  } catch(e){
    console.error('SQL error:', e.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
const num = v => v==='' || v==null ? null : Number(v);

/* ---------------- Auth Routes ---------------- */
app.post('/api/auth/login', async (req,res)=>{
  try {
    let { companyName, email, password } = req.body;
    if (!companyName || !email || !password)
      return res.status(400).json({ error: 'Company, email, password required' });

    const companyRes = await pool.query(
      'SELECT id,name,currency FROM companies WHERE TRIM(name) ILIKE $1',
      [companyName.trim()]
    );
    if (!companyRes.rows.length) return res.status(404).json({ error: 'Company not found' });
    const company = companyRes.rows[0];

    const userRes = await pool.query(
      'SELECT id,name,email,password,role,company_id FROM users WHERE LOWER(email)=LOWER($1)',
      [email.trim()]
    );
    if (!userRes.rows.length) return res.status(404).json({ error: 'Email not found' });
    const user = userRes.rows[0];
    if (user.company_id !== company.id) return res.status(403).json({ error: 'Email not in company' });

    const ok = await bcrypt.compare(password.trim(), user.password);
    if (!ok) return res.status(401).json({ error: 'Invalid password' });

    const token = jwt.sign({ id:user.id, companyId:company.id, role:user.role }, JWT_SECRET, { expiresIn:'1d' });
    res.json({
      token,
      user: { id:user.id, name:user.name, email:user.email, role:user.role, company_id: company.id },
      company
    });
  } catch(e){
    console.error('Login error:', e.message);
    res.status(500).json({ error: 'Server error during login' });
  }
});

app.get('/api/auth/me', verifyToken, (req,res)=> res.json({ user: req.user }));

/* ------------------------------------------------------------------
   SELLING MODULE
   Tables assumed:
   customers(id,name,contact_person,email,phone,address,status,created_at,updated_at)
   sales_orders(id,customer_id,so_number,order_date,delivery_date,notes,status,total_amount,created_at,updated_at)
   sales_order_items(id,sales_order_id,product_name,sku,quantity,unit_price,total_price,shipped_quantity,created_at)
------------------------------------------------------------------- */
const selling = express.Router();

/* Customers */
selling.get('/customers', async (_,res)=> {
  await q(res,'SELECT * FROM customers ORDER BY created_at DESC');
});

selling.post('/customers', verifyToken, async (req,res)=>{
  const { name, contact_person, email, phone, address, status='active' } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  await q(res,
    `INSERT INTO customers (name,contact_person,email,phone,address,status,created_at,updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,NOW(),NOW()) RETURNING *`,
    [name, contact_person||null, email||null, phone||null, address||null, status],
    true
  );
});

selling.put('/customers/:id', verifyToken, async (req,res)=>{
  const { id } = req.params;
  const { name, contact_person, email, phone, address, status } = req.body;
  await q(res,
    `UPDATE customers SET name=$1,contact_person=$2,email=$3,phone=$4,address=$5,status=$6,updated_at=NOW()
     WHERE id=$7 RETURNING *`,
    [name, contact_person||null, email||null, phone||null, address||null, status, id],
    true
  );
});

selling.delete('/customers/:id', verifyToken, async (req,res)=>{
  try {
    await pool.query('DELETE FROM customers WHERE id=$1',[req.params.id]);
    res.json({ message:'Deleted' });
  } catch(e){
    console.error('Delete customer:', e.message);
    res.status(500).json({ error:'Failed to delete customer' });
  }
});

/* Sales Orders */
selling.get('/sales-orders', verifyToken, async (req, res) => {
  try {
    const company_id = req.user?.company_id || req.user?.companyId;
    if (!company_id) return res.status(400).json({ error: 'Missing company_id in token' });
    const r = await pool.query('SELECT * FROM sales_orders WHERE company_id=$1 ORDER BY created_at DESC', [company_id]);
    res.json(r.rows);
  } catch (e) {
    console.error('Fetch sales orders error:', e);
    res.status(500).json({ error: 'Failed to fetch sales orders' });
  }
});

selling.get('/sales-orders/:id/items', verifyToken, async (req, res) => {
  try {
    const company_id = req.user?.company_id || req.user?.companyId;
    if (!company_id) return res.status(400).json({ error: 'Missing company_id in token' });
    const r = await pool.query('SELECT * FROM sales_order_items WHERE sales_order_id=$1 ORDER BY id ASC', [req.params.id]);
    res.json(r.rows);
  } catch (e) {
    console.error('Fetch sales order items error:', e);
    res.status(500).json({ error: 'Failed to fetch sales order items' });
  }
});

// Improved create sales order (use company_id from token)
selling.post('/sales-orders', verifyToken, async (req, res) => {
  const client = await pool.connect();
  try {
    console.log('POST /api/selling/sales-orders - user:', req.user);
    console.log('Body:', req.body);

    const company_id = req.user?.company_id || req.user?.companyId;
    if (!company_id) {
      return res.status(400).json({ error: 'Missing company_id in token (check JWT payload)' });
    }

    const { customer_id, so_number, order_date, delivery_date, notes, status = 'pending', items = [] } = req.body;
    if (!customer_id || !so_number || !order_date) {
      return res.status(400).json({ error: 'customer_id, so_number, order_date required' });
    }

    await client.query('BEGIN');

    // Insert sales order and include company_id
    const orderRes = await client.query(
      `INSERT INTO sales_orders 
         (company_id, customer_id, so_number, order_date, delivery_date, notes, status, total_amount, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
       RETURNING *`,
      [company_id, customer_id, so_number, order_date, delivery_date || null, notes || null, status, 0]
    );

    const order = orderRes.rows[0];
    let total = 0;

    for (const it of items) {
      const qty = parseInt(it.quantity) || 0;
      const price = parseFloat(it.unit_price) || 0;
      const line = qty * price;
      total += line;

      await client.query(
        `INSERT INTO sales_order_items
          (sales_order_id, product_name, sku, quantity, unit_price, total_price, shipped_quantity, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [order.id, it.product_name || 'Item', it.sku || null, qty, price, line, it.shipped_quantity || 0]
      );
    }

    await client.query('UPDATE sales_orders SET total_amount=$1, updated_at=NOW() WHERE id=$2', [total, order.id]);

    await client.query('COMMIT');

    order.total_amount = total;
    return res.status(201).json(order);
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Create sales order error:', err);
    if (err.code === '23502') { // not-null violation
      return res.status(400).json({ error: 'Missing required DB field', detail: err.message });
    }
    return res.status(500).json({ error: 'Failed to create sales order', detail: err.message });
  } finally {
    client.release();
  }
});


selling.put('/sales-orders/:id', verifyToken, async (req,res)=>{
  const { id } = req.params;
  const { so_number, order_date, delivery_date, notes, status } = req.body;
  await q(res,
    `UPDATE sales_orders SET so_number=$1,order_date=$2,delivery_date=$3,notes=$4,status=$5,updated_at=NOW()
     WHERE id=$6 RETURNING *`,
    [so_number, order_date, delivery_date||null, notes||null, status, id],
    true
  );
});

selling.delete('/sales-orders/:id', verifyToken, async (req,res)=>{
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM sales_order_items WHERE sales_order_id=$1',[req.params.id]);
    await client.query('DELETE FROM sales_orders WHERE id=$1',[req.params.id]);
    await client.query('COMMIT');
    res.json({ message:'Deleted' });
  } catch(e){
    await client.query('ROLLBACK');
    console.error('Delete sales order:', e.message);
    res.status(500).json({ error:'Failed to delete sales order' });
  } finally {
    client.release();
  }
});

/* ------------------------------------------------------------------
   BUYING MODULE
   suppliers(id,name,contact_person,email,phone,address,status,created_at,updated_at)
   purchase_orders(id,supplier_id,po_number,order_date,delivery_date,notes,status,total_amount,created_at,updated_at)
   purchase_order_items(id,purchase_order_id,product_name,sku,quantity,unit_price,total_price,received_quantity,created_at)
------------------------------------------------------------------- */
const buying = express.Router();

/* Suppliers */
/* ---------------------- SUPPLIERS ROUTES (improved) ---------------------- */
buying.get('/suppliers', verifyToken, async (req, res) => {
  try {
    // show debug info quickly (remove in production)
    console.log('GET /api/buying/suppliers - user from token:', req.user);

    const company_id = req.user?.company_id || req.user?.companyId;
    if (!company_id) {
      return res.status(400).json({ error: 'Missing company_id in token (check JWT payload)' });
    }

    const result = await pool.query(
      'SELECT * FROM suppliers WHERE company_id = $1 ORDER BY created_at DESC',
      [company_id]
    );
    return res.json(result.rows);
  } catch (err) {
    console.error('Get suppliers error:', err);
    return res.status(500).json({ error: 'Failed to fetch suppliers', detail: err.message });
  }
});

buying.post('/suppliers', verifyToken, async (req, res) => {
  try {
    console.log('POST /api/buying/suppliers - req.user:', req.user, 'body:', req.body);

    const company_id = req.user?.company_id || req.user?.companyId;
    if (!company_id) {
      return res.status(400).json({ error: 'Missing company_id in token (check JWT payload)' });
    }

    const { name, contact_person, email, phone, address, status = 'active' } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name required' });
    }

    const insertSql = `
      INSERT INTO suppliers (
        company_id, name, contact_person, email, phone, address, status, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW())
      RETURNING *;
    `;

    const values = [
      company_id,
      name.trim(),
      contact_person ? contact_person.trim() : null,
      email ? email.trim() : null,
      phone ? phone.trim() : null,
      address ? address.trim() : null,
      status
    ];

    const result = await pool.query(insertSql, values);
    return res.status(201).json(result.rows[0]);
  } catch (err) {
    // Better error output for debugging
    console.error('Create supplier error:', err);
    // If DB constraint, send meaningful message
    if (err.code === '23502') {
      return res.status(400).json({ error: 'Missing required DB field', detail: err.message });
    }
    return res.status(500).json({ error: 'Failed to create supplier', detail: err.message });
  }
});

buying.put('/suppliers/:id', verifyToken, async (req,res)=>{
  const { id } = req.params;
  const { name, contact_person, email, phone, address, status } = req.body;
  await q(res,
    `UPDATE suppliers SET name=$1,contact_person=$2,email=$3,phone=$4,address=$5,status=$6,updated_at=NOW()
     WHERE id=$7 RETURNING *`,
    [name, contact_person||null, email||null, phone||null, address||null, status, id],
    true
  );
});
buying.delete('/suppliers/:id', verifyToken, async (req,res)=>{
  try {
    await pool.query('DELETE FROM suppliers WHERE id=$1',[req.params.id]);
    res.json({ message:'Deleted' });
  } catch(e){
    console.error('Delete supplier:', e.message);
    res.status(500).json({ error:'Failed to delete supplier' });
  }
});

/* Purchase Orders */
buying.get('/purchase-orders', async (_ ,res)=>{
  await q(res,'SELECT * FROM purchase_orders ORDER BY created_at DESC');
});
buying.get('/purchase-orders/:id/items', async (req,res)=>{
  await q(res,'SELECT * FROM purchase_order_items WHERE purchase_order_id=$1 ORDER BY id ASC',[req.params.id]);
});
buying.post('/purchase-orders', verifyToken, async (req,res)=>{
  const { supplier_id, po_number, order_date, delivery_date, notes, status='pending', items=[] } = req.body;
  if (!supplier_id || !po_number || !order_date)
    return res.status(400).json({ error:'supplier_id, po_number, order_date required' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const poRes = await client.query(
      `INSERT INTO purchase_orders (supplier_id,po_number,order_date,delivery_date,notes,status,total_amount,created_at,updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW()) RETURNING *`,
      [supplier_id, po_number, order_date, delivery_date||null, notes||null, status, 0]
    );
    const po = poRes.rows[0];
    let total=0;
    for (const it of items){
      const qty = parseInt(it.quantity)||0;
      const price = parseFloat(it.unit_price)||0;
      const line = qty*price;
      total += line;
      await client.query(
        `INSERT INTO purchase_order_items
         (purchase_order_id,product_name,sku,quantity,unit_price,total_price,received_quantity,created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,NOW())`,
        [po.id, it.product_name||'Item', it.sku||null, qty, price, line, it.received_quantity||0]
      );
    }
    await client.query('UPDATE purchase_orders SET total_amount=$1,updated_at=NOW() WHERE id=$2',[total, po.id]);
    await client.query('COMMIT');
    po.total_amount = total;
    res.status(201).json(po);
  } catch(e){
    await client.query('ROLLBACK');
    console.error('Create purchase order:', e.message);
    res.status(500).json({ error:'Failed to create purchase order' });
  } finally {
    client.release();
  }
});
buying.put('/purchase-orders/:id', verifyToken, async (req,res)=>{
  const { id } = req.params;
  const { po_number, order_date, delivery_date, notes, status } = req.body;
  await q(res,
    `UPDATE purchase_orders SET po_number=$1,order_date=$2,delivery_date=$3,notes=$4,status=$5,updated_at=NOW()
     WHERE id=$6 RETURNING *`,
    [po_number, order_date, delivery_date||null, notes||null, status, id],
    true
  );
});
buying.delete('/purchase-orders/:id', verifyToken, async (req,res)=>{
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM purchase_order_items WHERE purchase_order_id=$1',[req.params.id]);
    await client.query('DELETE FROM purchase_orders WHERE id=$1',[req.params.id]);
    await client.query('COMMIT');
    res.json({ message:'Deleted' });
  } catch(e){
    await client.query('ROLLBACK');
    console.error('Delete purchase order:', e.message);
    res.status(500).json({ error:'Failed to delete purchase order' });
  } finally {
    client.release();
  }
});

/* ------------------------------------------------------------------
   ASSETS MODULE (assets table with full fields)
------------------------------------------------------------------- */
// assets router - replace your current assets router with this
const assets = express.Router();

/**
 * Helper to generate an asset_code when not provided.
 * Format: AST-<companyId>-<timestamp>-<4random>
 */
const generateAssetCode = (companyId = '') => {
  const rnd = Math.floor(Math.random() * 9000) + 1000; // 4-digit random
  const ts = Date.now();
  return `AST-${companyId || 'X'}-${ts}-${rnd}`;
};

assets.get('/', async (req, res) => {
  const { company_id } = req.query;
  if (company_id) {
    await q(res, 'SELECT * FROM assets WHERE company_id=$1 ORDER BY created_at DESC', [company_id]);
  } else {
    await q(res, 'SELECT * FROM assets ORDER BY created_at DESC');
  }
});

assets.post('/', verifyToken, async (req, res) => {
  // Prefer company_id from body, fallback to authenticated user's company
  const bodyCompanyId = req.body.company_id;
  const authCompanyId = req.user?.company_id; // verifyToken attaches req.user
  const company_id = bodyCompanyId || authCompanyId;

  const {
    asset_code: incoming_code,
    name, category_id, description,
    purchase_date, purchase_cost, current_value,
    depreciation_method, useful_life_years, salvage_value,
    location, condition_status, assigned_to, serial_number,
    warranty_expiry, maintenance_due_date, status = 'active', notes
  } = req.body;

  // Required checks (company_id and name)
  if (!company_id) {
    return res.status(400).json({ error: 'company_id required (provide in body or ensure token has company)' });
  }
  if (!name) {
    return res.status(400).json({ error: 'name required' });
  }

  // Final asset_code (use provided or generate)
  const asset_code = (incoming_code && String(incoming_code).trim()) || generateAssetCode(company_id);

  try {
    await q(
      res,
      `INSERT INTO assets (
        company_id, asset_code, name, category_id, description,
        purchase_date, purchase_cost, current_value,
        depreciation_method, useful_life_years, salvage_value,
        location, condition_status, assigned_to, serial_number,
        warranty_expiry, maintenance_due_date, status, notes,
        created_at, updated_at
      ) VALUES (
        $1,$2,$3,$4,$5,
        $6,$7,$8,
        $9,$10,$11,
        $12,$13,$14,$15,
        $16,$17,$18,$19,
        NOW(),NOW()
      ) RETURNING *`,
      [
        company_id,
        asset_code,
        name,
        category_id || null,
        description || null,
        purchase_date || null,
        num(purchase_cost),
        num(current_value),
        depreciation_method || null,
        num(useful_life_years),
        num(salvage_value),
        location || null,
        condition_status || null,
        assigned_to || null,
        serial_number || null,
        warranty_expiry || null,
        maintenance_due_date || null,
        status,
        notes || null
      ],
      true
    );
  } catch (e) {
    // Log full error for debugging, return a friendly message
    console.error('Create asset:', e);
    // If postgres gives duplicate key on asset_code, you may want to retry generation — handle that if it occurs.
    res.status(500).json({ error: 'Failed to create asset' });
  }
});

assets.put('/:id', verifyToken, async (req, res) => {
  const {
    asset_code, name, category_id, description,
    purchase_date, purchase_cost, current_value,
    depreciation_method, useful_life_years, salvage_value,
    location, condition_status, assigned_to, serial_number,
    warranty_expiry, maintenance_due_date, status, notes
  } = req.body;

  await q(
    res,
    `UPDATE assets SET
      asset_code=$1, name=$2, category_id=$3, description=$4,
      purchase_date=$5, purchase_cost=$6, current_value=$7,
      depreciation_method=$8, useful_life_years=$9, salvage_value=$10,
      location=$11, condition_status=$12, assigned_to=$13, serial_number=$14,
      warranty_expiry=$15, maintenance_due_date=$16, status=$17, notes=$18,
      updated_at=NOW()
     WHERE id=$19 RETURNING *`,
    [
      asset_code || null,
      name,
      category_id || null,
      description || null,
      purchase_date || null,
      num(purchase_cost),
      num(current_value),
      depreciation_method || null,
      num(useful_life_years),
      num(salvage_value),
      location || null,
      condition_status || null,
      assigned_to || null,
      serial_number || null,
      warranty_expiry || null,
      maintenance_due_date || null,
      status,
      notes || null,
      req.params.id
    ],
    true
  );
});

assets.delete('/:id', verifyToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM assets WHERE id=$1', [req.params.id]);
    res.json({ message: 'Deleted' });
  } catch (e) {
    console.error('Delete asset:', e.message);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

module.exports = assets;


/* ------------------------------------------------------------------
   STOCKS (basic – adjust if you have richer schema)
------------------------------------------------------------------- */
app.get('/api/stocks', async (_ ,res)=>{
  await q(res,'SELECT * FROM stocks ORDER BY created_at DESC');
});

stocksRouter.get('/', verifyToken, async (req, res) => {
  try {
    const company_id = req.user?.company_id || req.user?.companyId;
    if (!company_id) return res.status(400).json({ error: 'Missing company_id in token' });
    const r = await pool.query('SELECT * FROM stocks WHERE company_id=$1 ORDER BY created_at DESC', [company_id]);
    res.json(r.rows);
  } catch (e) {
    console.error('Fetch stocks error:', e.message);
    res.status(500).json({ error: 'Failed to fetch stocks' });
  }
});

// CREATE
stocksRouter.post('/', verifyToken, async (req, res) => {
  try {
    const company_id = req.user?.company_id || req.user?.companyId;
    if (!company_id) return res.status(400).json({ error: 'Missing company_id in token' });

    const { name, symbol, quantity = 0, price = 0, location = null, min_stock = 0, max_stock = 0 } = req.body;
    if (!name || !symbol) return res.status(400).json({ error: 'name and symbol required' });

    const insert = await pool.query(
      `INSERT INTO stocks
        (company_id, name, symbol, quantity, price, location, min_stock, max_stock, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW()) RETURNING *`,
      [company_id, name, symbol, Number(quantity), Number(price), location || null, Number(min_stock), Number(max_stock)]
    );

    res.status(201).json(insert.rows[0]);
  } catch (err) {
    console.error('Create stock error:', err.message);
    if (err.code === '23502') return res.status(400).json({ error: 'Missing DB field', detail: err.message });
    res.status(500).json({ error: 'Failed to create stock', detail: err.message });
  }
});

// UPDATE
stocksRouter.put('/:id', verifyToken, async (req, res) => {
  try {
    const company_id = req.user?.company_id || req.user?.companyId;
    if (!company_id) return res.status(400).json({ error: 'Missing company_id in token' });

    const { id } = req.params;
    const { name, symbol, quantity, price, location, min_stock, max_stock } = req.body;

    const upd = await pool.query(
      `UPDATE stocks SET
         name=$1, symbol=$2, quantity=$3, price=$4, location=$5, min_stock=$6, max_stock=$7, updated_at=NOW()
       WHERE id=$8 AND company_id=$9 RETURNING *`,
      [name, symbol, Number(quantity), Number(price), location || null, Number(min_stock), Number(max_stock), id, company_id]
    );

    if (!upd.rows.length) return res.status(404).json({ error: 'Stock not found or not in your company' });
    res.json(upd.rows[0]);
  } catch (err) {
    console.error('Update stock error:', err.message);
    res.status(500).json({ error: 'Failed to update stock', detail: err.message });
  }
});

// DELETE
stocksRouter.delete('/:id', verifyToken, async (req, res) => {
  try {
    const company_id = req.user?.company_id || req.user?.companyId;
    if (!company_id) return res.status(400).json({ error: 'Missing company_id in token' });

    const { id } = req.params;
    await pool.query('DELETE FROM stocks WHERE id=$1 AND company_id=$2', [id, company_id]);
    res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete stock error:', err.message);
    res.status(500).json({ error: 'Failed to delete stock', detail: err.message });
  }
});

// mount
app.use('/api/stocks', stocksRouter);


// accounting router - place this near your other routers (selling/buying/assets)
const accounting = express.Router();

/*
  Table: accounting_entries
  Columns (as you have):
    id, company_id, type, amount, description, account_name, reference_number, created_at, updated_at
*/

// GET /api/accounting/:companyId  - returns array of entries for a company
accounting.get('/:companyId', verifyToken, async (req, res) => {
  try {
    const { companyId } = req.params;
    const authCompany = req.user?.company_id;
    if (!authCompany) return res.status(400).json({ error: 'Missing company in token' });

    // Prevent users reading other companies unless your auth policy allows it
    if (Number(companyId) !== Number(authCompany)) {
      return res.status(403).json({ error: 'Forbidden: company mismatch' });
    }

    const qres = await pool.query(
      'SELECT * FROM accounting_entries WHERE company_id=$1 ORDER BY created_at DESC',
      [companyId]
    );
    return res.json(qres.rows);
  } catch (err) {
    console.error('Fetch accounting entries error:', err);
    return res.status(500).json({ error: 'Failed to fetch accounting entries', detail: err.message });
  }
});

// POST /api/accounting  - create entry (body may include company_id or uses token)
accounting.post('/', verifyToken, async (req, res) => {
  try {
    const authCompany = req.user?.company_id;
    if (!authCompany) return res.status(400).json({ error: 'Missing company in token' });

    const { company_id, type, amount, description, account_name, reference_number } = req.body;
    const companyId = company_id || authCompany;

    if (!type || (amount === undefined || amount === null) || !description) {
      return res.status(400).json({ error: 'type, amount and description are required' });
    }

    const insert = await pool.query(
      `INSERT INTO accounting_entries
        (company_id, user_id, type, amount, description, account_name, reference_number, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW(),NOW()) RETURNING *`,
      [companyId, req.user?.id || null, type, Number(amount), description, account_name || null, reference_number || null]
    );

    return res.status(201).json(insert.rows[0]);
  } catch (err) {
    console.error('Create accounting entry error:', err);
    if (err.code === '23502') return res.status(400).json({ error: 'Missing DB field', detail: err.message });
    return res.status(500).json({ error: 'Failed to create accounting entry', detail: err.message });
  }
});

// PUT /api/accounting/entries/:id  - update entry (must belong to same company)
accounting.put('/entries/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { type, amount, description, account_name, reference_number } = req.body;
    const authCompany = req.user?.company_id;
    if (!authCompany) return res.status(400).json({ error: 'Missing company in token' });

    const upd = await pool.query(
      `UPDATE accounting_entries SET
         type=$1, amount=$2, description=$3, account_name=$4, reference_number=$5, updated_at=NOW()
       WHERE id=$6 AND company_id=$7 RETURNING *`,
      [type, Number(amount), description, account_name || null, reference_number || null, id, authCompany]
    );

    if (!upd.rows.length) return res.status(404).json({ error: 'Entry not found or not allowed' });
    return res.json(upd.rows[0]);
  } catch (err) {
    console.error('Update accounting entry error:', err);
    return res.status(500).json({ error: 'Failed to update accounting entry', detail: err.message });
  }
});

// DELETE /api/accounting/entries/:id
accounting.delete('/entries/:id', verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    const authCompany = req.user?.company_id;
    if (!authCompany) return res.status(400).json({ error: 'Missing company in token' });

    const del = await pool.query('DELETE FROM accounting_entries WHERE id=$1 AND company_id=$2 RETURNING *', [id, authCompany]);
    if (!del.rows.length) return res.status(404).json({ error: 'Entry not found or not allowed' });
    return res.json({ message: 'Deleted' });
  } catch (err) {
    console.error('Delete accounting entry error:', err);
    return res.status(500).json({ error: 'Failed to delete accounting entry', detail: err.message });
  }
});

// Mount router
app.use('/api/accounting', accounting);


/* ------------------------------------------------------------------
   ANALYTICS (live, no static data)
------------------------------------------------------------------- */
app.get('/api/analytics/buying', async (_ ,res)=>{
  await q(res,
    `SELECT id,po_number,order_date,status,total_amount,created_at
     FROM purchase_orders ORDER BY created_at DESC`
  );
});
app.get('/api/analytics/selling', async (_ ,res)=>{
  await q(res,
    `SELECT id,so_number,order_date,status,total_amount,created_at
     FROM sales_orders ORDER BY created_at DESC`
  );
});
app.get('/api/analytics/assets', async (_ ,res)=>{
  await q(res,
    `SELECT id,name,current_value,purchase_cost,status,purchase_date,created_at
     FROM assets ORDER BY created_at DESC`
  );
});
app.get('/api/analytics/stocks', async (_ ,res)=>{
  await q(res,
    `SELECT id,name,symbol,price,quantity,created_at
     FROM stocks ORDER BY created_at DESC`
  );
});

// Dashboard summary (aggregated metrics)
app.get('/api/analytics/dashboard', async (_ ,res)=>{
  try {
    const [
      salesAgg,
      purchaseAgg,
      assetsAgg,
      stockAgg,
      recentEvents
    ] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS sales_count,
                         COALESCE(SUM(total_amount),0)::numeric AS sales_total
                  FROM sales_orders`),
      pool.query(`SELECT COUNT(*)::int AS purchase_count,
                         COALESCE(SUM(total_amount),0)::numeric AS purchase_total
                  FROM purchase_orders`),
      pool.query(`SELECT COUNT(*)::int AS asset_count,
                         COALESCE(SUM(current_value),0)::numeric AS assets_value
                  FROM assets`),
      pool.query(`SELECT COUNT(*)::int AS stock_count,
                         COALESCE(SUM(price*quantity),0)::numeric AS stock_value
                  FROM stocks`),
      pool.query(`
        SELECT 'sale' AS type, id, created_at FROM sales_orders
        UNION ALL
        SELECT 'purchase' AS type, id, created_at FROM purchase_orders
        UNION ALL
        SELECT 'asset' AS type, id, created_at FROM assets
        ORDER BY created_at DESC
        LIMIT 25
      `)
    ]);

    res.json({
      summary: {
        total_sales_orders: salesAgg.rows[0].sales_count,
        total_sales_revenue: salesAgg.rows[0].sales_total,
        total_purchase_orders: purchaseAgg.rows[0].purchase_count,
        total_purchase_spent: purchaseAgg.rows[0].purchase_total,
        total_assets: assetsAgg.rows[0].asset_count,
        total_assets_value: assetsAgg.rows[0].assets_value,
        total_stock_items: stockAgg.rows[0].stock_count,
        total_stock_value: stockAgg.rows[0].stock_value,
        computed_revenue: Number(salesAgg.rows[0].sales_total) - Number(purchaseAgg.rows[0].purchase_total)
      },
      recent: recentEvents.rows
    });
  } catch(e){
    console.error('Dashboard analytics error:', e.message);
    res.status(500).json({ error:'Failed to compute dashboard analytics' });
  }
});

/* ---------------- Mount Routers ---------------- */
app.use('/api/selling', selling);
app.use('/api/buying', buying);
app.use('/api/assets', assets);

/*------------------Voice Router------------------ */
const voiceRouter = require('./routes/voice'); // adjust path if needed
app.use('/api/voice', voiceRouter);

/* ---------------- Error Handling ---------------- */
app.use((err,req,res,next)=>{
  console.error('Unhandled error:', err);
  res.status(500).json({ error:'Internal server error' });
});

app.use((req,res)=> res.status(404).json({ error:'Route not found' }));

/* ---------------- Start ---------------- */
const PORT = process.env.PORT || 5000;
app.listen(PORT, ()=> console.log(`🚀 Server running on http://localhost:${PORT}`));



