-- TSOAM Church Management System - Database Optimization & Security
-- This file contains database optimizations, indexing, and security configurations
-- Run this file after importing the main schema for optimal performance

USE tsoam_church_db;

-- ========================================
-- DATABASE PERFORMANCE OPTIMIZATIONS
-- ========================================

-- Create indexes for frequently queried columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_login ON users(last_login);

CREATE INDEX idx_members_member_id ON members(member_id);
CREATE INDEX idx_members_tithe_number ON members(tithe_number);
CREATE INDEX idx_members_status ON members(status);
CREATE INDEX idx_members_join_date ON members(join_date);
CREATE INDEX idx_members_email ON members(email);

CREATE INDEX idx_new_members_visitor_id ON new_members(visitor_id);
CREATE INDEX idx_new_members_eligibility ON new_members(eligibility_for_transfer);
CREATE INDEX idx_new_members_status ON new_members(status);
CREATE INDEX idx_new_members_visit_date ON new_members(visit_date);

CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_department ON employees(department);
CREATE INDEX idx_employees_status ON employees(status);
CREATE INDEX idx_employees_email ON employees(email);

CREATE INDEX idx_payroll_employee_period ON payroll(employee_id, pay_period);
CREATE INDEX idx_payroll_status ON payroll(status);
CREATE INDEX idx_payroll_processed_date ON payroll(processed_date);

CREATE INDEX idx_transactions_type ON transactions(type);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_amount ON transactions(amount);

CREATE INDEX idx_expenses_category ON expenses(category);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_supplier ON expenses(supplier);

CREATE INDEX idx_welfare_status ON welfare_requests(status);
CREATE INDEX idx_welfare_date ON welfare_requests(date_of_application);
CREATE INDEX idx_welfare_membership ON welfare_requests(membership_status);

CREATE INDEX idx_inventory_category ON inventory_items(category);
CREATE INDEX idx_inventory_status ON inventory_items(status);
CREATE INDEX idx_inventory_location ON inventory_items(location);
CREATE INDEX idx_inventory_code ON inventory_items(item_code);

CREATE INDEX idx_events_date ON events(date);
CREATE INDEX idx_events_type ON events(event_type);
CREATE INDEX idx_events_status ON events(status);

