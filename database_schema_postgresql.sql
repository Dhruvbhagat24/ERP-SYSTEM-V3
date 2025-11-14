-- ERP System Database Schema for PostgreSQL
-- Execute these queries in your PostgreSQL database

-- ============================================
-- 1. SUPPLIERS TABLE (for Buying module)
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    tax_id VARCHAR(100),
    payment_terms VARCHAR(100) DEFAULT '30 days',
    credit_limit DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 2. PURCHASE_ORDERS TABLE (for Buying module)
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- ============================================
-- 3. PURCHASE_ORDER_ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    received_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
);

-- ============================================
-- 4. CUSTOMERS TABLE (for Selling module)
-- ============================================
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    customer_type VARCHAR(50) DEFAULT 'individual',
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    tax_id VARCHAR(100),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_terms VARCHAR(100) DEFAULT '30 days',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 5. SALES_ORDERS TABLE (for Selling module)
-- ============================================
CREATE TABLE IF NOT EXISTS sales_orders (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    so_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INTEGER NOT NULL,
    order_date DATE NOT NULL,
    delivery_date DATE,
    status VARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2) DEFAULT 0,
    payment_status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ============================================
-- 6. SALES_ORDER_ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales_order_items (
    id SERIAL PRIMARY KEY,
    sales_order_id INTEGER NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    shipped_quantity INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE
);

-- ============================================
-- 7. ASSET_CATEGORIES TABLE (for Assets module)
-- ============================================
CREATE TABLE IF NOT EXISTS asset_categories (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    depreciation_rate DECIMAL(5,2) DEFAULT 0,
    useful_life_years INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 8. ASSETS TABLE (for Assets module)
-- ============================================
CREATE TABLE IF NOT EXISTS assets (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    asset_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category_id INTEGER,
    description VARCHAR(500),
    purchase_date DATE NOT NULL,
    purchase_cost DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2),
    depreciation_method VARCHAR(50) DEFAULT 'straight_line',
    useful_life_years INTEGER DEFAULT 5,
    salvage_value DECIMAL(15,2) DEFAULT 0,
    location VARCHAR(255),
    condition_status VARCHAR(50) DEFAULT 'good',
    assigned_to VARCHAR(255),
    serial_number VARCHAR(255),
    warranty_expiry DATE,
    maintenance_due_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES asset_categories(id)
);

