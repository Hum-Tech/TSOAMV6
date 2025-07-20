-- TSOAM Church Management System Database Schema
-- Complete database structure for all modules

USE tsoam_church_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'HR Officer', 'Finance Officer', 'User') DEFAULT 'User',
    department VARCHAR(100),
    employee_id VARCHAR(50),
    phone VARCHAR(20),
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    profile_picture TEXT,
    address TEXT,
    
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
);

-- Password Reset Table
CREATE TABLE IF NOT EXISTS password_resets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    reset_code VARCHAR(6) NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    used BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    
    INDEX idx_email (email),
    INDEX idx_reset_code (reset_code),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_id (user_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- User Account Requests Table
CREATE TABLE IF NOT EXISTS user_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL,
    department VARCHAR(100),
    employee_id VARCHAR(50),
    requested_by VARCHAR(255),
    ip_address VARCHAR(45),
    request_reason TEXT,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,
    processed_by VARCHAR(50),
    
    INDEX idx_status (status),
    INDEX idx_email (email)
);

-- Members Table
CREATE TABLE IF NOT EXISTS members (
    id VARCHAR(50) PRIMARY KEY,
    member_id VARCHAR(50) UNIQUE NOT NULL,
    tithe_number VARCHAR(50) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed'),
    address TEXT,
    occupation VARCHAR(100),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    membership_date DATE,
    baptism_date DATE,
    confirmation_date DATE,
    department VARCHAR(100),
    position VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_member_id (member_id),
    INDEX idx_tithe_number (tithe_number),
    INDEX idx_email (email),
    INDEX idx_active (is_active)
);

