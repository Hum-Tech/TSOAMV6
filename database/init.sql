-- TSOAM Church Management System Database Schema
-- This file initializes the complete database structure

-- ============================================
-- SYSTEM TABLES
-- ============================================

-- Users and Authentication
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'HR Officer', 'Finance Officer', 'User') NOT NULL,
    employee_id VARCHAR(50),
    department VARCHAR(100),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT FALSE,
    is_demo_user BOOLEAN DEFAULT TRUE,
    can_create_accounts BOOLEAN DEFAULT FALSE,
    can_delete_accounts BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP NULL,
    session_expires TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(255) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_category VARCHAR(100) DEFAULT 'general',
    is_editable BOOLEAN DEFAULT TRUE,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- MEMBER MANAGEMENT
-- ============================================

-- Visitors Register
CREATE TABLE IF NOT EXISTS visitors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    purpose VARCHAR(255),
    current_church VARCHAR(255),
    prayer_requests TEXT,
    visit_date DATE NOT NULL,
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Members
CREATE TABLE IF NOT EXISTS members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    member_id VARCHAR(50) UNIQUE NOT NULL,
    tithe_number VARCHAR(50) UNIQUE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender ENUM('Male', 'Female'),
    marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed'),
    occupation VARCHAR(255),
    employer VARCHAR(255),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    membership_date DATE,
    baptism_date DATE,
    baptism_status ENUM('Not Baptized', 'Baptized', 'Planning'),
    bible_study_completion DATE,
    service_groups JSON,
    spiritual_status ENUM('Visitor', 'New Member', 'Full Member'),
    member_status ENUM('Active', 'Inactive', 'Suspended', 'Excommunicated') DEFAULT 'Active',
    status_reason TEXT,
    status_changed_by VARCHAR(50),
    status_changed_date TIMESTAMP,
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- FINANCE MANAGEMENT
-- ============================================

-- Financial Transactions
CREATE TABLE IF NOT EXISTS financial_transactions (
    id VARCHAR(50) PRIMARY KEY,
    transaction_type ENUM('Income', 'Expense', 'Investment') NOT NULL,
    category VARCHAR(255) NOT NULL,
    subcategory VARCHAR(255),
    description TEXT NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'KSH',
    payment_method VARCHAR(100),
    reference_number VARCHAR(255),
    status ENUM('Pending', 'Completed', 'Cancelled') DEFAULT 'Pending',
    transaction_date DATE NOT NULL,
    preacher VARCHAR(255),
    service_type VARCHAR(100),
    giver_name VARCHAR(255),
    supplier VARCHAR(255),
    receipt_number VARCHAR(255),
    approved_by VARCHAR(255),
    vat_amount DECIMAL(10,2),
    vat_number VARCHAR(100),
    account_code VARCHAR(20),
    department VARCHAR(100),
    notes TEXT,
    investment_type VARCHAR(100),
    roi DECIMAL(5,2),
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Investment Records
CREATE TABLE IF NOT EXISTS investments (
    id VARCHAR(50) PRIMARY KEY,
    investment_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    initial_amount DECIMAL(15,2) DEFAULT 0,
    current_value DECIMAL(15,2) DEFAULT 0,
    income DECIMAL(15,2) DEFAULT 0,
    expenses DECIMAL(15,2) DEFAULT 0,
    roi DECIMAL(5,2) DEFAULT 0,
    start_date DATE,
    status ENUM('Active', 'Inactive', 'Sold') DEFAULT 'Active',
    location VARCHAR(255),
    notes TEXT,
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(50) PRIMARY KEY,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_address TEXT,
    client_phone VARCHAR(20),
    client_email VARCHAR(255),
    invoice_date DATE NOT NULL,
    due_date DATE,
    subtotal DECIMAL(15,2) NOT NULL,
    vat_rate DECIMAL(5,2) DEFAULT 16.00,
    vat_amount DECIMAL(15,2),
    total_amount DECIMAL(15,2) NOT NULL,
    payment_terms TEXT,
    notes TEXT,
    status ENUM('Draft', 'Sent', 'Paid', 'Overdue') DEFAULT 'Draft',
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    invoice_id VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
);

-- ============================================
-- HR MANAGEMENT
-- ============================================

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender ENUM('Male', 'Female'),
    national_id VARCHAR(20),
    kra_pin VARCHAR(20),
    nssf_number VARCHAR(50),
    nhif_number VARCHAR(50),
    position VARCHAR(255),
    department VARCHAR(100),
    employment_type ENUM('Full-time', 'Part-time', 'Volunteer', 'Contract'),
    employment_date DATE,
    basic_salary DECIMAL(15,2) DEFAULT 0,
    allowances DECIMAL(15,2) DEFAULT 0,
    status ENUM('Active', 'Suspended', 'Terminated', 'On Leave') DEFAULT 'Active',
    status_reason TEXT,
    status_changed_by VARCHAR(50),
    status_changed_date TIMESTAMP,
    annual_leave_balance INT DEFAULT 21,
    sick_leave_balance INT DEFAULT 14,
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Leave Requests
CREATE TABLE IF NOT EXISTS leave_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    leave_type ENUM('Annual', 'Sick', 'Maternity', 'Paternity', 'Emergency', 'Study', 'Compassionate') NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INT NOT NULL,
    reason TEXT,
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    approved_by VARCHAR(50),
    approved_date TIMESTAMP NULL,
    comments TEXT,
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- Payroll Records
CREATE TABLE IF NOT EXISTS payroll_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    employee_id INT NOT NULL,
    pay_period_start DATE NOT NULL,
    pay_period_end DATE NOT NULL,
    basic_salary DECIMAL(15,2) NOT NULL,
    allowances DECIMAL(15,2) DEFAULT 0,
    overtime DECIMAL(15,2) DEFAULT 0,
    gross_pay DECIMAL(15,2) NOT NULL,
    paye_tax DECIMAL(15,2) DEFAULT 0,
    nssf_deduction DECIMAL(15,2) DEFAULT 0,
    nhif_deduction DECIMAL(15,2) DEFAULT 0,
    housing_levy DECIMAL(15,2) DEFAULT 0,
    other_deductions DECIMAL(15,2) DEFAULT 0,
    total_deductions DECIMAL(15,2) DEFAULT 0,
    net_pay DECIMAL(15,2) NOT NULL,
    is_demo_data BOOLEAN DEFAULT FALSE,
    processed_by VARCHAR(50),
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
);

