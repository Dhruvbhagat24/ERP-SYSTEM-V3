-- Update companies table to add missing columns
ALTER TABLE companies 
ADD COLUMN IF NOT EXISTS industry VARCHAR(100),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add unique constraint on email if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_email_key') THEN
        ALTER TABLE companies ADD CONSTRAINT companies_email_key UNIQUE (email);
    END IF;
END $$;

-- Update users table to add missing columns
ALTER TABLE users
ADD COLUMN IF NOT EXISTS company_id INTEGER,
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user',
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_company_id_fkey') THEN
        ALTER TABLE users ADD CONSTRAINT users_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Update accounting_entries table if needed
ALTER TABLE accounting_entries
ADD COLUMN IF NOT EXISTS company_id INTEGER,
ADD COLUMN IF NOT EXISTS user_id INTEGER,
ADD COLUMN IF NOT EXISTS account_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add foreign key constraints for accounting_entries if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'accounting_entries_company_id_fkey') THEN
        ALTER TABLE accounting_entries ADD CONSTRAINT accounting_entries_company_id_fkey 
        FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'accounting_entries_user_id_fkey') THEN
        ALTER TABLE accounting_entries ADD CONSTRAINT accounting_entries_user_id_fkey 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Add check constraint for accounting entry type if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'accounting_entries_type_check') THEN
        ALTER TABLE accounting_entries ADD CONSTRAINT accounting_entries_type_check 
        CHECK (type IN ('credit', 'debit'));
    END IF;
END $$;