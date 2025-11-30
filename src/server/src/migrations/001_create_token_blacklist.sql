-- Migration: Tạo bảng token_blacklist để quản lý logout tokens
-- Chạy lệnh này trong MySQL để tạo bảng

USE jobify_db;

CREATE TABLE IF NOT EXISTS `token_blacklist` (
  `id` int NOT NULL AUTO_INCREMENT,
  `token` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `user_type` enum('user','company') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_token` (`token`),
  KEY `idx_expires_at` (`expires_at`),
  KEY `idx_user_id_type` (`user_id`,`user_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Danh sách JWT tokens đã bị vô hiệu hóa sau logout';

-- Index để tối ưu performance
CREATE INDEX idx_token_expires ON token_blacklist(token, expires_at);

-- Cleanup old tokens (chạy định kỳ)
-- DELETE FROM token_blacklist WHERE expires_at <= NOW();
