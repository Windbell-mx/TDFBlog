-- ==============================================
-- Tech Forum Database Initialization Script
-- ==============================================
-- This script creates the database and all necessary tables
-- Data is NOT included - only table structure

-- Create database if not exists
CREATE DATABASE IF NOT EXISTS tech_forum 
  DEFAULT CHARACTER SET utf8mb4 
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE tech_forum;

-- ==============================================
-- Table: users
-- ==============================================
CREATE TABLE IF NOT EXISTS users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    nickname VARCHAR(100),
    gender VARCHAR(10),
    bio TEXT,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    reset_token VARCHAR(255),
    reset_token_expiry DATETIME,
    
    INDEX idx_users_email (email),
    INDEX idx_users_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================
-- Table: articles
-- ==============================================
CREATE TABLE IF NOT EXISTS articles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content MEDIUMTEXT,
    category VARCHAR(100),
    user_id BIGINT NOT NULL,
    cover_image VARCHAR(255),
    read_count INT DEFAULT 0,
    created_at DATETIME NOT NULL,
    updated_at DATETIME,
    
    INDEX idx_articles_user_id (user_id),
    INDEX idx_articles_category (category),
    INDEX idx_articles_created_at (created_at),
    INDEX idx_articles_read_count (read_count),
    
    FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================
-- Table: collections
-- ==============================================
CREATE TABLE IF NOT EXISTS collections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    article_id BIGINT NOT NULL,
    created_at DATETIME NOT NULL,
    
    UNIQUE KEY uk_collections_user_article (user_id, article_id),
    INDEX idx_collections_user_id (user_id),
    INDEX idx_collections_article_id (article_id),
    INDEX idx_collections_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================
-- Table: notes
-- ==============================================
CREATE TABLE IF NOT EXISTS notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255),
    content TEXT,
    user_id BIGINT NOT NULL,
    created_at DATETIME,
    updated_at DATETIME,
    
    INDEX idx_notes_user_id (user_id),
    INDEX idx_notes_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================
-- Script completed
-- ==============================================
-- To use this script:
-- 1. Connect to MySQL as root or a user with database creation privileges
-- 2. Run: source /path/to/init-database.sql;
-- 3. Create a dedicated database user and grant permissions:
--    CREATE USER 'techforum_user'@'localhost' IDENTIFIED BY 'your_password';
--    GRANT ALL PRIVILEGES ON tech_forum.* TO 'techforum_user'@'localhost';
--    FLUSH PRIVILEGES;