-- ============================================
-- 互动电影系统 - 数据库初始化脚本
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `movie` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE `movie`;

-- ============================================
-- 电影数据表
-- 用于存储互动电影的完整 JSON 数据
-- ============================================
CREATE TABLE IF NOT EXISTS `movie_data` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '电影数据ID',
  `name` VARCHAR(255) NOT NULL UNIQUE COMMENT '电影名称',
  `json_data` LONGTEXT NOT NULL COMMENT '电影JSON数据',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_name` (`name`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='电影数据表';

-- ============================================
-- 系统配置表 (可选)
-- 用于存储系统级配置,包括 API Keys 等
-- ============================================
CREATE TABLE IF NOT EXISTS `system_config` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '配置ID',
  `config_key` VARCHAR(100) NOT NULL UNIQUE COMMENT '配置键名',
  `config_value` TEXT NOT NULL COMMENT '配置值',
  `description` VARCHAR(500) DEFAULT NULL COMMENT '配置说明',
  `is_encrypted` TINYINT(1) DEFAULT 0 COMMENT '是否加密存储',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_config_key` (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表';

-- ============================================
-- 插入默认配置 (可选)
-- ============================================
-- 注意: 实际使用时应该在后端环境变量中配置 GEMINI_API_KEY
-- 这里只是为了演示配置表的用法,不应该在代码中直接从数据库读取敏感信息
-- INSERT INTO `system_config` (`config_key`, `config_value`, `description`, `is_encrypted`)
-- VALUES
-- ('GEMINI_API_KEY', 'your-api-key-here', 'Gemini AI API Key', 1);

-- ============================================
-- 用户表 (可选,用于未来扩展)
-- ============================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `email` VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '密码哈希',
  `role` ENUM('admin', 'user', 'viewer') DEFAULT 'user' COMMENT '用户角色',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_username` (`username`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
-- 构建任务表 (可选,用于追踪打包任务)
-- ============================================
CREATE TABLE IF NOT EXISTS `build_tasks` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '任务ID',
  `project_name` VARCHAR(255) NOT NULL COMMENT '项目名称',
  `project_path` VARCHAR(500) DEFAULT NULL COMMENT '项目路径',
  `status` ENUM('pending', 'building', 'success', 'failed') DEFAULT 'pending' COMMENT '任务状态',
  `error_message` TEXT DEFAULT NULL COMMENT '错误信息',
  `build_file_path` VARCHAR(500) DEFAULT NULL COMMENT '生成文件路径',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_status` (`status`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='构建任务表';

-- ============================================
-- 显示表结构
-- ============================================
SHOW TABLES;

-- ============================================
-- 完成
-- ============================================
SELECT 'Database initialization completed successfully!' AS message;
