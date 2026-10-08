-- ========================================================================
-- Al-Meezan Zakat & Sadaqah Management System
-- Production PostgreSQL Database Schema (Compatible with Supabase / Neon)
-- ========================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS & ROLES
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'verifier', 'finance', 'viewer');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'viewer',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. FINANCIAL / ZAKAT YEARS
CREATE TYPE year_status AS ENUM ('draft', 'active', 'closed', 'archived');

CREATE TABLE zakat_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year INT UNIQUE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status year_status DEFAULT 'active',
    planned_annual_budget NUMERIC(14, 2) DEFAULT 0.00,
    calculated_25_pool NUMERIC(14, 2) DEFAULT 0.00,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. CATEGORIES & PROGRAMS
CREATE TYPE fund_type AS ENUM ('zakat', 'sadqa', 'welfare');

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    fund_type fund_type DEFAULT 'zakat',
    is_eligible_25_pool BOOLEAN DEFAULT TRUE,
    default_annual_budget NUMERIC(14, 2) DEFAULT 0.00,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. FUND SOURCES / BANK ACCOUNTS
CREATE TYPE account_type AS ENUM ('corporate_bank', 'executive_account', 'trustee_account', 'cash_drawer', 'international_gulf');

CREATE TABLE fund_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    account_holder VARCHAR(150) NOT NULL,
    bank_name VARCHAR(100),
    account_type account_type DEFAULT 'corporate_bank',
    current_balance NUMERIC(14, 2) DEFAULT 0.00,
    role_description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. REFERENCE PERSONS / COORDINATORS
CREATE TABLE reference_coordinators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    role_title VARCHAR(100),
    department VARCHAR(80),
    focus_area VARCHAR(150),
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. BENEFICIARY DIRECTORY
CREATE TYPE verification_state AS ENUM ('verified', 'under_re_verification', 'cancel_rejected', 'new_applicant');

CREATE TABLE beneficiaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beneficiary_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    sub_category VARCHAR(100),
    location VARCHAR(200),
    address TEXT,
    phone VARCHAR(50),
    alternate_phone VARCHAR(50),
    reference_id UUID REFERENCES reference_coordinators(id) ON DELETE SET NULL,
    verification_status verification_state DEFAULT 'new_applicant',
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    audit_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast duplicate detection
CREATE INDEX idx_beneficiaries_search ON beneficiaries(full_name, phone, location);

-- 7. YEARLY ZAKAT PLANNING (ENVELOPES)
CREATE TABLE zakat_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year_id UUID REFERENCES zakat_years(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    previous_year_amount NUMERIC(14, 2) DEFAULT 0.00,
    planned_amount NUMERIC(14, 2) DEFAULT 0.00,
    approved_amount NUMERIC(14, 2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year_id, category_id)
);

-- 8. ASSET VALUATION (2.5% POOL ENGINE SNAPSHOTS)
CREATE TABLE zakat_asset_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year_id UUID REFERENCES zakat_years(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    asset_category VARCHAR(80) NOT NULL,
    valuation_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    zakat_rate NUMERIC(5, 4) DEFAULT 0.0250,
    liquidity_nature VARCHAR(50) DEFAULT 'High',
    valuation_date DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. PAYMENTS & DISBURSEMENTS LEDGER
CREATE TYPE payment_status AS ENUM ('pending', 'partially_paid', 'paid', 'cancelled');
CREATE TYPE payment_channel AS ENUM ('cash', 'online_bank_transfer', 'cheque', 'direct_to_institution', 'bank_transfer_gulf');

CREATE TABLE disbursements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voucher_no VARCHAR(50) UNIQUE NOT NULL,
    year_id UUID REFERENCES zakat_years(id) ON DELETE RESTRICT,
    beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES categories(id) ON DELETE RESTRICT,
    fund_source_id UUID REFERENCES fund_sources(id) ON DELETE SET NULL,
    allocated_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    payment_status payment_status DEFAULT 'pending',
    payment_channel payment_channel DEFAULT 'cash',
    payment_date DATE,
    transaction_ref VARCHAR(100),
    remarks TEXT,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    paid_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_disbursements_year_cat ON disbursements(year_id, category_id, payment_status);

-- 10. DEDICATED RATION KIT PROGRAM
CREATE TYPE ration_status AS ENUM ('planned', 'packing', 'distributed', 'cancelled');

CREATE TABLE ration_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year_id UUID REFERENCES zakat_years(id) ON DELETE CASCADE,
    beneficiary_name VARCHAR(150) NOT NULL,
    phone VARCHAR(50),
    colony_location VARCHAR(150) NOT NULL,
    occupation_reason VARCHAR(150),
    coordinator_name VARCHAR(100),
    kit_quantity INT DEFAULT 1,
    unit_kit_cost NUMERIC(10, 2) DEFAULT 4076.00,
    total_amount NUMERIC(12, 2) GENERATED ALWAYS AS (kit_quantity * unit_kit_cost) STORED,
    distribution_status ration_status DEFAULT 'planned',
    distribution_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. DEDICATED SCHOOL FEE ASSISTANCE MODULE
CREATE TYPE education_status AS ENUM ('pending_receipt', 'approved', 'paid_full', 'partial', 'rejected');

CREATE TABLE education_assistance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    year_id UUID REFERENCES zakat_years(id) ON DELETE CASCADE,
    beneficiary_id UUID REFERENCES beneficiaries(id) ON DELETE CASCADE,
    student_name VARCHAR(150) NOT NULL,
    school_name VARCHAR(200) NOT NULL,
    current_standard VARCHAR(50) NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    total_annual_fees NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    requested_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    approved_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status education_status DEFAULT 'pending_receipt',
    receipt_no VARCHAR(100),
    guardian_name VARCHAR(150),
    guardian_occupation VARCHAR(100),
    reference_name VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. AUDIT TRAIL LOGGING
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(150) NOT NULL,
    action_type VARCHAR(50) NOT NULL, -- 'CREATE', 'UPDATE', 'STATUS_CHANGE', 'PAYMENT', 'DELETE'
    entity_name VARCHAR(50) NOT NULL, -- 'disbursements', 'beneficiaries', 'zakat_plans', etc.
    record_id VARCHAR(100) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    description TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_record ON audit_logs(entity_name, record_id);
