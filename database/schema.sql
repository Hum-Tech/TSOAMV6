-- TSOAM Church Management System Database Schema
-- This file contains the complete database structure for localhost deployment

-- Create database
CREATE DATABASE IF NOT EXISTS tsoam_church_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tsoam_church_db;

-- Users table
CREATE TABLE users (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'HR Officer', 'Finance Officer', 'User') NOT NULL,
    department VARCHAR(100),
    employee_id VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    can_create_accounts BOOLEAN DEFAULT FALSE,
    can_delete_accounts BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Members table (for full members who have completed the transition)
CREATE TABLE members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id VARCHAR(50) UNIQUE NOT NULL, -- TSOAM2025-001
    tithe_number VARCHAR(50) UNIQUE NOT NULL, -- T2025-001
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    date_of_birth DATE,
    gender ENUM('Male', 'Female') NOT NULL,
    marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed'),
    occupation VARCHAR(255),
    employment_status ENUM('Employed', 'Jobless', 'Business Class'),
    status ENUM('Active', 'Inactive', 'Suspended', 'Excommunicated') DEFAULT 'Active',
    join_date DATE, -- Original join date as new member
    membership_date DATE, -- Date became full member
    baptized BOOLEAN DEFAULT FALSE,
    baptism_date DATE,
    bible_study_completed BOOLEAN DEFAULT FALSE,
    bible_study_completion_date DATE,
    service_groups JSON, -- Array of service groups
    previous_church_name VARCHAR(255),
    reason_for_leaving_previous_church ENUM('Suspension', 'Termination', 'Self-Evolution', 'Relocation', 'Other'),
    reason_details TEXT,
    how_heard_about_us VARCHAR(100),
    born_again BOOLEAN DEFAULT FALSE,
    church_feedback TEXT,
    prayer_requests TEXT,
    transferred_from_new_member_id INT, -- Reference to new_members table
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- New Members table (for those still in transition process)
CREATE TABLE new_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    visitor_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    date_of_birth DATE,
    gender ENUM('Male', 'Female') NOT NULL,
    marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed'),
    address TEXT,
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(20),
    visit_date DATE NOT NULL,
    baptized BOOLEAN DEFAULT FALSE,
    baptism_date DATE,
    bible_study_completed BOOLEAN DEFAULT FALSE,
    bible_study_completion_date DATE,
    employment_status ENUM('Employed', 'Jobless', 'Business Class'),
    previous_church_name VARCHAR(255),
    reason_for_leaving_previous_church ENUM('Suspension', 'Termination', 'Self-Evolution', 'Relocation', 'Other'),
    reason_details TEXT,
    how_heard_about_us VARCHAR(100),
    purpose_of_visit TEXT,
    born_again BOOLEAN DEFAULT FALSE,
    eligibility_for_transfer BOOLEAN GENERATED ALWAYS AS (
        baptized = TRUE AND
        bible_study_completed = TRUE AND
        DATEDIFF(CURDATE(), visit_date) >= 180 -- 6 months minimum
    ) STORED,
    transferred_to_member BOOLEAN DEFAULT FALSE,
    transferred_date DATE NULL,
    status ENUM('Active', 'Transferred', 'Inactive') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- HR Employees table
CREATE TABLE employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    position VARCHAR(255),
    department VARCHAR(100),
    employment_type ENUM('Full-time', 'Part-time', 'Volunteer'),
    hire_date DATE,
    salary DECIMAL(10,2),
    allowances DECIMAL(10,2) DEFAULT 0,
    deductions DECIMAL(10,2) DEFAULT 0,
    gender ENUM('Male', 'Female'),
    bank_name VARCHAR(255),
    bank_account VARCHAR(50),
    kra_pin VARCHAR(20),
    nssf_number VARCHAR(20),
    nhif_number VARCHAR(20),
    status ENUM('Active', 'Suspended', 'Terminated', 'On Leave') DEFAULT 'Active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Employee Documents table
