-- ==============================================
-- 迁移笔记到文章表
-- 将 notes 表中的数据迁移到 articles 表，category 设置为 '学习笔记'
-- ==============================================

-- 1. 将笔记数据插入到文章表
INSERT INTO articles (title, content, category, user_id, created_at, updated_at)
SELECT 
    title,
    content,
    '学习笔记' AS category,
    user_id,
    created_at,
    updated_at
FROM notes;

-- 2. 获取插入的文章ID和对应的笔记ID的映射关系
-- 这将帮助我们将笔记的标签迁移到文章标签表

-- 3. 将笔记标签迁移到文章标签表
-- 注意：这里需要知道新插入的文章ID
-- 假设 notes 表和 articles 表可以通过 title, content, created_at 来匹配

INSERT INTO article_tags (article_id, tag)
SELECT 
    a.id AS article_id,
    nt.tag
FROM notes n
INNER JOIN note_tags nt ON n.id = nt.note_id
INNER JOIN articles a ON a.title = n.title 
    AND a.content = n.content 
    AND a.category = '学习笔记'
    AND a.created_at = n.created_at;

-- 4. 删除笔记标签表（可选，取决于是否要保留备份）
-- DROP TABLE IF EXISTS note_tags;

-- 5. 删除笔记表
-- 注意：在删除之前请确保数据已经成功迁移
-- DROP TABLE IF EXISTS notes;

-- ==============================================
-- 验证迁移结果
-- ==============================================

-- 检查迁移的文章数量
SELECT COUNT(*) AS migrated_articles FROM articles WHERE category = '学习笔记';

-- 检查迁移的标签数量
SELECT COUNT(*) AS migrated_tags FROM article_tags at 
INNER JOIN articles a ON at.article_id = a.id 
WHERE a.category = '学习笔记';

-- ==============================================
-- 完成迁移后，可以删除旧的表（请谨慎操作）
-- ==============================================
-- DROP TABLE IF EXISTS note_tags;
-- DROP TABLE IF EXISTS notes;
