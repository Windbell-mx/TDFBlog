-- =============================================
-- TDFBlog 数据库初始化脚本
-- 创建时间: 2026-05-29
-- =============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS tdfblog DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE tdfblog;

-- =============================================
-- 1. 用户表 (users)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(255) PRIMARY KEY COMMENT '用户ID',
    email VARCHAR(255) NOT NULL UNIQUE COMMENT '邮箱',
    password VARCHAR(255) NOT NULL COMMENT '密码',
    avatar VARCHAR(500) COMMENT '头像URL',
    nickname VARCHAR(100) COMMENT '昵称',
    gender VARCHAR(20) COMMENT '性别: male/female/secret',
    bio VARCHAR(500) COMMENT '个人简介',
    reset_token VARCHAR(255) COMMENT '重置密码令牌',
    reset_token_expiry DATETIME COMMENT '重置密码令牌过期时间',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_email (email),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- =============================================
-- 2. 文章表 (articles)
-- =============================================
CREATE TABLE IF NOT EXISTS articles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '文章ID',
    title VARCHAR(500) NOT NULL COMMENT '文章标题',
    content MEDIUMTEXT NOT NULL COMMENT '文章内容',
    category VARCHAR(100) COMMENT '文章分类',
    cover_image VARCHAR(500) COMMENT '封面图片URL',
    read_count INT NOT NULL DEFAULT 0 COMMENT '阅读次数',
    user_id VARCHAR(255) NOT NULL COMMENT '作者ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
    INDEX idx_user_id (user_id),
    INDEX idx_category (category),
    INDEX idx_created_at (created_at),
    INDEX idx_read_count (read_count),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章表';

-- =============================================
-- 3. 文章标签表 (article_tags)
-- =============================================
CREATE TABLE IF NOT EXISTS article_tags (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '标签关联ID',
    article_id BIGINT NOT NULL COMMENT '文章ID',
    tag VARCHAR(100) NOT NULL COMMENT '标签',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_article_id (article_id),
    INDEX idx_tag (tag),
    UNIQUE KEY uk_article_tag (article_id, tag),
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文章标签关联表';

-- =============================================
-- 4. 收藏表 (collections)
-- =============================================
CREATE TABLE IF NOT EXISTS collections (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '收藏ID',
    user_id VARCHAR(255) NOT NULL COMMENT '用户ID',
    article_id BIGINT NOT NULL COMMENT '文章ID',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    INDEX idx_user_id (user_id),
    INDEX idx_article_id (article_id),
    UNIQUE KEY uk_user_article (user_id, article_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- =============================================
-- 数据库初始化完成
-- =============================================