-- ============================================
-- INVENTORY MANAGEMENT
-- ============================================

-- Inventory Items
CREATE TABLE IF NOT EXISTS inventory_items (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    serial_number VARCHAR(255),
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    brand VARCHAR(255),
    model VARCHAR(255),
    description TEXT,
    purchase_date DATE,
    purchase_price DECIMAL(15,2) DEFAULT 0,
    current_value DECIMAL(15,2) DEFAULT 0,
    supplier VARCHAR(255),
    warranty_info VARCHAR(255),
    location VARCHAR(255),
    assigned_to VARCHAR(255),
    status ENUM('Working', 'Faulty', 'Under Maintenance', 'Missing', 'Disposed') DEFAULT 'Working',
    condition_status ENUM('Excellent', 'Good', 'Fair', 'Poor', 'Damaged') DEFAULT 'Good',
    maintenance_schedule VARCHAR(100),
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    qr_code VARCHAR(255),
    notes TEXT,
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Maintenance Records
CREATE TABLE IF NOT EXISTS maintenance_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    maintenance_type ENUM('Routine', 'Repair', 'Replacement', 'Inspection') NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(10,2) DEFAULT 0,
    performed_by VARCHAR(255),
    performed_date DATE,
    next_due_date DATE,
    status ENUM('Completed', 'Pending', 'In Progress') DEFAULT 'Completed',
    notes TEXT,
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- Disposal Records
CREATE TABLE IF NOT EXISTS disposal_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    item_id INT NOT NULL,
    disposal_reason ENUM('End of Life', 'Irreparable', 'Obsolete', 'Lost', 'Stolen') NOT NULL,
    disposal_method ENUM('Repair', 'Sell', 'Donate', 'Scrap', 'Return to Supplier') NOT NULL,
    disposal_date DATE NOT NULL,
    disposal_value DECIMAL(10,2) DEFAULT 0,
    authorized_by VARCHAR(255) NOT NULL,
    recipient VARCHAR(255),
    notes TEXT,
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE CASCADE
);

-- ============================================
-- WELFARE MANAGEMENT
-- ============================================

-- Welfare Requests
CREATE TABLE IF NOT EXISTS welfare_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    request_id VARCHAR(50) UNIQUE NOT NULL,
    member_id INT,
    request_type ENUM('Medical', 'Rent', 'Business', 'School Fees') NOT NULL,
    amount_requested DECIMAL(15,2) NOT NULL,
    reason TEXT NOT NULL,
    supporting_documents JSON,
    status ENUM('Pending', 'Under Review', 'Approved', 'Rejected', 'Disbursed') DEFAULT 'Pending',
    reviewed_by VARCHAR(50),
    review_date TIMESTAMP NULL,
    review_comments TEXT,
    amount_approved DECIMAL(15,2),
    disbursement_date DATE,
    disbursed_by VARCHAR(50),
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
);