CREATE INDEX idx_appointments_date ON appointments(date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_assigned ON appointments(assigned_to);

CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_messages_type ON messages(message_type);
CREATE INDEX idx_messages_status ON messages(status);
CREATE INDEX idx_messages_sent ON messages(sent_at);

CREATE INDEX idx_system_logs_user ON system_logs(user_id);
CREATE INDEX idx_system_logs_module ON system_logs(module);
CREATE INDEX idx_system_logs_severity ON system_logs(severity);
CREATE INDEX idx_system_logs_timestamp ON system_logs(timestamp);

CREATE INDEX idx_documents_entity ON document_uploads(entity_type, entity_id);
CREATE INDEX idx_documents_uploaded_by ON document_uploads(uploaded_by);

CREATE INDEX idx_user_requests_status ON user_requests(status);
CREATE INDEX idx_user_requests_created ON user_requests(created_at);

-- ========================================
-- COMPOSITE INDEXES FOR COMPLEX QUERIES
-- ========================================

CREATE INDEX idx_members_status_date ON members(status, join_date);
CREATE INDEX idx_transactions_type_date ON transactions(type, date);
CREATE INDEX idx_expenses_category_date ON expenses(category, date);
CREATE INDEX idx_events_status_date ON events(status, date);
CREATE INDEX idx_payroll_employee_status ON payroll(employee_id, status);

-- ========================================
-- DATABASE SECURITY CONFIGURATION
-- ========================================

-- Create dedicated database user for the application
-- This user has only the necessary privileges for the application to function

-- Drop user if exists (for clean setup)
DROP USER IF EXISTS 'tsoam_user'@'localhost';
DROP USER IF EXISTS 'tsoam_user'@'%';

-- Create application user with secure password
CREATE USER 'tsoam_user'@'localhost' IDENTIFIED BY 'TSOAM_2024_SecurePass!@#';
CREATE USER 'tsoam_user'@'%' IDENTIFIED BY 'TSOAM_2024_SecurePass!@#';

-- Grant only necessary privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON tsoam_church_db.* TO 'tsoam_user'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON tsoam_church_db.* TO 'tsoam_user'@'%';

-- Grant specific privileges for file operations
GRANT FILE ON *.* TO 'tsoam_user'@'localhost';

-- Create read-only user for reports and analytics
DROP USER IF EXISTS 'tsoam_readonly'@'localhost';
CREATE USER 'tsoam_readonly'@'localhost' IDENTIFIED BY 'TSOAM_Reports_2024!';
GRANT SELECT ON tsoam_church_db.* TO 'tsoam_readonly'@'localhost';

-- Create backup user
DROP USER IF EXISTS 'tsoam_backup'@'localhost';
CREATE USER 'tsoam_backup'@'localhost' IDENTIFIED BY 'TSOAM_Backup_2024!';
GRANT SELECT, LOCK TABLES, SHOW VIEW, EVENT, TRIGGER ON tsoam_church_db.* TO 'tsoam_backup'@'localhost';

-- ========================================
-- DATABASE VIEWS FOR COMMON QUERIES
-- ========================================

-- View: Active members with contact information
CREATE OR REPLACE VIEW view_active_members AS
SELECT 
    m.id,
    m.member_id,
    m.tithe_number,
    m.name,
    m.email,
    m.phone,
    m.status,
    m.join_date,
    m.membership_date,
    DATEDIFF(CURDATE(), m.membership_date) AS days_as_member
FROM members m
WHERE m.status = 'Active';

-- View: Employee payroll summary
CREATE OR REPLACE VIEW view_employee_payroll_current AS
SELECT 
    e.id,
    e.employee_id,
    e.name,
    e.position,
    e.department,
    p.pay_period,
    p.gross_salary,
    p.net_salary,
    p.status AS payroll_status
FROM employees e
LEFT JOIN payroll p ON e.id = p.employee_id 
WHERE p.pay_period = DATE_FORMAT(CURDATE(), '%Y-%m')
   OR p.pay_period IS NULL;

-- View: Financial summary by month
CREATE OR REPLACE VIEW view_monthly_financial_summary AS
SELECT 
    DATE_FORMAT(date, '%Y-%m') AS month_year,
    SUM(CASE WHEN type = 'Income' THEN amount ELSE 0 END) AS total_income,
    SUM(CASE WHEN type = 'Expense' THEN amount ELSE 0 END) AS total_expenses,
    SUM(CASE WHEN type = 'Income' THEN amount ELSE -amount END) AS net_income,
    COUNT(*) AS transaction_count
FROM transactions
WHERE status = 'Completed'
GROUP BY DATE_FORMAT(date, '%Y-%m')
ORDER BY month_year DESC;

-- View: Welfare requests with member information
CREATE OR REPLACE VIEW view_welfare_requests_detailed AS
SELECT 
    wr.*,
    CASE 
        WHEN wr.membership_status = 'Active Member' THEN m.name
        ELSE wr.full_name
    END AS member_name,
    m.member_id,
    m.tithe_number
FROM welfare_requests wr
LEFT JOIN members m ON wr.full_name = m.name 
    AND wr.membership_status = 'Active Member';

-- View: Inventory with maintenance history
CREATE OR REPLACE VIEW view_inventory_with_maintenance AS
SELECT 
    i.*,
    COUNT(mr.id) AS maintenance_count,
    MAX(mr.date_performed) AS last_maintenance_date,
    SUM(mr.cost) AS total_maintenance_cost
FROM inventory_items i
LEFT JOIN maintenance_records mr ON i.id = mr.item_id
GROUP BY i.id;

-- ========================================
-- DATABASE STORED PROCEDURES
-- ========================================

DELIMITER //

-- Procedure: Calculate member attendance percentage
CREATE PROCEDURE GetMemberAttendance(
    IN member_id_param VARCHAR(50),
    IN start_date DATE,
    IN end_date DATE,
    OUT attendance_percentage DECIMAL(5,2)
)
BEGIN
    DECLARE total_services INT DEFAULT 0;
    DECLARE attended_services INT DEFAULT 0;
    
    -- In a real implementation, this would calculate based on attendance records
    -- For now, returning a placeholder
    SET attendance_percentage = 85.50;
END//

-- Procedure: Generate member transfer eligibility report
CREATE PROCEDURE CheckMemberTransferEligibility()
BEGIN
    SELECT 
        id,
        visitor_id,
        full_name,
        visit_date,
        baptized,
        bible_study_completed,
        eligibility_for_transfer,
        DATEDIFF(CURDATE(), visit_date) AS days_since_visit
    FROM new_members
    WHERE status = 'Active'
      AND eligibility_for_transfer = TRUE
      AND transferred_to_member = FALSE;
END//

-- Procedure: Calculate employee leave balance
CREATE PROCEDURE GetEmployeeLeaveBalance(
    IN employee_id_param INT,
    IN leave_type_param VARCHAR(50),
    OUT balance_days INT
)
BEGIN
    DECLARE used_days INT DEFAULT 0;
    DECLARE annual_entitlement INT DEFAULT 21; -- Standard 21 days annual leave
    
    -- Calculate used leave days for the current year
    SELECT COALESCE(SUM(days_requested), 0) INTO used_days
    FROM leave_requests
    WHERE employee_id = employee_id_param
      AND leave_type = leave_type_param
      AND YEAR(start_date) = YEAR(CURDATE())
      AND status = 'Approved';
    
    SET balance_days = annual_entitlement - used_days;
END//

DELIMITER ;

-- ========================================
-- DATABASE TRIGGERS FOR DATA INTEGRITY
-- ========================================

DELIMITER //

-- Trigger: Automatically update member eligibility when requirements are met
CREATE TRIGGER update_member_eligibility
    BEFORE UPDATE ON new_members
    FOR EACH ROW
BEGIN
    IF NEW.baptized = TRUE 
       AND NEW.bible_study_completed = TRUE 
       AND DATEDIFF(CURDATE(), NEW.visit_date) >= 180 THEN
        SET NEW.eligibility_for_transfer = TRUE;
    END IF;
END//

-- Trigger: Log user login activity
CREATE TRIGGER log_user_login
    AFTER UPDATE ON users
    FOR EACH ROW
BEGIN
    IF NEW.last_login != OLD.last_login THEN
        INSERT INTO system_logs (user_id, action, module, details, severity)
        VALUES (NEW.id, 'User Login', 'Authentication', 
                CONCAT('User logged in from IP: ', @user_ip), 'Info');
    END IF;
END//

-- Trigger: Validate payroll calculations
CREATE TRIGGER validate_payroll_calculations
    BEFORE INSERT ON payroll
    FOR EACH ROW
BEGIN
    -- Ensure net salary calculation is correct
    IF NEW.net_salary != (NEW.gross_salary - NEW.total_deductions) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Invalid payroll calculation: net salary mismatch';
    END IF;
    
    -- Ensure PAYE is calculated correctly (simplified validation)
    IF NEW.gross_salary > 24000 AND NEW.paye = 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'PAYE calculation required for gross salary > 24,000';
    END IF;
END//

DELIMITER ;

-- ========================================
-- DATABASE MAINTENANCE PROCEDURES
-- ========================================

DELIMITER //

-- Procedure: Clean up old system logs (keep last 6 months)
CREATE PROCEDURE CleanupSystemLogs()
BEGIN
    DELETE FROM system_logs 
    WHERE timestamp < DATE_SUB(CURDATE(), INTERVAL 6 MONTH);
    
    SELECT ROW_COUNT() AS deleted_logs;
END//

-- Procedure: Archive completed transactions older than 2 years
CREATE PROCEDURE ArchiveOldTransactions()
BEGIN
    -- In production, this would move data to archive tables
    UPDATE transactions 
    SET status = 'Archived'
    WHERE date < DATE_SUB(CURDATE(), INTERVAL 2 YEAR)
      AND status = 'Completed';
    
    SELECT ROW_COUNT() AS archived_transactions;
END//

-- Procedure: Generate database health report
CREATE PROCEDURE DatabaseHealthCheck()
BEGIN
    SELECT 
        'Users' AS table_name,
        COUNT(*) AS total_records,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END) AS active_records
    FROM users
    
    UNION ALL
    
    SELECT 
        'Members' AS table_name,
        COUNT(*) AS total_records,
        COUNT(CASE WHEN status = 'Active' THEN 1 END) AS active_records
    FROM members
    
    UNION ALL
    
    SELECT 
        'Transactions' AS table_name,
        COUNT(*) AS total_records,
        COUNT(CASE WHEN status = 'Completed' THEN 1 END) AS active_records
    FROM transactions;
END//

DELIMITER ;

-- ========================================
-- SECURITY POLICIES
-- ========================================

-- Enable MySQL audit logging (if available)
-- SET GLOBAL general_log = 'ON';
-- SET GLOBAL log_output = 'TABLE';

-- Set secure password validation (if available)
-- INSTALL PLUGIN validate_password SONAME 'validate_password.so';
-- SET GLOBAL validate_password.policy = STRONG;

-- ========================================
-- FINAL FLUSH AND OPTIMIZATION
-- ========================================

-- Flush privileges to apply user changes
FLUSH PRIVILEGES;

-- Optimize all tables for better performance
OPTIMIZE TABLE users, members, new_members, employees, payroll, transactions, 
               expenses, welfare_requests, inventory_items, events, appointments,
               messages, system_logs, document_uploads;

-- Analyze tables for query optimization
ANALYZE TABLE users, members, new_members, employees, payroll, transactions, 
              expenses, welfare_requests, inventory_items, events, appointments,
              messages, system_logs, document_uploads;

-- Show optimization results
SHOW INDEX FROM users;

SELECT 'Database optimization completed successfully!' AS Status;
