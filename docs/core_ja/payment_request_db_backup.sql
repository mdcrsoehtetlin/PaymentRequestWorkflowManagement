-- =============================================================================
-- Payment Request Workflow Management System
-- Database Backup / Seed Dump File
-- =============================================================================
-- Target Engine    : PostgreSQL 13+
-- Encoding         : UTF-8
-- Generated        : 2026-06-12
-- Purpose          : Full schema recreation + master data + mock test data
--                    for local developer environment synchronization.
-- Usage            : psql -U <username> -d <database> -f payment_request_db_backup.sql
-- =============================================================================

-- =============================================
-- 0. PREAMBLE: TRANSACTION + SAFETY SETTINGS
-- =============================================
BEGIN;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET timezone = 'UTC';

-- =============================================================================
-- 1. DDL STRUCTURE SCHEMA — DROP EXISTING OBJECTS (reverse dependency order)
-- =============================================================================

-- Drop triggers first to avoid function dependency issues
DROP FUNCTION IF EXISTS protect_approval_logs_immutability() CASCADE;

-- Drop transactional tables (children first, then parents)
DROP TABLE IF EXISTS receipt_files CASCADE;
DROP TABLE IF EXISTS approval_logs CASCADE;
DROP TABLE IF EXISTS payment_breakdown_items CASCADE;
DROP TABLE IF EXISTS payment_requests CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop lookup tables
DROP TABLE IF EXISTS approval_action_types CASCADE;
DROP TABLE IF EXISTS currencies CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;
DROP TABLE IF EXISTS payment_types CASCADE;
DROP TABLE IF EXISTS payment_statuses CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- =============================================================================
-- 2. DDL STRUCTURE SCHEMA — CREATE LOOKUP TABLES
-- =============================================================================

-- =========================================================================
-- 2.1 USER ROLES LOOKUP TABLE
-- =========================================================================
CREATE TABLE user_roles (
    role_id SERIAL,
    role_code VARCHAR(20) NOT NULL,
    role_name VARCHAR(50) NOT NULL,
    description VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_user_roles PRIMARY KEY (role_id),
    CONSTRAINT uq_user_roles_role_code UNIQUE (role_code),
    CONSTRAINT uq_user_roles_role_name UNIQUE (role_name)
);

-- =========================================================================
-- 2.2 PAYMENT STATUSES LOOKUP TABLE
-- =========================================================================
CREATE TABLE payment_statuses (
    status_id SERIAL,
    status_code VARCHAR(30) NOT NULL,
    status_name VARCHAR(50) NOT NULL,
    display_order INTEGER NOT NULL,
    is_editable_state BOOLEAN NOT NULL DEFAULT FALSE,
    is_terminal_state BOOLEAN NOT NULL DEFAULT FALSE,
    description VARCHAR(500),
    CONSTRAINT pk_payment_statuses PRIMARY KEY (status_id),
    CONSTRAINT uq_payment_statuses_status_code UNIQUE (status_code),
    CONSTRAINT uq_payment_statuses_status_name UNIQUE (status_name)
);

-- =========================================================================
-- 2.3 PAYMENT TYPES LOOKUP TABLE
-- =========================================================================
CREATE TABLE payment_types (
    payment_type_id SERIAL,
    payment_type_code VARCHAR(30) NOT NULL,
    payment_type_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_payment_types PRIMARY KEY (payment_type_id),
    CONSTRAINT uq_payment_types_payment_type_code UNIQUE (payment_type_code),
    CONSTRAINT uq_payment_types_payment_type_name UNIQUE (payment_type_name)
);

-- =========================================================================
-- 2.4 PAYMENT METHODS LOOKUP TABLE
-- =========================================================================
CREATE TABLE payment_methods (
    payment_method_id SERIAL,
    payment_method_code VARCHAR(20) NOT NULL,
    payment_method_name VARCHAR(50) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_payment_methods PRIMARY KEY (payment_method_id),
    CONSTRAINT uq_payment_methods_payment_method_code UNIQUE (payment_method_code),
    CONSTRAINT uq_payment_methods_payment_method_name UNIQUE (payment_method_name)
);

-- =========================================================================
-- 2.5 CURRENCIES LOOKUP TABLE
-- =========================================================================
CREATE TABLE currencies (
    currency_id SERIAL,
    currency_code VARCHAR(3) NOT NULL,
    currency_name VARCHAR(100) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_currencies PRIMARY KEY (currency_id),
    CONSTRAINT uq_currencies_currency_code UNIQUE (currency_code)
);

-- =========================================================================
-- 2.6 APPROVAL ACTION TYPES LOOKUP TABLE
-- =========================================================================
CREATE TABLE approval_action_types (
    action_type_id SERIAL,
    action_code VARCHAR(30) NOT NULL,
    action_type VARCHAR(50) NOT NULL,
    description VARCHAR(500),
    CONSTRAINT pk_approval_action_types PRIMARY KEY (action_type_id),
    CONSTRAINT uq_approval_action_types_action_code UNIQUE (action_code),
    CONSTRAINT uq_approval_action_types_action_type UNIQUE (action_type)
);

-- =============================================================================
-- 3. DDL STRUCTURE SCHEMA — CREATE TRANSACTIONAL TABLES
-- =============================================================================

