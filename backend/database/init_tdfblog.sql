-- ==============================================
-- Tech Forum Blog 数据库初始化脚本
-- Database: tdfblog
-- ==============================================

-- 执行此脚本前，请确保已经创建了 tdfblog 数据库：
-- CREATE DATABASE IF NOT EXISTS tdfblog CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE tdfblog;

-- ==============================================
-- Users Table
-- id 使用 VARCHAR(32)，基于邮箱 SHA-256 Hash 生成
-- ==============================================
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id VARCHAR(32) NOT NULL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(500),
    nickname VARCHAR(100),
    gender VARCHAR(20),
    bio TEXT,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    reset_token VARCHAR(255),
    reset_token_expiry DATETIME,
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================
-- Articles Table
-- user_id 使用 VARCHAR(32)
-- ==============================================
DROP TABLE IF EXISTS articles;

CREATE TABLE articles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content MEDIUMTEXT NOT NULL,
    category VARCHAR(100),
    user_id VARCHAR(32) NOT NULL,
    cover_image VARCHAR(500),
    read_count INT NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================
-- Collections Table
-- user_id 使用 VARCHAR(32)
-- ==============================================
DROP TABLE IF EXISTS collections;

CREATE TABLE collections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    article_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_article_id (article_id),
    UNIQUE KEY uk_user_article (user_id, article_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================
-- Notes Table
-- user_id 使用 VARCHAR(32)
-- ==============================================
DROP TABLE IF EXISTS notes;

CREATE TABLE notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    user_id VARCHAR(32),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================
-- 完成！
-- ==============================================