-- ============================================
-- 9. ASSET_MAINTENANCE TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS asset_maintenance (
    id SERIAL PRIMARY KEY,
    asset_id INTEGER NOT NULL,
    maintenance_type VARCHAR(100) NOT NULL,
    maintenance_date DATE NOT NULL,
    cost DECIMAL(15,2) DEFAULT 0,
    vendor VARCHAR(255),
    description TEXT,
    next_maintenance_date DATE,
    performed_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- ============================================
-- 10. ACCOUNTING_ENTRIES TABLE (for Accounting module)
-- ============================================
CREATE TABLE IF NOT EXISTS accounting_entries (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    account_name VARCHAR(100),
    reference_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 11. INSERT SAMPLE DATA
-- ============================================

-- Sample Suppliers (using company_id = 1 since your system shows that)
INSERT INTO suppliers (company_id, name, contact_person, email, phone, address, city, state, country, postal_code, payment_terms, credit_limit) VALUES
(1, 'Apple Inc.', 'Tim Cook', 'procurement@apple.com', '+1-408-996-1010', '1 Apple Park Way', 'Cupertino', 'California', 'USA', '95014', '30 days', 1000000.00),
(1, 'Samsung Electronics', 'Jong-Hee Han', 'business@samsung.com', '+82-2-2255-0114', '129 Samsung-ro', 'Seoul', 'Seoul', 'South Korea', '06765', '45 days', 800000.00),
(1, 'Dell Technologies', 'Michael Dell', 'orders@dell.com', '+1-512-338-4400', '1 Dell Way', 'Round Rock', 'Texas', 'USA', '78682', '30 days', 500000.00)
ON CONFLICT DO NOTHING;

-- Sample Customers
INSERT INTO customers (company_id, name, customer_type, contact_person, email, phone, address, city, state, country, postal_code, credit_limit) VALUES
(1, 'Tech Solutions Ltd', 'business', 'John Smith', 'john@techsolutions.com', '+91-9876543210', '123 Business Park', 'Mumbai', 'Maharashtra', 'India', '400001', 500000.00),
(1, 'Global Retail Chain', 'business', 'Sarah Johnson', 'sarah@globalretail.com', '+91-9876543211', '456 Retail Avenue', 'Delhi', 'Delhi', 'India', '110001', 1000000.00),
(1, 'Local Electronics Store', 'retail', 'Raj Patel', 'raj@localelectronics.com', '+91-9876543212', '789 Market Street', 'Bangalore', 'Karnataka', 'India', '560001', 100000.00)
ON CONFLICT DO NOTHING;

-- Sample Asset Categories
INSERT INTO asset_categories (company_id, name, description, depreciation_rate, useful_life_years) VALUES
(1, 'Computer Equipment', 'Laptops, Desktops, Servers', 20.00, 5),
(1, 'Office Furniture', 'Desks, Chairs, Cabinets', 10.00, 10),
(1, 'Vehicles', 'Cars, Trucks, Delivery Vehicles', 15.00, 7),
(1, 'Machinery', 'Manufacturing and Production Equipment', 12.50, 8)
ON CONFLICT DO NOTHING;

-- Sample Assets
INSERT INTO assets (company_id, asset_code, name, category_id, description, purchase_date, purchase_cost, current_value, location, condition_status, serial_number) VALUES
(1, 'COMP-001', 'Dell OptiPlex 7090', 1, 'Desktop Computer for Office Use', '2024-01-15', 75000.00, 60000.00, 'Office Floor 1', 'good', 'DL7090001'),
(1, 'FURN-001', 'Executive Office Desk', 2, 'Wooden Executive Desk with Drawers', '2024-02-01', 25000.00, 22500.00, 'Manager Office', 'excellent', 'DESK001'),
(1, 'VEH-001', 'Honda City Delivery Vehicle', 3, 'Compact Car for Local Deliveries', '2024-03-10', 1200000.00, 1020000.00, 'Parking Lot A', 'good', 'HC2024001')
ON CONFLICT DO NOTHING;

-- Sample Purchase Orders
INSERT INTO purchase_orders (company_id, po_number, supplier_id, order_date, expected_delivery_date, status, total_amount, tax_amount, final_amount, notes) VALUES
(1, 'PO-2024-001', 1, '2024-10-01', '2024-10-15', 'pending', 500000.00, 90000.00, 590000.00, 'Bulk order for Q4 inventory'),
(1, 'PO-2024-002', 2, '2024-10-02', '2024-10-20', 'approved', 300000.00, 54000.00, 354000.00, 'Monthly smartphone order')
ON CONFLICT DO NOTHING;

-- Sample Sales Orders
INSERT INTO sales_orders (company_id, so_number, customer_id, order_date, delivery_date, status, total_amount, tax_amount, final_amount, payment_status, notes) VALUES
(1, 'SO-2024-001', 1, '2024-10-01', '2024-10-10', 'processing', 250000.00, 45000.00, 295000.00, 'pending', 'Corporate bulk order'),
(1, 'SO-2024-002', 2, '2024-10-02', '2024-10-12', 'confirmed', 800000.00, 144000.00, 944000.00, 'partial', 'Large retail chain order')
ON CONFLICT DO NOTHING;

-- Sample Accounting Entries
INSERT INTO accounting_entries (company_id, type, amount, description, account_name, reference_number) VALUES
(1, 'credit', 150000.00, 'Monthly sales revenue', 'Revenue', 'REV-2024-10-001'),
(1, 'debit', 25000.00, 'Office rent payment', 'Office Rent', 'RENT-2024-10'),
(1, 'credit', 75000.00, 'Product sales', 'Sales Revenue', 'SALE-2024-10-001'),
(1, 'debit', 15000.00, 'Electricity bill', 'Utilities', 'UTIL-2024-10'),
ON CONFLICT DO NOTHING;

-- Drop the existing table and recreate with correct structure
DROP TABLE IF EXISTS accounting_entries;

CREATE TABLE accounting_entries (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('credit', 'debit')),
    amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL,
    account_name VARCHAR(100),
    reference_number VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_accounting_entries_company_id ON accounting_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_type ON accounting_entries(type);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_created_at ON accounting_entries(created_at);

-- Insert sample data
INSERT INTO accounting_entries (company_id, type, amount, description, account_name, reference_number) VALUES
(1, 'credit', 150000.00, 'Monthly sales revenue', 'Revenue', 'REV-2024-10-001'),
(1, 'debit', 25000.00, 'Office rent payment', 'Office Rent', 'RENT-2024-10'),
(1, 'credit', 75000.00, 'Product sales', 'Sales Revenue', 'SALE-2024-10-001'),
(1, 'debit', 15000.00, 'Electricity bill', 'Utilities', 'UTIL-2024-10');

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_suppliers_company_id ON suppliers(company_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_company_id ON purchase_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_customers_company_id ON customers(company_id);
CREATE INDEX IF NOT EXISTS idx_sales_orders_company_id ON sales_orders(company_id);
CREATE INDEX IF NOT EXISTS idx_assets_company_id ON assets(company_id);
CREATE INDEX IF NOT EXISTS idx_asset_categories_company_id ON asset_categories(company_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_company_id ON accounting_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_type ON accounting_entries(type);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_created_at ON accounting_entries(created_at);

-- Success message
SELECT 'Database schema created successfully with sample data!' as message;