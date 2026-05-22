-- 数据库迁移脚本：将用户ID从自增Long改为邮箱Hash String
-- ============================================================
-- 警告：请先备份数据库！
-- 使用方法：在MySQL客户端中执行此脚本
-- ============================================================

-- 1. 临时禁用外键约束
SET FOREIGN_KEY_CHECKS = 0;

-- 2. 备份现有数据（可选但推荐）
-- CREATE TABLE users_backup AS SELECT * FROM users;
-- CREATE TABLE articles_backup AS SELECT * FROM articles;
-- CREATE TABLE collections_backup AS SELECT * FROM collections;
-- CREATE TABLE notes_backup AS SELECT * FROM notes;

-- 3. 删除外键约束
ALTER TABLE articles DROP FOREIGN KEY IF EXISTS articles_ibfk_1;
ALTER TABLE collections DROP FOREIGN KEY IF EXISTS collections_ibfk_1;
ALTER TABLE notes DROP FOREIGN KEY IF EXISTS notes_ibfk_1;
ALTER TABLE notes DROP FOREIGN KEY IF EXISTS FKechaouoa6kus6k1dpix1u91c;

-- 4. 为users表添加临时新ID列
ALTER TABLE users ADD COLUMN new_id VARCHAR(32) FIRST;

-- 5. 为articles表添加临时新user_id列
ALTER TABLE articles ADD COLUMN new_user_id VARCHAR(32);

-- 6. 为collections表添加临时新user_id列
ALTER TABLE collections ADD COLUMN new_user_id VARCHAR(32);

-- 7. 为notes表添加临时新user_id列
ALTER TABLE notes ADD COLUMN new_user_id VARCHAR(32);

-- 8. 更新users表的新ID（使用SHA-256哈希邮箱，取前16位Base64 URL安全编码）
UPDATE users 
SET new_id = SUBSTRING(REPLACE(REPLACE(TO_BASE64(SHA2(LOWER(email), 256)), '+', '-'), '/', '_'), 1, 16);

-- 9. 更新articles表的新user_id
UPDATE articles a
JOIN users u ON a.user_id = u.id
SET a.new_user_id = u.new_id;

-- 10. 更新collections表的新user_id
UPDATE collections c
JOIN users u ON c.user_id = u.id
SET c.new_user_id = u.new_id;

-- 11. 更新notes表的新user_id
UPDATE notes n
JOIN users u ON n.user_id = u.id
SET n.new_user_id = u.new_id;

-- 12. 删除users表的旧ID列
ALTER TABLE users DROP COLUMN id;

-- 13. 重命名新ID列为id
ALTER TABLE users CHANGE COLUMN new_id id VARCHAR(32) NOT NULL PRIMARY KEY;

-- 14. 删除articles表的旧user_id列
ALTER TABLE articles DROP COLUMN user_id;

-- 15. 重命名新user_id列
ALTER TABLE articles CHANGE COLUMN new_user_id user_id VARCHAR(32);

-- 16. 删除collections表的旧user_id列
ALTER TABLE collections DROP COLUMN user_id;

-- 17. 重命名新user_id列
ALTER TABLE collections CHANGE COLUMN new_user_id user_id VARCHAR(32);

-- 18. 删除notes表的旧user_id列
ALTER TABLE notes DROP COLUMN user_id;

-- 19. 重命名新user_id列
ALTER TABLE notes CHANGE COLUMN new_user_id user_id VARCHAR(32);

-- 20. 重新添加外键约束（可选）
-- ALTER TABLE articles ADD CONSTRAINT fk_article_user FOREIGN KEY (user_id) REFERENCES users(id);
-- ALTER TABLE collections ADD CONSTRAINT fk_collection_user FOREIGN KEY (user_id) REFERENCES users(id);
-- ALTER TABLE notes ADD CONSTRAINT fk_note_user FOREIGN KEY (user_id) REFERENCES users(id);

-- 21. 重新启用外键约束
SET FOREIGN_KEY_CHECKS = 1;

-- 22. 验证迁移结果
SELECT 'Users:' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Articles:', COUNT(*) FROM articles
UNION ALL
SELECT 'Collections:', COUNT(*) FROM collections
UNION ALL
SELECT 'Notes:', COUNT(*) FROM notes;