-- Welfare Budget
CREATE TABLE IF NOT EXISTS welfare_budget (
    id INT PRIMARY KEY AUTO_INCREMENT,
    service_type ENUM('Medical', 'Rent', 'Business', 'School Fees') NOT NULL,
    allocated_amount DECIMAL(15,2) NOT NULL,
    used_amount DECIMAL(15,2) DEFAULT 0,
    budget_year YEAR NOT NULL,
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- MESSAGING SYSTEM
-- ============================================

-- Message History
CREATE TABLE IF NOT EXISTS message_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    message_id VARCHAR(50) UNIQUE NOT NULL,
    message_type ENUM('SMS', 'Email') NOT NULL,
    recipient_type ENUM('Individual', 'Group') NOT NULL,
    recipient_list JSON NOT NULL,
    subject VARCHAR(500),
    message_content TEXT NOT NULL,
    recipient_count INT NOT NULL,
    sent_count INT DEFAULT 0,
    delivered_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    status ENUM('Pending', 'Sending', 'Sent', 'Failed') DEFAULT 'Pending',
    sent_by VARCHAR(50) NOT NULL,
    scheduled_date TIMESTAMP NULL,
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Message Templates
CREATE TABLE IF NOT EXISTS message_templates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    template_name VARCHAR(255) NOT NULL,
    template_type ENUM('SMS', 'Email') NOT NULL,
    category VARCHAR(100),
    subject VARCHAR(500),
    content TEXT NOT NULL,
    variables JSON,
    is_active BOOLEAN DEFAULT TRUE,
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- EVENTS AND APPOINTMENTS
-- ============================================

-- Events
CREATE TABLE IF NOT EXISTS events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_title VARCHAR(255) NOT NULL,
    event_description TEXT,
    event_type VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    organizer VARCHAR(255),
    max_attendees INT,
    registration_required BOOLEAN DEFAULT FALSE,
    status ENUM('Planned', 'Active', 'Completed', 'Cancelled') DEFAULT 'Planned',
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Appointments
CREATE TABLE IF NOT EXISTS appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    appointment_title VARCHAR(255) NOT NULL,
    appointment_type VARCHAR(100),
    member_id INT,
    staff_member VARCHAR(255),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    purpose TEXT,
    status ENUM('Scheduled', 'Completed', 'Cancelled', 'No Show') DEFAULT 'Scheduled',
    notes TEXT,
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL
);

-- ============================================
-- AUDIT AND LOGGING
-- ============================================

-- System Logs
CREATE TABLE IF NOT EXISTS system_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    log_type ENUM('Login', 'Logout', 'Create', 'Update', 'Delete', 'Export', 'Error') NOT NULL,
    user_id VARCHAR(50),
    action_description TEXT NOT NULL,
    table_affected VARCHAR(100),
    record_id VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_demo_data BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- INSERT INITIAL DATA
-- ============================================

-- Insert System Settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, setting_category, is_editable) VALUES
('church_name', 'TSOAM CHURCH INTERNATIONAL', 'general', FALSE),
('church_address', 'P.O. Box 123, Nairobi, Kenya', 'general', TRUE),
('church_phone', '+254 700 123456', 'general', TRUE),
('church_email', 'admin@tsoam.com', 'general', TRUE),
('currency_default', 'KSH', 'financial', TRUE),
('timezone', 'Africa/Nairobi', 'general', TRUE),
('backup_enabled', 'true', 'system', TRUE),
('backup_frequency', 'daily', 'system', TRUE);

-- Insert Demo Users (These are marked as demo data)
INSERT IGNORE INTO users (id, name, email, password_hash, role, employee_id, department, phone, is_active, is_demo_user, can_create_accounts, can_delete_accounts) VALUES
('admin', 'Humphrey Njoroge', 'admin@tsoam.com', '$2b$10$9Q5XqI7Kz8QQ5KJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ', 'Admin', 'EMP-001', 'Administration', '+254 700 890123', TRUE, TRUE, TRUE, TRUE),
('pastor', 'Pastor James Kuria', 'pastor.james@tsoam.com', '$2b$10$9Q5XqI7Kz8QQ5KJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ', 'Admin', 'EMP-002', 'Ministry Leadership', '+254 700 789012', TRUE, TRUE, TRUE, FALSE),
('hr', 'HR Officer', 'hr@tsoam.com', '$2b$10$9Q5XqI7Kz8QQ5KJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ', 'HR Officer', 'EMP-003', 'Human Resources', '+254 701 012345', TRUE, TRUE, FALSE, FALSE),
('finance', 'Finance Officer', 'finance@tsoam.com', '$2b$10$9Q5XqI7Kz8QQ5KJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ', 'Finance Officer', 'EMP-004', 'Finance', '+254 700 901234', TRUE, TRUE, FALSE, FALSE),
('user', 'Regular User', 'user@tsoam.com', '$2b$10$9Q5XqI7Kz8QQ5KJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ5QJ', 'User', 'EMP-005', 'General', '+254 701 123456', TRUE, TRUE, FALSE, FALSE);