-- =========================================================================
-- 3.1 USERS TABLE
-- =========================================================================
CREATE TABLE users (
    user_id SERIAL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(512) NOT NULL,
    full_name VARCHAR(200) NOT NULL,
    employee_number VARCHAR(20) NOT NULL,
    department VARCHAR(100),
    branch VARCHAR(100) NOT NULL,
    role_id INTEGER NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_date TIMESTAMP WITH TIME ZONE,
    CONSTRAINT pk_users PRIMARY KEY (user_id),
    CONSTRAINT uq_users_email UNIQUE (email),
    CONSTRAINT uq_users_employee_number UNIQUE (employee_number),
    CONSTRAINT fk_users_role FOREIGN KEY (role_id)
        REFERENCES user_roles(role_id)
        ON DELETE RESTRICT
        ON UPDATE CASCADE
);

-- =========================================================================
-- 3.2 PAYMENT REQUESTS TABLE
-- =========================================================================
CREATE TABLE payment_requests (
    payment_request_id SERIAL,
    request_number VARCHAR(50) NOT NULL,
    applicant_user_id INTEGER NOT NULL,
    manager_user_id INTEGER,
    final_approver_user_id INTEGER,
    accounting_user_id INTEGER,
    current_assigned_to_user_id INTEGER,
    application_date DATE NOT NULL,
    desired_payment_date DATE NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL,
    currency_id INTEGER NOT NULL,
    payment_type_id INTEGER NOT NULL,
    payment_method_id INTEGER NOT NULL,
    purpose VARCHAR(500) NOT NULL,
    bank_account_info VARCHAR(200),
    request_content TEXT NOT NULL,
    has_receipt BOOLEAN NOT NULL DEFAULT TRUE,
    status_id INTEGER NOT NULL,
    submitted_to_manager_date TIMESTAMP WITH TIME ZONE,
    manager_verification_date TIMESTAMP WITH TIME ZONE,
    submitted_to_approver_date TIMESTAMP WITH TIME ZONE,
    approval_date TIMESTAMP WITH TIME ZONE,
    payment_completed_date TIMESTAMP WITH TIME ZONE,
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT pk_payment_requests PRIMARY KEY (payment_request_id),
    CONSTRAINT uq_payment_requests_number UNIQUE (request_number),
    CONSTRAINT chk_payment_requests_number_format CHECK (request_number ~ '^PRF-[0-9]{4}-[0-9]{3,6}$'),
    CONSTRAINT chk_payment_requests_total_amount CHECK (total_amount > 0),

    CONSTRAINT fk_payment_requests_applicant FOREIGN KEY (applicant_user_id)
        REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_payment_requests_manager FOREIGN KEY (manager_user_id)
        REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_payment_requests_approver FOREIGN KEY (final_approver_user_id)
        REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_payment_requests_accounting FOREIGN KEY (accounting_user_id)
        REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_payment_requests_assigned FOREIGN KEY (current_assigned_to_user_id)
        REFERENCES users(user_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_payment_requests_currency FOREIGN KEY (currency_id)
        REFERENCES currencies(currency_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_payment_requests_type FOREIGN KEY (payment_type_id)
        REFERENCES payment_types(payment_type_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_payment_requests_method FOREIGN KEY (payment_method_id)
        REFERENCES payment_methods(payment_method_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_payment_requests_status FOREIGN KEY (status_id)
        REFERENCES payment_statuses(status_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- =========================================================================
-- 3.3 PAYMENT BREAKDOWN ITEMS TABLE
-- =========================================================================
CREATE TABLE payment_breakdown_items (
    payment_breakdown_item_id SERIAL,
    payment_request_id INTEGER NOT NULL,
    line_number INTEGER NOT NULL,
    item_date DATE NOT NULL,
    description VARCHAR(200) NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    quantity NUMERIC(10, 2) DEFAULT 1.00,
    unit_price NUMERIC(10, 2),
    created_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    modified_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_payment_breakdown_items PRIMARY KEY (payment_breakdown_item_id),
    CONSTRAINT uq_payment_breakdown_items_line UNIQUE (payment_request_id, line_number),
    CONSTRAINT chk_payment_breakdown_items_line_range CHECK (line_number >= 1 AND line_number <= 15),
    CONSTRAINT chk_payment_breakdown_items_amount CHECK (amount > 0),
    CONSTRAINT fk_payment_breakdown_items_request FOREIGN KEY (payment_request_id)
        REFERENCES payment_requests(payment_request_id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- =========================================================================
-- 3.4 APPROVAL LOGS TABLE (IMMUTABLE AUDIT TRAIL)
-- =========================================================================
CREATE TABLE approval_logs (
    approval_log_id BIGSERIAL,
    payment_request_id INTEGER NOT NULL,
    action_taken_by_user_id INTEGER NOT NULL,
    action_type_id INTEGER NOT NULL,
    previous_status_id INTEGER,
    new_status_id INTEGER,
    comment TEXT,
    ip_address VARCHAR(50) NOT NULL,
    user_agent VARCHAR(500) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_approval_logs PRIMARY KEY (approval_log_id),
    CONSTRAINT fk_approval_logs_request FOREIGN KEY (payment_request_id)
        REFERENCES payment_requests(payment_request_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_approval_logs_user FOREIGN KEY (action_taken_by_user_id)
        REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_approval_logs_action FOREIGN KEY (action_type_id)
        REFERENCES approval_action_types(action_type_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_approval_logs_prev_status FOREIGN KEY (previous_status_id)
        REFERENCES payment_statuses(status_id) ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT fk_approval_logs_new_status FOREIGN KEY (new_status_id)
        REFERENCES payment_statuses(status_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- =========================================================================
-- 3.5 RECEIPT FILES TABLE
-- =========================================================================
CREATE TABLE receipt_files (
    receipt_file_id SERIAL,
    payment_request_id INTEGER NOT NULL,
    original_file_name VARCHAR(255) NOT NULL,
    stored_file_name VARCHAR(255) NOT NULL,
    file_storage_path VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by_user_id INTEGER NOT NULL,
    uploaded_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    CONSTRAINT pk_receipt_files PRIMARY KEY (receipt_file_id),
    CONSTRAINT chk_receipt_files_file_size CHECK (file_size > 0 AND file_size <= 10485760),
    CONSTRAINT fk_receipt_files_request FOREIGN KEY (payment_request_id)
        REFERENCES payment_requests(payment_request_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_receipt_files_uploader FOREIGN KEY (uploaded_by_user_id)
        REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

-- =============================================================================
-- 4. IMMUTABILITY TRIGGER — APPROVAL LOGS PROTECTION
-- =============================================================================

CREATE OR REPLACE FUNCTION protect_approval_logs_immutability()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Table "approval_logs" is immutable. Updates or deletions are strictly prohibited.';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_approval_logs_immutable
BEFORE UPDATE OR DELETE ON approval_logs
FOR EACH ROW
EXECUTE FUNCTION protect_approval_logs_immutability();

-- =============================================================================
-- 5. PERFORMANCE OPTIMIZATION LAYER — INDEXES
-- =============================================================================

-- Indexes for Users Table
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_employee_number ON users (employee_number);
CREATE INDEX idx_users_role_id ON users (role_id);
CREATE INDEX idx_users_branch ON users (branch);
CREATE INDEX idx_users_is_active ON users (is_active);

-- Indexes for Payment Requests Table
CREATE INDEX idx_payment_requests_applicant_id ON payment_requests (applicant_user_id);
CREATE INDEX idx_payment_requests_manager_id ON payment_requests (manager_user_id);
CREATE INDEX idx_payment_requests_approver_id ON payment_requests (final_approver_user_id);
CREATE INDEX idx_payment_requests_accounting_id ON payment_requests (accounting_user_id);
CREATE INDEX idx_payment_requests_assigned_to ON payment_requests (current_assigned_to_user_id);
CREATE INDEX idx_payment_requests_status_id ON payment_requests (status_id);
CREATE INDEX idx_payment_requests_is_deleted ON payment_requests (is_deleted);
CREATE INDEX idx_payment_requests_number ON payment_requests (request_number);

-- Compound Indexes
CREATE INDEX idx_payment_requests_status_created ON payment_requests (status_id, created_date DESC);
CREATE INDEX idx_payment_requests_assigned_status ON payment_requests (current_assigned_to_user_id, status_id);

-- Partial Indexing for Active Items (Soft Delete Filters)
CREATE INDEX idx_payment_requests_active_created ON payment_requests (created_date DESC)
WHERE is_deleted = FALSE;

-- Indexes for Child Entities
CREATE INDEX idx_payment_breakdown_items_request_id ON payment_breakdown_items (payment_request_id);
CREATE INDEX idx_payment_breakdown_items_item_date ON payment_breakdown_items (item_date);

CREATE INDEX idx_approval_logs_request_id ON approval_logs (payment_request_id);
CREATE INDEX idx_approval_logs_user_id ON approval_logs (action_taken_by_user_id);
CREATE INDEX idx_approval_logs_timestamp ON approval_logs (timestamp DESC);
CREATE INDEX idx_approval_logs_request_timestamp ON approval_logs (payment_request_id, timestamp DESC);

CREATE INDEX idx_receipt_files_request_id ON receipt_files (payment_request_id);
CREATE INDEX idx_receipt_files_uploaded_date ON receipt_files (uploaded_date DESC);

-- =============================================================================
-- 6. CORE MASTER SEEDING — LOOKUP TABLE DATA (Section 2.2 Specification)
-- =============================================================================

-- -------------------------------------------------------------------------
-- 6.1 Seed User Roles (role_id: 1-5)
-- -------------------------------------------------------------------------
INSERT INTO user_roles (role_id, role_code, role_name, description, is_active) VALUES
(1, 'APPLICANT',  'Applicant',            'Employee submitting payment requests and managing own drafts', TRUE),
(2, 'MANAGER',    'Manager',              'First-level verifier of payment requests', TRUE),
(3, 'APPROVER',   'Final Approver',       'Second-level ultimate approver of payment requests', TRUE),
(4, 'ACCOUNTING', 'Accounting',           'Finance processing team for approved requests', TRUE),
(5, 'ADMIN',      'System Administrator', 'IT system administrator managing users and configurations', TRUE);

SELECT setval('user_roles_role_id_seq', 5, true);

-- -------------------------------------------------------------------------
-- 6.2 Seed Payment Statuses (status_id: 1-10)
-- -------------------------------------------------------------------------
INSERT INTO payment_statuses (status_id, status_code, status_name, display_order, is_editable_state, is_terminal_state, description) VALUES
(1,  'DRAFT',               'Draft',                      1,  TRUE,  FALSE, 'Initial state; applicant is composing the request'),
(2,  'SUBMITTED_MANAGER',   'Submitted to Manager',       2,  FALSE, FALSE, 'Applicant submitted; awaiting Manager verification'),
(3,  'MANAGER_REVIEWING',   'Manager Reviewing',          3,  FALSE, FALSE, 'Manager is actively reviewing (triggered on open)'),
(4,  'MANAGER_VERIFIED',    'Manager Verified (OK)',       4,  FALSE, FALSE, 'Manager verified; awaiting Applicant to submit to Approver'),
(5,  'REJECTED_MANAGER',    'Rejected by Manager',        5,  TRUE,  FALSE, 'Manager rejected request; Applicant can modify and resubmit'),
(6,  'SUBMITTED_APPROVER',  'Submitted to Approver',      6,  FALSE, FALSE, 'Ready for Final Approver review'),
(7,  'APPROVER_REVIEWING',  'Approver Reviewing',         7,  FALSE, FALSE, 'Final Approver is actively reviewing (triggered on open)'),
(8,  'APPROVED',            'Approved',                   8,  FALSE, FALSE, 'Final approved; sent to Accounting for payment processing'),
(9,  'REJECTED_APPROVER',   'Rejected by Approver',       9,  TRUE,  FALSE, 'Final Approver rejected; restarts workflow back to Manager'),
(10, 'PAID',                'Paid (Completed)',           10,  FALSE, TRUE,  'Payment process completed by Accounting; terminal state');

SELECT setval('payment_statuses_status_id_seq', 10, true);

-- -------------------------------------------------------------------------
-- 6.3 Seed Payment Types (payment_type_id: 1-4)
-- -------------------------------------------------------------------------
INSERT INTO payment_types (payment_type_id, payment_type_code, payment_type_name, is_active) VALUES
(1, 'EXPENSE_REIMBURSE', 'Expense Reimbursement', TRUE),
(2, 'SERVICE_PAYMENT',   'Service Payment',       TRUE),
(3, 'ADVANCE_PAYMENT',   'Advance Payment',       TRUE),
(4, 'OTHER',             'Other',                 TRUE);

SELECT setval('payment_types_payment_type_id_seq', 4, true);

-- -------------------------------------------------------------------------
-- 6.4 Seed Payment Methods (payment_method_id: 1-3)
-- -------------------------------------------------------------------------
INSERT INTO payment_methods (payment_method_id, payment_method_code, payment_method_name, is_active) VALUES
(1, 'BANK_TRANSFER', 'Bank Transfer', TRUE),
(2, 'CASH',          'Cash',          TRUE),
(3, 'CHECK',         'Check',         TRUE);

SELECT setval('payment_methods_payment_method_id_seq', 3, true);

-- -------------------------------------------------------------------------
-- 6.5 Seed Currencies (currency_id: 1-4)
-- -------------------------------------------------------------------------
INSERT INTO currencies (currency_id, currency_code, currency_name, is_active) VALUES
(1, 'MMK', 'Myanmar Kyat',  TRUE),
(2, 'USD', 'US Dollar',     TRUE),
(3, 'JPY', 'Japanese Yen',  TRUE),
(4, 'THB', 'Thai Baht',     TRUE);

SELECT setval('currencies_currency_id_seq', 4, true);

-- -------------------------------------------------------------------------
-- 6.6 Seed Approval Action Types (action_type_id: 1-10)
-- -------------------------------------------------------------------------
INSERT INTO approval_action_types (action_type_id, action_code, action_type, description) VALUES
(1,  'CREATED',           'Created',                  'Payment request draft initialized'),
(2,  'EDITED',            'Edited',                   'Draft or rejected request details modified by applicant'),
(3,  'SUBMITTED',         'Submitted',                'Request submitted by applicant for review'),
(4,  'MGR_REVIEW_START',  'Manager Review Started',   'System changed status to Manager Reviewing upon entry'),
(5,  'MGR_VERIFIED',      'Manager Verified',         'Manager completed verification successfully'),
(6,  'MGR_REJECTED',      'Manager Rejected',         'Manager rejected request back to applicant'),
(7,  'APPR_REVIEW_START', 'Approver Review Started',  'System changed status to Approver Reviewing upon entry'),
(8,  'APPROVED',          'Approved',                 'Final Approver authorized the payment request'),
(9,  'APPR_REJECTED',     'Approver Rejected',        'Final Approver rejected request back to applicant'),
(10, 'PAYMENT_COMPLETED', 'Payment Completed',        'Accounting completed bank transfer or cash payout');

SELECT setval('approval_action_types_action_type_id_seq', 10, true);

-- =============================================================================
-- 7. MOCK DATA SEEDING — TEST USERS
-- =============================================================================
-- Password for all test users: "Password@123"
-- bcrypt hash generated with 12 salt rounds
-- -------------------------------------------------------------------------

INSERT INTO users (user_id, email, password_hash, full_name, employee_number, department, branch, role_id, is_active, created_date, modified_date, last_login_date) VALUES
(1, 'soehtetlin@prwm.local',
    '$2b$12$JcLwJQc4y/4OUIAQHnQZLeRKhjvaFJtgLanuvS/lZNBr84kUBVJBO',
    'Soe Htet Lin', 'EMP-2024-001', 'Engineering', 'Yangon',
    1, TRUE,
    '2026-01-15 03:00:00+00', '2026-06-12 04:00:00+00', '2026-06-12 07:30:00+00'),

(2, 'ayethandarmoe@prwm.local',
    '$2b$12$JcLwJQc4y/4OUIAQHnQZLeRKhjvaFJtgLanuvS/lZNBr84kUBVJBO',
    'Aye Thandar Moe', 'EMP-2024-002', 'Operations', 'Yangon',
    2, TRUE,
    '2026-01-15 03:00:00+00', '2026-06-10 08:00:00+00', '2026-06-11 09:00:00+00'),

(3, 'khaingthinthinwin@prwm.local',
    '$2b$12$JcLwJQc4y/4OUIAQHnQZLeRKhjvaFJtgLanuvS/lZNBr84kUBVJBO',
    'Khaing Thin Thin Win', 'EMP-2024-003', 'Finance', 'Naypyidaw',
    3, TRUE,
    '2026-01-15 03:00:00+00', '2026-06-09 06:00:00+00', '2026-06-11 05:00:00+00'),

(4, 'shinminthant@prwm.local',
    '$2b$12$JcLwJQc4y/4OUIAQHnQZLeRKhjvaFJtgLanuvS/lZNBr84kUBVJBO',
    'Shin Min Thant', 'EMP-2024-004', 'Finance', 'Mandalay',
    4, TRUE,
    '2026-01-15 03:00:00+00', '2026-06-08 07:00:00+00', '2026-06-10 08:30:00+00'),

(5, 'yemaungmaung@prwm.local',
    '$2b$12$JcLwJQc4y/4OUIAQHnQZLeRKhjvaFJtgLanuvS/lZNBr84kUBVJBO',
    'Ye Maung Maung', 'EMP-2024-005', 'IT Administration', 'Naypyidaw',
    5, TRUE,
    '2026-01-15 03:00:00+00', '2026-06-12 02:00:00+00', '2026-06-12 06:00:00+00');

SELECT setval('users_user_id_seq', 5, true);

-- =============================================================================
-- 8. MOCK DATA SEEDING — PAYMENT REQUESTS (5 Lifecycle Phases)
-- =============================================================================

-- -------------------------------------------------------------------------
-- REQUEST 1: DRAFT status (status_id=1)
-- Applicant: Soe Htet Lin (user_id=1, branch=Yangon)
-- No manager assigned yet. Currently assigned to applicant themselves.
-- -------------------------------------------------------------------------
INSERT INTO payment_requests (
    payment_request_id, request_number, applicant_user_id,
    manager_user_id, final_approver_user_id, accounting_user_id, current_assigned_to_user_id,
    application_date, desired_payment_date, total_amount,
    currency_id, payment_type_id, payment_method_id,
    purpose, bank_account_info, request_content, has_receipt, status_id,
    submitted_to_manager_date, manager_verification_date,
    submitted_to_approver_date, approval_date, payment_completed_date,
    created_date, modified_date, is_deleted
) VALUES (
    1, 'PRF-2026-001', 1,
    NULL, NULL, NULL, 1,
    '2026-06-12', '2026-06-25', 185000.00,
    1, 1, 1,
    'Office supplies procurement for Q3 Engineering department',
    'KBZ Bank - 0123456789012',
    'Purchase of ergonomic keyboards, monitors, and USB docking stations for the new developer onboarding batch arriving in July 2026. Vendor: Myanmar Digital Solutions Co., Ltd.',
    FALSE, 1,
    NULL, NULL, NULL, NULL, NULL,
    '2026-06-12 04:00:00+00', '2026-06-12 04:00:00+00', FALSE
);

-- -------------------------------------------------------------------------
-- REQUEST 2: SUBMITTED_MANAGER status (status_id=2)
-- Applicant: Soe Htet Lin (user_id=1, branch=Yangon)
-- Manager: Aye Thandar Moe (user_id=2). Currently assigned to Manager.
-- -------------------------------------------------------------------------
INSERT INTO payment_requests (
    payment_request_id, request_number, applicant_user_id,
    manager_user_id, final_approver_user_id, accounting_user_id, current_assigned_to_user_id,
    application_date, desired_payment_date, total_amount,
    currency_id, payment_type_id, payment_method_id,
    purpose, bank_account_info, request_content, has_receipt, status_id,
    submitted_to_manager_date, manager_verification_date,
    submitted_to_approver_date, approval_date, payment_completed_date,
    created_date, modified_date, is_deleted
) VALUES (
    2, 'PRF-2026-002', 1,
    2, NULL, NULL, 2,
    '2026-06-10', '2026-06-20', 450000.00,
    1, 2, 1,
    'Cloud infrastructure service payment for AWS hosting - June 2026',
    'AYA Bank - 9876543210001',
    'Monthly AWS EC2 and RDS hosting charges for production environment including S3 storage fees and CloudWatch monitoring for the PRWM system. Invoice ref: AWS-INV-2026-06-1847.',
    TRUE, 2,
    '2026-06-10 09:30:00+00', NULL, NULL, NULL, NULL,
    '2026-06-10 08:00:00+00', '2026-06-10 09:30:00+00', FALSE
);

-- -------------------------------------------------------------------------
-- REQUEST 3: MANAGER_VERIFIED status (status_id=4)
-- Applicant: Soe Htet Lin (user_id=1, branch=Yangon)
-- Manager: Aye Thandar Moe (user_id=2). Manager verified.
-- Currently assigned back to Applicant to submit to Approver.
-- -------------------------------------------------------------------------
INSERT INTO payment_requests (
    payment_request_id, request_number, applicant_user_id,
    manager_user_id, final_approver_user_id, accounting_user_id, current_assigned_to_user_id,
    application_date, desired_payment_date, total_amount,
    currency_id, payment_type_id, payment_method_id,
    purpose, bank_account_info, request_content, has_receipt, status_id,
    submitted_to_manager_date, manager_verification_date,
    submitted_to_approver_date, approval_date, payment_completed_date,
    created_date, modified_date, is_deleted
) VALUES (
    3, 'PRF-2026-003', 1,
    2, NULL, NULL, 1,
    '2026-06-05', '2026-06-18', 275500.00,
    1, 1, 1,
    'Business trip reimbursement - Mandalay client site visit',
    'KBZ Bank - 0123456789012',
    'Reimbursement for round-trip airfare (Yangon-Mandalay), 3-night hotel accommodation at Mandalay Hill Resort, and ground transportation for client requirements gathering sessions held June 1-4, 2026.',
    TRUE, 4,
    '2026-06-05 06:00:00+00', '2026-06-06 03:15:00+00', NULL, NULL, NULL,
    '2026-06-05 05:00:00+00', '2026-06-06 03:15:00+00', FALSE
);

-- -------------------------------------------------------------------------
-- REQUEST 4: APPROVED status (status_id=8)
-- ** MANDALAY BRANCH APPLICANT — triggers cash handler alert **
-- Applicant: Shin Min Thant (user_id=4, branch=Mandalay, role=ACCOUNTING)
--   NOTE: For testing, user_id=4 acts as applicant here (self-submitted).
--         In production, a separate Mandalay-based applicant would exist.
-- Manager: Aye Thandar Moe (user_id=2)
-- Approver: Khaing Thin Thin Win (user_id=3)
-- Currently assigned to Accounting (user_id=4).
-- -------------------------------------------------------------------------
INSERT INTO payment_requests (
    payment_request_id, request_number, applicant_user_id,
    manager_user_id, final_approver_user_id, accounting_user_id, current_assigned_to_user_id,
    application_date, desired_payment_date, total_amount,
    currency_id, payment_type_id, payment_method_id,
    purpose, bank_account_info, request_content, has_receipt, status_id,
    submitted_to_manager_date, manager_verification_date,
    submitted_to_approver_date, approval_date, payment_completed_date,
    created_date, modified_date, is_deleted
) VALUES (
    4, 'PRF-2026-004', 4,
    2, 3, 4, 4,
    '2026-05-28', '2026-06-10', 1250000.00,
    1, 3, 2,
    'Advance payment for Mandalay branch office renovation project',
    NULL,
    'Advance cash disbursement for Mandalay branch office renovation Phase 1: ceiling repairs, electrical wiring upgrade, and new air conditioning units installation. Contractor: Golden Land Construction Ltd. Contract ref: GLC-MDY-2026-042.',
    TRUE, 8,
    '2026-05-28 04:00:00+00', '2026-05-29 02:30:00+00',
    '2026-05-29 07:00:00+00', '2026-05-30 05:45:00+00', NULL,
    '2026-05-28 03:00:00+00', '2026-05-30 05:45:00+00', FALSE
);

-- -------------------------------------------------------------------------
-- REQUEST 5: PAID status (status_id=10) — Terminal state
-- Applicant: Soe Htet Lin (user_id=1, branch=Yangon)
-- Full lifecycle completed. Assigned to nobody (NULL).
-- -------------------------------------------------------------------------
INSERT INTO payment_requests (
    payment_request_id, request_number, applicant_user_id,
    manager_user_id, final_approver_user_id, accounting_user_id, current_assigned_to_user_id,
    application_date, desired_payment_date, total_amount,
    currency_id, payment_type_id, payment_method_id,
    purpose, bank_account_info, request_content, has_receipt, status_id,
    submitted_to_manager_date, manager_verification_date,
    submitted_to_approver_date, approval_date, payment_completed_date,
    created_date, modified_date, is_deleted
) VALUES (
    5, 'PRF-2026-005', 1,
    2, 3, 4, NULL,
    '2026-05-15', '2026-05-30', 89750.00,
    1, 1, 1,
    'Staff welfare event expenses - May 2026 team building',
    'CB Bank - 5544332211001',
    'Expense reimbursement for company team building event at Inya Lake Hotel on May 10, 2026. Includes venue rental, catering for 35 staff members, transportation arrangement, and event photography services.',
    TRUE, 10,
    '2026-05-15 04:00:00+00', '2026-05-16 02:00:00+00',
    '2026-05-16 06:00:00+00', '2026-05-17 03:30:00+00', '2026-05-20 04:00:00+00',
    '2026-05-15 03:00:00+00', '2026-05-20 04:00:00+00', FALSE
);

SELECT setval('payment_requests_payment_request_id_seq', 5, true);

-- =============================================================================
-- 9. MOCK DATA SEEDING — PAYMENT BREAKDOWN ITEMS
-- =============================================================================
-- Each request has 2-3 line items. Cumulative sums match parent total_amount.

-- -------------------------------------------------------------------------
-- Request 1 (PRF-2026-001) total_amount = 185,000.00 MMK
-- -------------------------------------------------------------------------
INSERT INTO payment_breakdown_items (payment_request_id, line_number, item_date, description, amount, quantity, unit_price) VALUES
(1, 1, '2026-06-12', 'Ergonomic mechanical keyboards (Logitech MX Keys)', 75000.00, 5.00, 15000.00),
(1, 2, '2026-06-12', '24-inch IPS monitors (Dell P2422H)',                85000.00, 5.00, 17000.00),
(1, 3, '2026-06-12', 'USB-C docking stations (Anker PowerExpand)',        25000.00, 5.00, 5000.00);

-- -------------------------------------------------------------------------
-- Request 2 (PRF-2026-002) total_amount = 450,000.00 MMK
-- -------------------------------------------------------------------------
INSERT INTO payment_breakdown_items (payment_request_id, line_number, item_date, description, amount, quantity, unit_price) VALUES
(2, 1, '2026-06-01', 'AWS EC2 instances (t3.large x3) - June 2026',    180000.00, 3.00, 60000.00),
(2, 2, '2026-06-01', 'AWS RDS PostgreSQL (db.r6g.large) - June 2026',  200000.00, 1.00, 200000.00),
(2, 3, '2026-06-01', 'AWS S3 storage + CloudWatch monitoring fees',      70000.00, 1.00, 70000.00);

-- -------------------------------------------------------------------------
-- Request 3 (PRF-2026-003) total_amount = 275,500.00 MMK
-- -------------------------------------------------------------------------
INSERT INTO payment_breakdown_items (payment_request_id, line_number, item_date, description, amount, quantity, unit_price) VALUES
(3, 1, '2026-06-01', 'Round-trip airfare Yangon-Mandalay (Myanmar National Airlines)', 125000.00, 1.00, 125000.00),
(3, 2, '2026-06-01', 'Hotel accommodation - Mandalay Hill Resort (3 nights)',          120000.00, 3.00, 40000.00),
(3, 3, '2026-06-04', 'Ground transportation and fuel reimbursement',                    30500.00, 1.00, 30500.00);

-- -------------------------------------------------------------------------
-- Request 4 (PRF-2026-004) total_amount = 1,250,000.00 MMK
-- -------------------------------------------------------------------------
INSERT INTO payment_breakdown_items (payment_request_id, line_number, item_date, description, amount, quantity, unit_price) VALUES
(4, 1, '2026-05-28', 'Ceiling structural repair and waterproofing works',              450000.00, 1.00, 450000.00),
(4, 2, '2026-05-28', 'Complete electrical wiring upgrade (3 floors)',                   500000.00, 1.00, 500000.00),
(4, 3, '2026-05-28', 'Air conditioning units (Daikin split-type x6) with installation', 300000.00, 6.00, 50000.00);

-- -------------------------------------------------------------------------
-- Request 5 (PRF-2026-005) total_amount = 89,750.00 MMK
-- -------------------------------------------------------------------------
INSERT INTO payment_breakdown_items (payment_request_id, line_number, item_date, description, amount, quantity, unit_price) VALUES
(5, 1, '2026-05-10', 'Venue rental - Inya Lake Hotel Grand Ballroom',       35000.00, 1.00, 35000.00),
(5, 2, '2026-05-10', 'Catering service for 35 staff members (lunch + tea)', 42750.00, 35.00, 1221.43),
(5, 3, '2026-05-10', 'Event photography and transportation arrangement',    12000.00, 1.00, 12000.00);

-- =============================================================================
-- 10. MOCK DATA SEEDING — APPROVAL LOGS (Audit Trail Timeline)
-- =============================================================================
-- Disable the immutability trigger temporarily for seeding
DROP TRIGGER IF EXISTS trg_approval_logs_immutable ON approval_logs;

-- -------------------------------------------------------------------------
-- Logs for Request 4 (PRF-2026-004) — APPROVED lifecycle
-- Full workflow: CREATED → SUBMITTED → MGR_REVIEW_START → MGR_VERIFIED
--                → SUBMITTED (to approver) → APPR_REVIEW_START → APPROVED
-- -------------------------------------------------------------------------
INSERT INTO approval_logs (payment_request_id, action_taken_by_user_id, action_type_id, previous_status_id, new_status_id, comment, ip_address, user_agent, timestamp) VALUES
-- Step 1: Draft created by applicant (Shin Min Thant, user_id=4)
(4, 4, 1, NULL, 1,
    NULL,
    '192.168.1.104', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0',
    '2026-05-28 03:00:00+00'),

-- Step 2: Submitted to Manager
(4, 4, 3, 1, 2,
    NULL,
    '192.168.1.104', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0',
    '2026-05-28 04:00:00+00'),

-- Step 3: Manager review started (auto-triggered when Aye Thandar Moe opened the request)
(4, 2, 4, 2, 3,
    NULL,
    '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/127.0',
    '2026-05-29 02:00:00+00'),

-- Step 4: Manager verified
(4, 2, 5, 3, 4,
    'All breakdown items verified against attached contractor quotation. Amounts confirmed.',
    '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/127.0',
    '2026-05-29 02:30:00+00'),

-- Step 5: Applicant submitted to Final Approver
(4, 4, 3, 4, 6,
    NULL,
    '192.168.1.104', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0',
    '2026-05-29 07:00:00+00'),

-- Step 6: Approver review started (auto-triggered when Khaing Thin Thin Win opened)
(4, 3, 7, 6, 7,
    NULL,
    '192.168.1.103', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    '2026-05-30 05:00:00+00'),

-- Step 7: Final Approver approved
(4, 3, 8, 7, 8,
    'Approved. Advance payment for renovation is within budget allocation FY2026-Q2. Please coordinate with Toe San for Mandalay cash disbursement.',
    '192.168.1.103', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    '2026-05-30 05:45:00+00');

-- -------------------------------------------------------------------------
-- Logs for Request 5 (PRF-2026-005) — PAID (terminal) lifecycle
-- Full workflow: CREATED → SUBMITTED → MGR_REVIEW_START → MGR_VERIFIED
--                → SUBMITTED → APPR_REVIEW_START → APPROVED → PAYMENT_COMPLETED
-- -------------------------------------------------------------------------
INSERT INTO approval_logs (payment_request_id, action_taken_by_user_id, action_type_id, previous_status_id, new_status_id, comment, ip_address, user_agent, timestamp) VALUES
-- Step 1: Draft created by applicant (Soe Htet Lin, user_id=1)
(5, 1, 1, NULL, 1,
    NULL,
    '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0',
    '2026-05-15 03:00:00+00'),

-- Step 2: Submitted to Manager
(5, 1, 3, 1, 2,
    NULL,
    '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0',
    '2026-05-15 04:00:00+00'),

-- Step 3: Manager review started
(5, 2, 4, 2, 3,
    NULL,
    '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/127.0',
    '2026-05-16 01:30:00+00'),

-- Step 4: Manager verified
(5, 2, 5, 3, 4,
    'Event expenses verified. Catering invoice and venue contract copies attached and confirmed.',
    '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/127.0',
    '2026-05-16 02:00:00+00'),

-- Step 5: Submitted to Final Approver
(5, 1, 3, 4, 6,
    NULL,
    '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0',
    '2026-05-16 06:00:00+00'),

-- Step 6: Approver review started
(5, 3, 7, 6, 7,
    NULL,
    '192.168.1.103', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    '2026-05-17 03:00:00+00'),

-- Step 7: Final Approver approved
(5, 3, 8, 7, 8,
    'Approved. Team building is essential for staff morale. Within HR welfare budget.',
    '192.168.1.103', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
    '2026-05-17 03:30:00+00'),

-- Step 8: Accounting completed payment (terminal action)
(5, 4, 10, 8, 10,
    'Bank transfer completed via CB Bank. Reference: CBB-TXN-20260520-0847. Payment settled.',
    '192.168.1.104', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0',
    '2026-05-20 04:00:00+00');

-- -------------------------------------------------------------------------
-- Logs for Request 2 (PRF-2026-002) — SUBMITTED_MANAGER (partial lifecycle)
-- -------------------------------------------------------------------------
INSERT INTO approval_logs (payment_request_id, action_taken_by_user_id, action_type_id, previous_status_id, new_status_id, comment, ip_address, user_agent, timestamp) VALUES
(2, 1, 1, NULL, 1,
    NULL,
    '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0',
    '2026-06-10 08:00:00+00'),

(2, 1, 3, 1, 2,
    NULL,
    '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0',
    '2026-06-10 09:30:00+00');

-- -------------------------------------------------------------------------
-- Logs for Request 3 (PRF-2026-003) — MANAGER_VERIFIED (partial lifecycle)
-- -------------------------------------------------------------------------
INSERT INTO approval_logs (payment_request_id, action_taken_by_user_id, action_type_id, previous_status_id, new_status_id, comment, ip_address, user_agent, timestamp) VALUES
(3, 1, 1, NULL, 1,
    NULL,
    '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0',
    '2026-06-05 05:00:00+00'),

(3, 1, 3, 1, 2,
    NULL,
    '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0',
    '2026-06-05 06:00:00+00'),

(3, 2, 4, 2, 3,
    NULL,
    '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/127.0',
    '2026-06-06 03:00:00+00'),

(3, 2, 5, 3, 4,
    'Travel expenses verified. Airline e-ticket and hotel invoice match claim amounts.',
    '192.168.1.102', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/127.0',
    '2026-06-06 03:15:00+00');

-- -------------------------------------------------------------------------
-- Log for Request 1 (PRF-2026-001) — DRAFT (creation only)
-- -------------------------------------------------------------------------
INSERT INTO approval_logs (payment_request_id, action_taken_by_user_id, action_type_id, previous_status_id, new_status_id, comment, ip_address, user_agent, timestamp) VALUES
(1, 1, 1, NULL, 1,
    NULL,
    '192.168.1.101', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0.0.0',
    '2026-06-12 04:00:00+00');

-- Re-enable the immutability trigger after seeding
CREATE TRIGGER trg_approval_logs_immutable
BEFORE UPDATE OR DELETE ON approval_logs
FOR EACH ROW
EXECUTE FUNCTION protect_approval_logs_immutability();

-- =============================================================================
-- 11. MOCK DATA SEEDING — RECEIPT FILES (for requests with has_receipt=TRUE)
-- =============================================================================

INSERT INTO receipt_files (payment_request_id, original_file_name, stored_file_name, file_storage_path, file_size, mime_type, uploaded_by_user_id, uploaded_date, is_deleted) VALUES
-- Request 2 (AWS invoice)
(2, 'aws_invoice_june_2026.pdf',
    'f47ac10b-58cc-4372-a567-0e02b2c3d479.pdf',
    '/uploads/receipts/2026/06/',
    2457600, 'application/pdf', 1,
    '2026-06-10 08:30:00+00', FALSE),

-- Request 3 (Travel receipts)
(3, 'airline_eticket_ygn_mdy.pdf',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890.pdf',
    '/uploads/receipts/2026/06/',
    1843200, 'application/pdf', 1,
    '2026-06-05 05:15:00+00', FALSE),

(3, 'hotel_invoice_mandalay_hill.jpg',
    'b2c3d4e5-f6a7-8901-bcde-f12345678901.jpg',
    '/uploads/receipts/2026/06/',
    3276800, 'image/jpeg', 1,
    '2026-06-05 05:20:00+00', FALSE),

-- Request 4 (Contractor quotation)
(4, 'contractor_quotation_glc_mdy.pdf',
    'c3d4e5f6-a7b8-9012-cdef-123456789012.pdf',
    '/uploads/receipts/2026/05/',
    4915200, 'application/pdf', 4,
    '2026-05-28 03:30:00+00', FALSE),

-- Request 5 (Event invoices)
(5, 'venue_rental_agreement.pdf',
    'd4e5f6a7-b8c9-0123-defa-234567890123.pdf',
    '/uploads/receipts/2026/05/',
    1024000, 'application/pdf', 1,
    '2026-05-15 03:15:00+00', FALSE),

(5, 'catering_invoice_inya_lake.png',
    'e5f6a7b8-c9d0-1234-efab-345678901234.png',
    '/uploads/receipts/2026/05/',
    2150400, 'image/png', 1,
    '2026-05-15 03:20:00+00', FALSE);

-- =============================================================================
-- 12. FINALIZE — COMMIT TRANSACTION
-- =============================================================================

COMMIT;

-- =============================================================================
-- END OF DATABASE BACKUP DUMP FILE
-- =============================================================================
