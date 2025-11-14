-- Drop existing tables to start fresh
DROP TABLE IF EXISTS company_users CASCADE;
DROP TABLE IF EXISTS companies CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users Table (for both individual and company admin users)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type VARCHAR(50) DEFAULT 'individual', -- 'individual' or 'company_admin'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Companies Table
CREATE TABLE companies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    admin_user_id INTEGER NOT NULL,
    admin_email VARCHAR(255) NOT NULL, -- Store admin email for company login
    currency VARCHAR(10) DEFAULT 'USD',
    tax_id VARCHAR(100),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Company Users Relationship Table
CREATE TABLE company_users (
    id SERIAL PRIMARY KEY,
    company_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(50) DEFAULT 'employee', -- 'admin', 'manager', 'employee'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(company_id, user_id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_companies_name ON companies(name);
CREATE INDEX idx_companies_admin_email ON companies(admin_email);
CREATE INDEX idx_company_users_company_id ON company_users(company_id);
CREATE INDEX idx_company_users_user_id ON company_users(user_id);

-- Insert sample data for testing
-- Note: These are bcrypt hashes for 'password123'
INSERT INTO users (name, email, password, user_type) VALUES 
    ('John Doe', 'john@example.com', '$2b$10$rZ5zKzQQmQQmQQmQQmQQm.abcdefghijklmnopqrstuvwxyz1234567890', 'individual'),
    ('Admin User', 'admin@testcompany.com', '$2b$10$rZ5zKzQQmQQmQQmQQmQQm.abcdefghijklmnopqrstuvwxyz1234567890', 'company_admin'),
    ('Company Admin', 'admin@mycompany.com', '$2b$10$rZ5zKzQQmQQmQQmQQmQQm.abcdefghijklmnopqrstuvwxyz1234567890', 'company_admin');

INSERT INTO companies (name, admin_user_id, admin_email) VALUES 
    ('Test Company', 2, 'admin@testcompany.com'),
    ('My Company', 3, 'admin@mycompany.com');

INSERT INTO company_users (company_id, user_id, role) VALUES 
    (1, 2, 'admin'),
    (2, 3, 'admin');