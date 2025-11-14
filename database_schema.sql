-- ERP System Database Schema for Buying, Selling, and Assets
-- Execute these queries in SQL Server Management Studio (SSMS)

-- ============================================
-- 1. SUPPLIERS TABLE (for Buying module)
-- ============================================
CREATE TABLE suppliers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    company_id INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    contact_person NVARCHAR(255),
    email NVARCHAR(255),
    phone NVARCHAR(50),
    address NVARCHAR(500),
    city NVARCHAR(100),
    state NVARCHAR(100),
    country NVARCHAR(100),
    postal_code NVARCHAR(20),
    tax_id NVARCHAR(100),
    payment_terms NVARCHAR(100) DEFAULT '30 days',
    credit_limit DECIMAL(15,2) DEFAULT 0,
    status NVARCHAR(20) DEFAULT 'active',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================
-- 2. PURCHASE_ORDERS TABLE (for Buying module)
-- ============================================
CREATE TABLE purchase_orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    company_id INT NOT NULL,
    po_number NVARCHAR(50) UNIQUE NOT NULL,
    supplier_id INT NOT NULL,
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    status NVARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2) DEFAULT 0,
    notes NVARCHAR(1000),
    created_by INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- ============================================
-- 3. PURCHASE_ORDER_ITEMS TABLE
-- ============================================
CREATE TABLE purchase_order_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    purchase_order_id INT NOT NULL,
    product_name NVARCHAR(255) NOT NULL,
    sku NVARCHAR(100),
    quantity INT NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    received_quantity INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE
);

