// server/routes/voice.js
const express = require('express');
const router = express.Router();
const pool = require('../db'); // same db file you're using in index.js
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

/**
 * Simple helper to try decode a Bearer token and return user info from DB.
 * If token missing or invalid, returns null.
 */
async function getUserFromAuthHeader(req) {
  try {
    const auth = req.headers.authorization;
    if (!auth) return null;
    const token = auth.split(' ')[1];
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    const userRes = await pool.query('SELECT id,name,email,role,company_id FROM users WHERE id=$1', [decoded.id]);
    if (!userRes.rows.length) return null;
    return userRes.rows[0];
  } catch (e) {
    return null;
  }
}

/**
 * Very small parser for commands:
 * - add supplier name <name> phone <phone> email <email> address <address>
 * - add customer name <name> phone <phone> email <email> address <address>
 * - add asset name <name> location <location> purchase_cost <num> current_value <num>
 *
 * Parser returns { module, action, fields, missing, ready }
 */
function parseCommand(text) {
  const lower = (text || '').trim();

  // Basic token-based key extraction using regex for common fields
  const extract = (key) => {
    // match "key <value>" until next known key or end
    const re = new RegExp(`${key}\\s+([^\\n]+?)(?=\\s+(name|phone|email|address|location|purchase_cost|current_value|quantity|so_number|order_date|items)\\s+|$)`, 'i');
    const m = lower.match(re);
    return m ? m[1].trim() : null;
  };

  // Try detect intent
  if (/add\s+supplier/i.test(lower) || /create\s+supplier/i.test(lower)) {
    const name = extract('name') || extract('supplier name') || null;
    const phone = extract('phone') || null;
    const email = extract('email') || null;
    const address = extract('address') || null;
    const fields = { name, phone, email, address };
    const missing = {};
    if (!name) missing.name = true;
    return { module: 'buying.suppliers', action: 'create', fields, missing, ready: !Object.keys(missing).length };
  }

  if (/add\s+customer|create\s+customer/i.test(lower)) {
    const name = extract('name') || null;
    const phone = extract('phone') || null;
    const email = extract('email') || null;
    const address = extract('address') || null;
    const fields = { name, phone, email, address };
    const missing = {};
    if (!name) missing.name = true;
    return { module: 'selling.customers', action: 'create', fields, missing, ready: !Object.keys(missing).length };
  }

  if (/add\s+asset|create\s+asset/i.test(lower)) {
    const name = extract('name') || null;
    const location = extract('location') || null;
    const purchase_cost_raw = extract('purchase_cost') || extract('cost') || null;
    const purchase_cost = purchase_cost_raw ? Number(purchase_cost_raw.replace(/[^\d.]/g, '')) : null;
    const current_value_raw = extract('current_value') || null;
    const current_value = current_value_raw ? Number(current_value_raw.replace(/[^\d.]/g, '')) : null;
    const fields = { name, location, purchase_cost, current_value };
    const missing = {};
    if (!name) missing.name = true;
    return { module: 'assets', action: 'create', fields, missing, ready: !Object.keys(missing).length };
  }

  // fallback
  return { module: 'unknown', action: 'unknown', fields: {}, missing: { unknown: true }, ready: false };
}

/**
 * POST /api/voice/parse
 * Body: { text: "..." , company_id?: number (optional, used if no token) }
 */
router.post('/parse', async (req, res) => {
  try {
    const { text, company_id } = req.body || {};
    if (!text || !text.trim()) return res.status(400).json({ error: 'text is required in body' });

    // parse command
    const parsed = parseCommand(text);

    // If parsed.ready true, attempt to execute action (insert into DB)
    let result = { ...parsed };

    // Attempt to identify user/company (token preferred)
    const user = await getUserFromAuthHeader(req);
    const companyId = user?.company_id || company_id || null;

    if (parsed.ready) {
      if (parsed.module === 'buying.suppliers' && parsed.action === 'create') {
        if (!companyId) {
          // can't create without company
          result.exec = { ok: false, error: 'company_id required in body or provide Authorization token' };
        } else {
          const { name, phone, email, address } = parsed.fields;
          // Minimal validation
          if (!name) {
            result.exec = { ok: false, error: 'name required' };
          } else {
            // Insert supplier directly into DB
            const insert = await pool.query(
              `INSERT INTO suppliers (company_id, name, contact_person, email, phone, address, status, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,'active',NOW(),NOW()) RETURNING *`,
              [companyId, name, null, email || null, phone || null, address || null]
            );
            result.exec = { ok: true, created: insert.rows[0] };
          }
        }
      } else if (parsed.module === 'selling.customers' && parsed.action === 'create') {
        if (!companyId) {
          result.exec = { ok: false, error: 'company_id required in body or provide Authorization token' };
        } else {
          const { name, phone, email, address } = parsed.fields;
          if (!name) {
            result.exec = { ok: false, error: 'name required' };
          } else {
            const insert = await pool.query(
              `INSERT INTO customers (name, contact_person, email, phone, address, status, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,'active',NOW(),NOW()) RETURNING *`,
              [name, null, email || null, phone || null, address || null]
            );
            result.exec = { ok: true, created: insert.rows[0] };
          }
        }
      } else if (parsed.module === 'assets' && parsed.action === 'create') {
        if (!companyId) {
          result.exec = { ok: false, error: 'company_id required in body or provide Authorization token' };
        } else {
          const { name, location, purchase_cost, current_value } = parsed.fields;
          if (!name) {
            result.exec = { ok: false, error: 'name required' };
          } else {
            const asset_code = `AST-${companyId}-${Date.now()}-${Math.floor(Math.random()*9000)+1000}`;
            const insert = await pool.query(
              `INSERT INTO assets (company_id, asset_code, name, location, purchase_cost, current_value, status, created_at, updated_at)
               VALUES ($1,$2,$3,$4,$5,$6,'active',NOW(),NOW()) RETURNING *`,
              [companyId, asset_code, name, location || null, purchase_cost || null, current_value || null]
            );
            result.exec = { ok: true, created: insert.rows[0] };
          }
        }
      } else {
        result.exec = { ok: false, error: 'Unsupported module/action' };
      }
    }

    return res.json(result);
  } catch (err) {
    console.error('Voice parse error:', err);
    return res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

module.exports = router;
