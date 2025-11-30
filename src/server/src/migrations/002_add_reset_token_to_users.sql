-- Migration: Add reset token fields to users table
-- Date: 2025-11-22
-- Description: Add resetToken and resetTokenExpiry fields for password reset functionality

ALTER TABLE users 
ADD COLUMN resetToken VARCHAR(255) NULL,
ADD COLUMN resetTokenExpiry DATETIME NULL;

-- Add index for faster lookup by reset token
CREATE INDEX idx_users_reset_token ON users(resetToken);

-- Comments for documentation
ALTER TABLE users 
MODIFY COLUMN resetToken VARCHAR(255) NULL COMMENT 'Token for password reset functionality',
MODIFY COLUMN resetTokenExpiry DATETIME NULL COMMENT 'Expiry time for reset token (15 minutes from creation)';