-- Financial Transactions Table
CREATE TABLE IF NOT EXISTS financial_transactions (
    id VARCHAR(50) PRIMARY KEY,
    transaction_id VARCHAR(50) UNIQUE NOT NULL,
    type ENUM('Income', 'Expense') NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    amount DECIMAL(15,2) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    member_id VARCHAR(50),
    created_by VARCHAR(50),
    approved_by VARCHAR(50),
    status ENUM('Pending', 'Approved', 'Rejected') DEFAULT 'Pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_type (type),
    INDEX idx_category (category),
    INDEX idx_date (date),
    INDEX idx_member_id (member_id),
    INDEX idx_status (status),
    
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Tithe Records Table
CREATE TABLE IF NOT EXISTS tithe_records (
    id VARCHAR(50) PRIMARY KEY,
    tithe_id VARCHAR(50) UNIQUE NOT NULL,
    member_id VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(50),
    payment_reference VARCHAR(100),
    tithe_date DATE NOT NULL,
    category ENUM('Tithe', 'Offering', 'Building Fund', 'Mission', 'Welfare') DEFAULT 'Tithe',
    received_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_member_id (member_id),
    INDEX idx_tithe_date (tithe_date),
    INDEX idx_category (category),
    
    FOREIGN KEY (member_id) REFERENCES members(id) ON DELETE CASCADE
);

-- HR Employee Records Table
CREATE TABLE IF NOT EXISTS employees (
    id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    position VARCHAR(100),
    department VARCHAR(100),
    hire_date DATE,
    basic_salary DECIMAL(12,2),
    housing_allowance DECIMAL(12,2) DEFAULT 0,
    transport_allowance DECIMAL(12,2) DEFAULT 0,
    medical_allowance DECIMAL(12,2) DEFAULT 0,
    status ENUM('Active', 'Inactive', 'Terminated') DEFAULT 'Active',
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_employee_id (employee_id),
    INDEX idx_status (status),
    INDEX idx_department (department)
);

-- Welfare Applications Table
CREATE TABLE IF NOT EXISTS welfare_applications (
    id VARCHAR(50) PRIMARY KEY,
    application_id VARCHAR(50) UNIQUE NOT NULL,
    applicant_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    monthly_income DECIMAL(12,2),
    dependents INT DEFAULT 0,
    assistance_type VARCHAR(100) NOT NULL,
    amount_requested DECIMAL(12,2) NOT NULL,
    reason TEXT,
    supporting_documents TEXT,
    status ENUM('Pending', 'Under Review', 'Approved', 'Rejected') DEFAULT 'Pending',
    reviewed_by VARCHAR(50),
    review_date DATE,
    review_notes TEXT,
    amount_approved DECIMAL(12,2),
    disbursement_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_assistance_type (assistance_type),
    INDEX idx_application_date (created_at)
);

-- Inventory Items Table
CREATE TABLE IF NOT EXISTS inventory (
    id VARCHAR(50) PRIMARY KEY,
    item_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    purchase_date DATE,
    purchase_price DECIMAL(12,2),
    current_value DECIMAL(12,2),
    condition_status ENUM('Excellent', 'Good', 'Fair', 'Poor', 'Needs Repair') DEFAULT 'Good',
    location VARCHAR(255),
    responsible_person VARCHAR(255),
    maintenance_schedule VARCHAR(100),
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    warranty_expiry DATE,
    supplier VARCHAR(255),
    quantity INT DEFAULT 1,
    minimum_quantity INT DEFAULT 0,
    unit_price DECIMAL(10,2),
    status ENUM('Active', 'Inactive', 'Disposed') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_item_id (item_id),
    INDEX idx_category (category),
    INDEX idx_status (status)
);

-- Events Table
CREATE TABLE IF NOT EXISTS events (
    id VARCHAR(50) PRIMARY KEY,
    event_id VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100),
    start_date DATE NOT NULL,
    end_date DATE,
    start_time TIME,
    end_time TIME,
    location VARCHAR(255),
    organizer VARCHAR(255),
    expected_attendance INT,
    budget DECIMAL(12,2),
    status ENUM('Planning', 'Confirmed', 'In Progress', 'Completed', 'Cancelled') DEFAULT 'Planning',
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_start_date (start_date),
    INDEX idx_event_type (event_type),
    INDEX idx_status (status),
    
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- System Logs Table
CREATE TABLE IF NOT EXISTS system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    action VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    details TEXT,
    severity ENUM('Info', 'Warning', 'Error', 'Critical') DEFAULT 'Info',
    user_id VARCHAR(50),
    ip_address VARCHAR(45),
    user_agent TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_action (action),
    INDEX idx_module (module),
    INDEX idx_severity (severity),
    INDEX idx_timestamp (timestamp),
    INDEX idx_user_id (user_id),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- System Settings Table
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    category VARCHAR(50),
    description TEXT,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_category (category),
    
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Default Admin User (password: admin123)
INSERT IGNORE INTO users (id, name, email, password_hash, role, is_active, created_at) VALUES 
('admin-001', 'System Administrator', 'admin@tsoam.org', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewDjCNVJ7q7Y.Fqe', 'Admin', TRUE, NOW());

-- Default System Settings
INSERT IGNORE INTO system_settings (setting_key, setting_value, category, description) VALUES 
('church_name', 'The Seed of Abraham Ministry', 'general', 'Official church name'),
('church_email', 'info@tsoam.org', 'contact', 'Primary church email address'),
('church_phone', '+254-700-000-000', 'contact', 'Primary church phone number'),
('church_address', 'Nairobi, Kenya', 'contact', 'Church physical address'),
('backup_frequency', 'daily', 'backup', 'Automatic backup frequency'),
('backup_retention_days', '30', 'backup', 'Number of days to retain backups'),
('max_login_attempts', '5', 'security', 'Maximum login attempts before lockout'),
('session_timeout_minutes', '60', 'security', 'Session timeout in minutes'),
('otp_required_roles', 'Admin,HR Officer', 'security', 'Roles requiring OTP verification');

-- Create indexes for performance
CREATE INDEX idx_users_role_active ON users(role, is_active);
CREATE INDEX idx_transactions_date_type ON financial_transactions(date, type);
CREATE INDEX idx_members_active_department ON members(is_active, department);
CREATE INDEX idx_logs_timestamp_severity ON system_logs(timestamp, severity);

COMMIT;
