-- Migration: Add reset token fields to companies table
-- Date: 2025-11-22
-- Description: Add resetToken and resetTokenExpiry fields for company password reset functionality

ALTER TABLE companies 
ADD COLUMN resetToken VARCHAR(255) NULL,
ADD COLUMN resetTokenExpiry DATETIME NULL;

-- Add index for faster lookup by reset token
CREATE INDEX idx_companies_reset_token ON companies(resetToken);

-- Comments for documentation
ALTER TABLE companies 
MODIFY COLUMN resetToken VARCHAR(255) NULL COMMENT 'Token for company password reset functionality',
MODIFY COLUMN resetTokenExpiry DATETIME NULL COMMENT 'Expiry time for company reset token (15 minutes from creation)';