CREATE TABLE employee_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    document_type ENUM('CV', 'ID', 'Certificate', 'License', 'Contract', 'Other') NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by VARCHAR(36),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Payroll table
CREATE TABLE payroll (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    pay_period VARCHAR(20) NOT NULL, -- YYYY-MM format
    basic_salary DECIMAL(10,2) NOT NULL,
    allowances DECIMAL(10,2) DEFAULT 0,
    overtime DECIMAL(10,2) DEFAULT 0,
    gross_salary DECIMAL(10,2) GENERATED ALWAYS AS (basic_salary + allowances + overtime) STORED,
    paye DECIMAL(10,2) DEFAULT 0,
    nssf DECIMAL(10,2) DEFAULT 0,
    nhif DECIMAL(10,2) DEFAULT 0,
    other_deductions DECIMAL(10,2) DEFAULT 0,
    total_deductions DECIMAL(10,2) GENERATED ALWAYS AS (paye + nssf + nhif + other_deductions) STORED,
    net_salary DECIMAL(10,2) GENERATED ALWAYS AS (gross_salary - total_deductions) STORED,
    processed_date DATE NOT NULL,
    processed_by VARCHAR(36),
    status ENUM('Pending', 'Processed', 'Paid') DEFAULT 'Pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id),
    FOREIGN KEY (processed_by) REFERENCES users(id),
    UNIQUE KEY unique_employee_period (employee_id, pay_period)
);

-- Leave Requests table
CREATE TABLE leave_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id INT NOT NULL,
    leave_type ENUM('Annual', 'Sick', 'Maternity', 'Paternity', 'Emergency', 'Study', 'Compassionate'),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    days_requested INT NOT NULL,
    reason TEXT,
    status ENUM('Pending', 'Approved', 'Denied') DEFAULT 'Pending',
    applied_date DATE DEFAULT (CURRENT_DATE),
    approved_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Finance Transactions table
