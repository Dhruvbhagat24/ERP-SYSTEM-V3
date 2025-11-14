-- Add these tables to your existing database

-- Chart of Accounts
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  account_code VARCHAR(20) UNIQUE NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  account_type VARCHAR(50) NOT NULL, -- Assets, Liabilities, Equity, Revenue, Expenses
  parent_id INTEGER REFERENCES chart_of_accounts(id),
  is_active BOOLEAN DEFAULT true,
  balance DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journal Entries
CREATE TABLE IF NOT EXISTS journal_entries (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  entry_number VARCHAR(50) UNIQUE NOT NULL,
  entry_date DATE NOT NULL,
  reference VARCHAR(255),
  description TEXT NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'draft', -- draft, posted, cancelled
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Journal Entry Lines (Double Entry)
CREATE TABLE IF NOT EXISTS journal_entry_lines (
  id SERIAL PRIMARY KEY,
  journal_entry_id INTEGER REFERENCES journal_entries(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES chart_of_accounts(id),
  debit_amount DECIMAL(15,2) DEFAULT 0.00,
  credit_amount DECIMAL(15,2) DEFAULT 0.00,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- General Ledger (Auto-generated from journal entries)
CREATE TABLE IF NOT EXISTS general_ledger (
  id SERIAL PRIMARY KEY,
  company_id INTEGER REFERENCES companies(id) ON DELETE CASCADE,
  account_id INTEGER REFERENCES chart_of_accounts(id),
  journal_entry_id INTEGER REFERENCES journal_entries(id),
  transaction_date DATE NOT NULL,
  description TEXT,
  debit_amount DECIMAL(15,2) DEFAULT 0.00,
  credit_amount DECIMAL(15,2) DEFAULT 0.00,
  balance DECIMAL(15,2) DEFAULT 0.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default chart of accounts for new companies
INSERT INTO chart_of_accounts (company_id, account_code, account_name, account_type) VALUES
(1, '1000', 'Assets', 'Assets'),
(1, '1100', 'Current Assets', 'Assets'),
(1, '1110', 'Cash', 'Assets'),
(1, '1120', 'Accounts Receivable', 'Assets'),
(1, '1130', 'Inventory', 'Assets'),
(1, '1200', 'Fixed Assets', 'Assets'),
(1, '1210', 'Equipment', 'Assets'),
(1, '1220', 'Accumulated Depreciation', 'Assets'),

(1, '2000', 'Liabilities', 'Liabilities'),
(1, '2100', 'Current Liabilities', 'Liabilities'),
(1, '2110', 'Accounts Payable', 'Liabilities'),
(1, '2120', 'Accrued Expenses', 'Liabilities'),

(1, '3000', 'Equity', 'Equity'),
(1, '3100', 'Owner Equity', 'Equity'),
(1, '3200', 'Retained Earnings', 'Equity'),

(1, '4000', 'Revenue', 'Revenue'),
(1, '4100', 'Sales Revenue', 'Revenue'),
(1, '4200', 'Service Revenue', 'Revenue'),

(1, '5000', 'Expenses', 'Expenses'),
(1, '5100', 'Cost of Goods Sold', 'Expenses'),
(1, '5200', 'Operating Expenses', 'Expenses'),
(1, '5300', 'Administrative Expenses', 'Expenses');