-- Insert Demo Members (marked as demo data)
INSERT IGNORE INTO members (member_id, tithe_number, first_name, last_name, email, phone, gender, marital_status, membership_date, spiritual_status, service_groups, is_demo_data) VALUES
('TS-2024-001', 'TS-001', 'John', 'Doe', 'john.doe@tsoam.com', '+254 700 123456', 'Male', 'Married', '2024-01-15', 'Full Member', '["Ushering Team"]', TRUE),
('TS-2024-002', 'TS-002', 'Mary', 'Wanjiku', 'mary.wanjiku@tsoam.com', '+254 700 234567', 'Female', 'Single', '2024-02-20', 'Full Member', '["Choir"]', TRUE),
('TS-2024-003', 'TS-003', 'Peter', 'Kamau', 'peter.kamau@tsoam.com', '+254 700 345678', 'Male', 'Single', '2024-03-10', 'New Member', '["Youth Ministry"]', TRUE),
('TS-2024-004', 'TS-004', 'Grace', 'Muthoni', 'grace.muthoni@tsoam.com', '+254 700 456789', 'Female', 'Married', '2024-01-05', 'Full Member', '["Women\'s Ministry"]', TRUE);

-- Insert Demo Financial Transactions
INSERT IGNORE INTO financial_transactions (id, transaction_type, category, description, amount, currency, transaction_date, status, is_demo_data) VALUES
('TXN-2025-001', 'Income', 'Normal Offering', 'Sunday main service offering collection', 45000.00, 'KSH', '2025-01-15', 'Completed', TRUE),
('TXN-2025-002', 'Income', 'Tithe', 'Monthly tithe payment from member', 25000.00, 'KSH', '2025-01-14', 'Completed', TRUE),
('TXN-2025-003', 'Expense', 'Utilities', 'Electricity bill payment', 15000.00, 'KSH', '2025-01-12', 'Completed', TRUE);

-- Insert Demo Welfare Budget
INSERT IGNORE INTO welfare_budget (service_type, allocated_amount, budget_year, is_demo_data) VALUES
('Medical', 200000.00, 2025, TRUE),
('Rent', 150000.00, 2025, TRUE),
('Business', 300000.00, 2025, TRUE),
('School Fees', 250000.00, 2025, TRUE);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_members_email ON members(email);
CREATE INDEX IF NOT EXISTS idx_members_phone ON members(phone);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON financial_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_system_logs_date ON system_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_employees_email ON employees(email);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory_items(status);
CREATE INDEX IF NOT EXISTS idx_welfare_status ON welfare_requests(status);

-- Views for reporting
CREATE OR REPLACE VIEW v_active_members AS
SELECT * FROM members WHERE member_status = 'Active' AND is_demo_data = FALSE;

CREATE OR REPLACE VIEW v_financial_summary AS
SELECT 
    transaction_type,
    category,
    SUM(amount) as total_amount,
    COUNT(*) as transaction_count,
    DATE(transaction_date) as transaction_date
FROM financial_transactions 
WHERE is_demo_data = FALSE
GROUP BY transaction_type, category, DATE(transaction_date);

-- ============================================
-- STORED PROCEDURES
-- ============================================

DELIMITER //

-- Procedure to clean demo data
CREATE PROCEDURE CleanDemoData()
BEGIN
    DELETE FROM system_logs WHERE is_demo_data = TRUE;
    DELETE FROM message_history WHERE is_demo_data = TRUE;
    DELETE FROM welfare_requests WHERE is_demo_data = TRUE;
    DELETE FROM financial_transactions WHERE is_demo_data = TRUE;
    DELETE FROM members WHERE is_demo_data = TRUE;
    DELETE FROM employees WHERE is_demo_data = TRUE;
    DELETE FROM inventory_items WHERE is_demo_data = TRUE;
    DELETE FROM events WHERE is_demo_data = TRUE;
    DELETE FROM appointments WHERE is_demo_data = TRUE;
END //

-- Procedure to backup system data (excluding demo data)
CREATE PROCEDURE BackupSystemData()
BEGIN
    CREATE TABLE IF NOT EXISTS backup_members AS SELECT * FROM members WHERE is_demo_data = FALSE;
    CREATE TABLE IF NOT EXISTS backup_financial_transactions AS SELECT * FROM financial_transactions WHERE is_demo_data = FALSE;
    CREATE TABLE IF NOT EXISTS backup_employees AS SELECT * FROM employees WHERE is_demo_data = FALSE;
END //

DELIMITER ;

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON *.* TO 'church_admin'@'localhost' IDENTIFIED BY 'secure_password';
-- FLUSH PRIVILEGES;
