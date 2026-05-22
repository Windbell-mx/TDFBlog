-- ==============================================
-- Tech Forum Blog Database Schema (v2.0.0)
-- Database: tech_forum
-- Description: 用户ID改为邮箱Hash String
-- ==============================================

-- Create database
CREATE DATABASE IF NOT EXISTS tech_forum
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci;

USE tech_forum;

-- ==============================================
-- Users Table (v2.0.0)
-- Note: id 改为 VARCHAR(32)，使用邮箱 SHA-256 Hash
-- ==============================================
DROP TABLE IF EXISTS users;

CREATE TABLE users (
    id VARCHAR(32) NOT NULL PRIMARY KEY COMMENT '用户ID，基于邮箱SHA-256 Hash生成',
    email VARCHAR(255) NOT NULL UNIQUE COMMENT '用户邮箱，唯一标识',
    password VARCHAR(255) NOT NULL COMMENT '加密后的密码',
    avatar VARCHAR(500) COMMENT '头像文件名',
    nickname VARCHAR(100) COMMENT '昵称',
    gender VARCHAR(20) COMMENT '性别',
    bio TEXT COMMENT '个人简介',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    reset_token VARCHAR(255) COMMENT '密码重置Token',
    reset_token_expiry DATETIME COMMENT 'Token过期时间',
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================
-- Articles Table (v2.0.0)
-- Note: user_id 改为 VARCHAR(32)
-- ==============================================
DROP TABLE IF EXISTS articles;

CREATE TABLE articles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(500) NOT NULL COMMENT '文章标题',
    content MEDIUMTEXT NOT NULL COMMENT '文章内容',
    category VARCHAR(100) COMMENT '文章分类',
    user_id VARCHAR(32) NOT NULL COMMENT '作者用户ID，关联users表',
    cover_image VARCHAR(500) COMMENT '封面图片文件名',
    read_count INT NOT NULL DEFAULT 0 COMMENT '阅读量',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================
-- Collections Table (User favorites) (v2.0.0)
-- Note: user_id 改为 VARCHAR(32)
-- ==============================================
DROP TABLE IF EXISTS collections;

CREATE TABLE collections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL COMMENT '用户ID，关联users表',
    article_id BIGINT NOT NULL COMMENT '文章ID，关联articles表',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
    INDEX idx_user_id (user_id),
    INDEX idx_article_id (article_id),
    UNIQUE KEY uk_user_article (user_id, article_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================
-- Notes Table (v2.0.0)
-- Note: user_id 改为 VARCHAR(32)
-- ==============================================
DROP TABLE IF EXISTS notes;

CREATE TABLE notes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL COMMENT '笔记标题',
    content TEXT COMMENT '笔记内容',
    user_id VARCHAR(32) COMMENT '用户ID，关联users表',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================
-- 添加外键约束（可选，建议在数据迁移后添加）
-- ==============================================

-- 为 articles 表添加外键
-- ALTER TABLE articles 
--     ADD CONSTRAINT fk_article_user 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- 为 collections 表添加外键
-- ALTER TABLE collections 
--     ADD CONSTRAINT fk_collection_user 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
--     ADD CONSTRAINT fk_collection_article 
--     FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE;

-- 为 notes 表添加外键
-- ALTER TABLE notes 
--     ADD CONSTRAINT fk_note_user 
--     FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- ==============================================
-- 迁移现有数据脚本
-- ==============================================

-- 迁移 users 表
-- UPDATE users 
-- SET id = SUBSTRING(REPLACE(REPLACE(TO_BASE64(SHA2(LOWER(email), 256)), '+', '-'), '/', '_'), 1, 16);

-- 迁移 articles 表（需要先添加临时列）
-- ALTER TABLE articles ADD COLUMN temp_user_id VARCHAR(32);
-- UPDATE articles a JOIN users u ON a.user_id = u.id SET a.temp_user_id = u.id;
-- ALTER TABLE articles DROP COLUMN user_id;
-- ALTER TABLE articles CHANGE COLUMN temp_user_id user_id VARCHAR(32) NOT NULL;

-- 迁移 collections 表
-- ALTER TABLE collections ADD COLUMN temp_user_id VARCHAR(32);
-- UPDATE collections c JOIN users u ON c.user_id = u.id SET c.temp_user_id = u.id;
-- ALTER TABLE collections DROP COLUMN user_id;
-- ALTER TABLE collections CHANGE COLUMN temp_user_id user_id VARCHAR(32) NOT NULL;

-- 迁移 notes 表
-- ALTER TABLE notes ADD COLUMN temp_user_id VARCHAR(32);
-- UPDATE notes n JOIN users u ON n.user_id = u.id SET n.temp_user_id = u.id;
-- ALTER TABLE notes DROP COLUMN user_id;
-- ALTER TABLE notes CHANGE COLUMN temp_user_id user_id VARCHAR(32);

-- ==============================================
-- End of Database Schema v2.0.0
-- ==============================================
