# 用户ID迁移指南

## 概述
本次修改将用户ID从自增的Long类型改为基于邮箱Hash的String类型。

## 修改内容
- 用户ID生成方式：使用邮箱的SHA-256哈希（取前16位Base64 URL安全编码）
- 涉及的表：`users`, `articles`, `collections`, `notes`

## 重要说明
**在执行任何迁移前，请确保已备份数据库！**

## 迁移步骤

### 1. 执行 SQL 迁移脚本
首先，在 MySQL 客户端中执行 `migrate_user_id.sql` 脚本来完成数据库迁移：
```bash
mysql -u root -p tech_forum < migrate_user_id.sql
```
或者在 MySQL 客户端工具中直接打开并执行该脚本。

### 2. 启动应用
数据库迁移成功后，启动 Spring Boot 应用：
```bash
mvn spring-boot:run
```

### 3. 验证功能
- 测试用户登录/注册
- 检查用户的文章、收藏、笔记等数据是否完整
- 验证 API 返回的用户ID是否为16位字符串

## 迁移内容说明
SQL 脚本会执行以下操作：
1. 禁用外键约束
2. 为所有表添加临时新 ID 列
3. 使用与 Java 代码一致的算法生成新 ID（邮箱 SHA-256 哈希的前16位）
4. 更新所有关联表中的 user_id
5. 替换旧列名
6. 重新启用外键约束
7. 验证迁移结果

## 注意事项
1. **必须先备份数据库！**
2. 迁移过程中不要中断执行
3. 迁移后，现有用户需要重新登录（因为 JWT token 中的用户 ID 格式已改变）
4. 为安全起见，迁移完成后可以重新添加外键约束（脚本中有注释掉的语句）

## 回滚方案
如果迁移失败，可以使用备份的数据恢复：
```sql
-- 如果创建了备份表
DROP TABLE users;
DROP TABLE articles;
DROP TABLE collections;
DROP TABLE notes;
RENAME TABLE users_backup TO users;
RENAME TABLE articles_backup TO articles;
RENAME TABLE collections_backup TO collections;
RENAME TABLE notes_backup TO notes;
```

## 常见问题

### Q: 为什么需要手动执行 SQL 脚本？
A: 因为外键约束的存在，Hibernate 无法自动完成这个迁移过程。需要先删除外键约束，然后手动进行数据转换。

### Q: 迁移后用户需要重新登录吗？
A: 是的，因为 JWT token 中存储的用户 ID 格式从 Long 变为 String，旧的 token 将无法验证。

### Q: 新的 ID 是如何生成的？
A: 新 ID 是通过以下步骤生成的：
1. 将用户邮箱转为小写
2. 计算 SHA-256 哈希值
3. 使用 Base64 URL 安全编码
4. 取前16个字符作为用户ID