CREATE TABLE transactions (
    id VARCHAR(50) PRIMARY KEY,
    type ENUM('Income', 'Expense', 'Investment') NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    description TEXT,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KSH',
    payment_method VARCHAR(50),
    reference VARCHAR(100),
    date DATE NOT NULL,
    status ENUM('Pending', 'Completed', 'Cancelled') DEFAULT 'Completed',
    account_code VARCHAR(20),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Expenses table
CREATE TABLE expenses (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'KSH',
    payment_method VARCHAR(50),
    supplier VARCHAR(255) NOT NULL,
    receipt_number VARCHAR(100),
    date DATE NOT NULL,
    approved_by VARCHAR(255),
    status ENUM('Pending', 'Approved', 'Paid', 'Cancelled') DEFAULT 'Pending',
    vat_amount DECIMAL(10,2),
    vat_number VARCHAR(50),
    account_code VARCHAR(20),
    department VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Investments table
CREATE TABLE investments (
    id VARCHAR(50) PRIMARY KEY,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    initial_amount DECIMAL(12,2) NOT NULL,
    current_value DECIMAL(12,2) NOT NULL,
    income DECIMAL(12,2) DEFAULT 0,
    expenses DECIMAL(12,2) DEFAULT 0,
    roi DECIMAL(5,2) DEFAULT 0,
    start_date DATE NOT NULL,
    status ENUM('Active', 'Completed', 'Suspended') DEFAULT 'Active',
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Welfare Requests table
CREATE TABLE welfare_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    request_id VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    age INT,
    phone_number VARCHAR(20) NOT NULL,
    email_address VARCHAR(255),
    residence VARCHAR(255) NOT NULL,
    city_state_zip VARCHAR(255) NOT NULL,
    marital_status ENUM('Single', 'Married', 'Divorced', 'Widowed'),
    dependents INT DEFAULT 0,
    membership_status ENUM('Active Member', 'Inactive Member', 'Non-Member') NOT NULL,
    membership_length VARCHAR(100),
    service_group VARCHAR(100) NOT NULL,
    service_group_status ENUM('Active', 'Inactive', 'Leadership'),
    tithe_status ENUM('Faithful Tither', 'Inconsistent Tither', 'Non-Tither') NOT NULL,
    midweek_attendance BOOLEAN DEFAULT FALSE,
    sunday_attendance BOOLEAN DEFAULT FALSE,
    events_attendance BOOLEAN DEFAULT FALSE,
    employment_status VARCHAR(100) NOT NULL,
    monthly_income DECIMAL(10,2) NOT NULL,
    government_assistance ENUM('Yes', 'No'),
    other_income_sources VARCHAR(255),
    financial_hardship TEXT NOT NULL,
    type_of_assistance_needed VARCHAR(100) NOT NULL,
    specific_amount_requested DECIMAL(10,2) NOT NULL,
    reason_for_request TEXT NOT NULL,
    status ENUM('Pending', 'Under Review', 'Approved', 'Denied', 'Completed') DEFAULT 'Pending',
    date_of_application DATE NOT NULL,
    applicant_signature VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Inventory Items table
CREATE TABLE inventory_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    item_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    description TEXT,
    quantity INT NOT NULL DEFAULT 0,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_value DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
    supplier VARCHAR(255),
    location VARCHAR(100) NOT NULL,
    status ENUM('Working', 'Faulty', 'Under Maintenance', 'Missing', 'Disposed') DEFAULT 'Working',
    purchase_date DATE,
    warranty_expiry DATE,
    last_maintenance DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Maintenance Records table
CREATE TABLE maintenance_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    item_id INT NOT NULL,
    maintenance_type ENUM('Routine', 'Repair', 'Replacement', 'Inspection') NOT NULL,
    description TEXT NOT NULL,
    cost DECIMAL(10,2) DEFAULT 0,
    technician VARCHAR(255),
    date_performed DATE NOT NULL,
    next_maintenance_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (item_id) REFERENCES inventory_items(id)
);

-- Events table
CREATE TABLE events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    event_type VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    location VARCHAR(255) NOT NULL,
    organizer VARCHAR(255),
    capacity INT,
    registration_required BOOLEAN DEFAULT FALSE,
    status ENUM('Scheduled', 'Ongoing', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    budget DECIMAL(10,2) DEFAULT 0,
    actual_cost DECIMAL(10,2) DEFAULT 0,
    attendees_count INT DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Appointments table
CREATE TABLE appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    client_name VARCHAR(255) NOT NULL,
    client_phone VARCHAR(20),
    client_email VARCHAR(255),
    appointment_type VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    duration_minutes INT DEFAULT 60,
    location VARCHAR(255),
    purpose TEXT,
    status ENUM('Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No Show') DEFAULT 'Scheduled',
    assigned_to VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id VARCHAR(36),
    recipient_type ENUM('Individual', 'Group', 'All') NOT NULL,
    recipient_ids TEXT, -- JSON array for multiple recipients
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    message_type ENUM('Email', 'SMS', 'In-App') NOT NULL,
    status ENUM('Draft', 'Sent', 'Delivered', 'Failed') DEFAULT 'Draft',
    sent_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id)
);

-- System Logs table
CREATE TABLE system_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(36),
    action VARCHAR(255) NOT NULL,
    module VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    severity ENUM('Info', 'Warning', 'Error', 'Critical') DEFAULT 'Info',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Document Uploads table
CREATE TABLE document_uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type ENUM('welfare', 'finance', 'inventory', 'member', 'employee') NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    document_category VARCHAR(100),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT,
    mime_type VARCHAR(100),
    uploaded_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id),
    INDEX idx_entity (entity_type, entity_id)
);

-- User creation requests table
CREATE TABLE user_requests (
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
    processed_by VARCHAR(36),
    processed_at TIMESTAMP NULL,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

-- Settings table
CREATE TABLE settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by VARCHAR(36),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

-- Insert default admin user (password: admin123)
INSERT INTO users (id, name, email, password_hash, role, can_create_accounts, can_delete_accounts) VALUES
('admin-001', 'System Administrator', 'admin@tsoam.org', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', TRUE, TRUE);

-- Insert sample settings
INSERT INTO settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('church_name', 'The Seed of Abraham Ministry (TSOAM)', 'string', 'Official church name', TRUE),
('church_address', 'Nairobi, Kenya', 'string', 'Church physical address', TRUE),
('church_phone', '+254 700 000 000', 'string', 'Church contact phone', TRUE),
('church_email', 'admin@tsoam.org', 'string', 'Church contact email', TRUE),
('currency', 'KSH', 'string', 'Default currency', TRUE),
('timezone', 'Africa/Nairobi', 'string', 'Default timezone', FALSE);