-- ============================================
-- 4. CUSTOMERS TABLE (for Selling module)
-- ============================================
CREATE TABLE customers (
    id INT IDENTITY(1,1) PRIMARY KEY,
    company_id INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    customer_type NVARCHAR(50) DEFAULT 'individual',
    contact_person NVARCHAR(255),
    email NVARCHAR(255),
    phone NVARCHAR(50),
    address NVARCHAR(500),
    city NVARCHAR(100),
    state NVARCHAR(100),
    country NVARCHAR(100),
    postal_code NVARCHAR(20),
    tax_id NVARCHAR(100),
    credit_limit DECIMAL(15,2) DEFAULT 0,
    payment_terms NVARCHAR(100) DEFAULT '30 days',
    status NVARCHAR(20) DEFAULT 'active',
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================
-- 5. SALES_ORDERS TABLE (for Selling module)
-- ============================================
CREATE TABLE sales_orders (
    id INT IDENTITY(1,1) PRIMARY KEY,
    company_id INT NOT NULL,
    so_number NVARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    order_date DATE NOT NULL,
    delivery_date DATE,
    status NVARCHAR(20) DEFAULT 'pending',
    total_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    final_amount DECIMAL(15,2) DEFAULT 0,
    payment_status NVARCHAR(20) DEFAULT 'pending',
    notes NVARCHAR(1000),
    created_by INT,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- ============================================
-- 6. SALES_ORDER_ITEMS TABLE
-- ============================================
CREATE TABLE sales_order_items (
    id INT IDENTITY(1,1) PRIMARY KEY,
    sales_order_id INT NOT NULL,
    product_name NVARCHAR(255) NOT NULL,
    sku NVARCHAR(100),
    quantity INT NOT NULL,
    unit_price DECIMAL(15,2) NOT NULL,
    total_price DECIMAL(15,2) NOT NULL,
    shipped_quantity INT DEFAULT 0,
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (sales_order_id) REFERENCES sales_orders(id) ON DELETE CASCADE
);

-- ============================================
-- 7. ASSET_CATEGORIES TABLE (for Assets module)
-- ============================================
CREATE TABLE asset_categories (
    id INT IDENTITY(1,1) PRIMARY KEY,
    company_id INT NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description NVARCHAR(500),
    depreciation_rate DECIMAL(5,2) DEFAULT 0,
    useful_life_years INT DEFAULT 5,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- ============================================
-- 8. ASSETS TABLE (for Assets module)
-- ============================================
CREATE TABLE assets (
    id INT IDENTITY(1,1) PRIMARY KEY,
    company_id INT NOT NULL,
    asset_code NVARCHAR(50) UNIQUE NOT NULL,
    name NVARCHAR(255) NOT NULL,
    category_id INT,
    description NVARCHAR(500),
    purchase_date DATE NOT NULL,
    purchase_cost DECIMAL(15,2) NOT NULL,
    current_value DECIMAL(15,2),
    depreciation_method NVARCHAR(50) DEFAULT 'straight_line',
    useful_life_years INT DEFAULT 5,
    salvage_value DECIMAL(15,2) DEFAULT 0,
    location NVARCHAR(255),
    condition_status NVARCHAR(50) DEFAULT 'good',
    assigned_to NVARCHAR(255),
    serial_number NVARCHAR(255),
    warranty_expiry DATE,
    maintenance_due_date DATE,
    status NVARCHAR(20) DEFAULT 'active',
    notes NVARCHAR(1000),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (category_id) REFERENCES asset_categories(id)
);

-- ============================================
-- 9. ASSET_MAINTENANCE TABLE
-- ============================================
CREATE TABLE asset_maintenance (
    id INT IDENTITY(1,1) PRIMARY KEY,
    asset_id INT NOT NULL,
    maintenance_type NVARCHAR(100) NOT NULL,
    maintenance_date DATE NOT NULL,
    cost DECIMAL(15,2) DEFAULT 0,
    vendor NVARCHAR(255),
    description NVARCHAR(1000),
    next_maintenance_date DATE,
    performed_by NVARCHAR(255),
    created_at DATETIME2 DEFAULT GETDATE(),
    FOREIGN KEY (asset_id) REFERENCES assets(id) ON DELETE CASCADE
);

-- ============================================
-- 10. INSERT SAMPLE DATA
-- ============================================

-- Sample Suppliers
INSERT INTO suppliers (company_id, name, contact_person, email, phone, address, city, state, country, postal_code, payment_terms, credit_limit) VALUES
(16, 'Apple Inc.', 'Tim Cook', 'procurement@apple.com', '+1-408-996-1010', '1 Apple Park Way', 'Cupertino', 'California', 'USA', '95014', '30 days', 1000000.00),
(16, 'Samsung Electronics', 'Jong-Hee Han', 'business@samsung.com', '+82-2-2255-0114', '129 Samsung-ro', 'Seoul', 'Seoul', 'South Korea', '06765', '45 days', 800000.00),
(16, 'Dell Technologies', 'Michael Dell', 'orders@dell.com', '+1-512-338-4400', '1 Dell Way', 'Round Rock', 'Texas', 'USA', '78682', '30 days', 500000.00);

-- Sample Customers
INSERT INTO customers (company_id, name, customer_type, contact_person, email, phone, address, city, state, country, postal_code, credit_limit) VALUES
(16, 'Tech Solutions Ltd', 'business', 'John Smith', 'john@techsolutions.com', '+91-9876543210', '123 Business Park', 'Mumbai', 'Maharashtra', 'India', '400001', 500000.00),
(16, 'Global Retail Chain', 'business', 'Sarah Johnson', 'sarah@globalretail.com', '+91-9876543211', '456 Retail Avenue', 'Delhi', 'Delhi', 'India', '110001', 1000000.00),
(16, 'Local Electronics Store', 'retail', 'Raj Patel', 'raj@localelectronics.com', '+91-9876543212', '789 Market Street', 'Bangalore', 'Karnataka', 'India', '560001', 100000.00);

-- Sample Asset Categories
INSERT INTO asset_categories (company_id, name, description, depreciation_rate, useful_life_years) VALUES
(16, 'Computer Equipment', 'Laptops, Desktops, Servers', 20.00, 5),
(16, 'Office Furniture', 'Desks, Chairs, Cabinets', 10.00, 10),
(16, 'Vehicles', 'Cars, Trucks, Delivery Vehicles', 15.00, 7),
(16, 'Machinery', 'Manufacturing and Production Equipment', 12.50, 8);

-- Sample Assets
INSERT INTO assets (company_id, asset_code, name, category_id, description, purchase_date, purchase_cost, current_value, location, condition_status, serial_number) VALUES
(16, 'COMP-001', 'Dell OptiPlex 7090', 1, 'Desktop Computer for Office Use', '2024-01-15', 75000.00, 60000.00, 'Office Floor 1', 'good', 'DL7090001'),
(16, 'FURN-001', 'Executive Office Desk', 2, 'Wooden Executive Desk with Drawers', '2024-02-01', 25000.00, 22500.00, 'Manager Office', 'excellent', 'DESK001'),
(16, 'VEH-001', 'Honda City Delivery Vehicle', 3, 'Compact Car for Local Deliveries', '2024-03-10', 1200000.00, 1020000.00, 'Parking Lot A', 'good', 'HC2024001');

-- Sample Purchase Orders
INSERT INTO purchase_orders (company_id, po_number, supplier_id, order_date, expected_delivery_date, status, total_amount, tax_amount, final_amount, notes) VALUES
(16, 'PO-2024-001', 1, '2024-10-01', '2024-10-15', 'pending', 500000.00, 90000.00, 590000.00, 'Bulk order for Q4 inventory'),
(16, 'PO-2024-002', 2, '2024-10-02', '2024-10-20', 'approved', 300000.00, 54000.00, 354000.00, 'Monthly smartphone order');

-- Sample Sales Orders
INSERT INTO sales_orders (company_id, so_number, customer_id, order_date, delivery_date, status, total_amount, tax_amount, final_amount, payment_status, notes) VALUES
(16, 'SO-2024-001', 1, '2024-10-01', '2024-10-10', 'processing', 250000.00, 45000.00, 295000.00, 'pending', 'Corporate bulk order'),
(16, 'SO-2024-002', 2, '2024-10-02', '2024-10-12', 'confirmed', 800000.00, 144000.00, 944000.00, 'partial', 'Large retail chain order');

-- Create indexes for better performance
CREATE INDEX IX_suppliers_company_id ON suppliers(company_id);
CREATE INDEX IX_purchase_orders_company_id ON purchase_orders(company_id);
CREATE INDEX IX_customers_company_id ON customers(company_id);
CREATE INDEX IX_sales_orders_company_id ON sales_orders(company_id);
CREATE INDEX IX_assets_company_id ON assets(company_id);
CREATE INDEX IX_asset_categories_company_id ON asset_categories(company_id);

PRINT 'Database schema created successfully with sample data!';