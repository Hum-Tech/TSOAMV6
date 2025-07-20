-- Password Reset Table for TSOAM Church Management System
-- This table stores temporary reset codes for password recovery

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
    
    -- Indexes for performance
    INDEX idx_email (email),
    INDEX idx_reset_code (reset_code),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_id (user_id),
    
    -- Ensure one active reset per email at a time
    UNIQUE KEY unique_active_reset (email, used),
    
    -- Foreign key constraint (if users table exists)
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Clean up expired reset codes (run this as a scheduled job)
-- DELETE FROM password_resets WHERE expires_at < NOW() OR used = TRUE;
