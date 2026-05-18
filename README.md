# 科技论坛博客系统

一个现代化的科技论坛博客系统，基于 Spring Boot + React + TypeScript 技术栈构建。

## 技术栈

### 后端
- **框架**: Spring Boot 3.2.0
- **数据库**: MySQL
- **缓存**: Redis
- **文件存储**: Minio
- **认证**: JWT
- **ORM**: Hibernate JPA
- **环境配置**: dotenv-java

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: TailwindCSS 3
- **图标**: Lucide React
- **路由**: React Router DOM
- **HTTP 代理**: Vite Proxy

## 功能特性

### 用户功能
- 用户注册与登录（邮箱验证）
- 个人资料编辑（昵称、性别、个人简介）
- 头像上传（基于 Minio）
- 个人主页展示

### 文章功能
- 文章发布（支持技术文章和笔记类型）
- 文章编辑与删除
- 文章浏览量统计
- 文章收藏与取消收藏
- 文章详情查看

### 社区功能
- 精选文章展示
- 热门作者排行（按文章发布量）
- 最新文章展示

### 性能优化
- Redis 缓存文章列表和热门作者数据
- 数据获取优化，优先显示关键信息

## 项目结构

```
blog/
├── backend/                    # Spring Boot 后端
│   ├── src/main/java/com/techforum/backend/
│   │   ├── controller/         # REST API 控制器
│   │   ├── service/            # 业务逻辑层
│   │   ├── repository/         # 数据访问层
│   │   ├── model/              # 数据库实体
│   │   ├── dto/                # 数据传输对象
│   │   ├── config/             # 配置类
│   │   ├── util/               # 工具类
│   │   └── exception/           # 异常处理
│   ├── src/main/resources/
│   │   └── application.yml     # 应用配置
│   ├── database/
│   │   └── schema.sql          # 数据库初始化脚本
│   ├── .env.example            # 环境变量配置模板
│   └── pom.xml                 # Maven 配置
├── src/                        # React 前端
│   ├── components/             # UI 组件
│   ├── services/               # API 服务
│   ├── styles/                 # 样式文件
│   └── App.tsx                # 主应用组件
├── public/                     # 静态资源
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts             # Vite 配置
└── tailwind.config.js
```

## 环境配置

### 环境要求
- JDK 21+
- Node.js 20+
- MySQL 8.0+
- Redis 7.0+
- Minio (可选，用于头像存储)

### 后端配置

1. 进入后端目录
```bash
cd backend
```

2. 复制环境变量配置模板
```bash
cp .env.example .env
```

3. 编辑 `.env` 文件，配置你的数据库、Redis、邮件等服务
```env
# JWT Configuration
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here
JWT_EXPIRATION=86400

# Database Configuration
DB_URL=jdbc:mysql://localhost:3306/tech_forum?useSSL=false&serverTimezone=UTC&autoReconnect=true&useUnicode=true&characterEncoding=utf8
DB_USERNAME=root
DB_PASSWORD=your_database_password

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_redis_password
REDIS_DATABASE=0

# Email Configuration
MAIL_HOST=smtp.example.com
MAIL_PORT=465
MAIL_USERNAME=your_email@example.com
MAIL_PASSWORD=your_email_password

# MinIO Configuration
MINIO_INTERNAL_URL=http://127.0.0.1:9000
MINIO_PUBLIC_URL=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET_NAME=tdfblog
```

4. 确保 MySQL 数据库已创建
```sql
CREATE DATABASE tech_forum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

5. 运行后端（会自动加载 .env 配置）
```bash
mvn spring-boot:run
```
后端服务将运行在 http://localhost:8081

### 前端启动

1. 安装依赖
```bash
npm install
```

2. 运行开发服务器
```bash
npm run dev
```
前端服务将运行在 http://localhost:5173

**注意**：Vite 已配置代理，将 `/api` 请求自动转发到后端 `http://localhost:8081`，无需额外配置 CORS。

### 生产环境构建

```bash
# 前端构建
npm run build

# 后端打包
cd backend
mvn clean package -DskipTests
```

## 数据库初始化

首次部署时，需要执行数据库初始化脚本：

```bash
# 登录 MySQL
mysql -u root -p

# 选择数据库
USE tech_forum;

# 执行初始化脚本
SOURCE backend/database/schema.sql;
```

## API 接口

### 用户接口
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/{id}` - 获取用户信息
- `PUT /api/users/{id}` - 更新用户信息
- `POST /api/users/{id}/avatar` - 上传头像
- `DELETE /api/users/{id}` - 注销账号

### 文章接口
- `GET /api/articles` - 获取文章列表
- `GET /api/articles/{id}` - 获取文章详情
- `POST /api/articles` - 发布文章
- `PUT /api/articles/{id}` - 更新文章
- `DELETE /api/articles/{id}` - 删除文章
- `GET /api/articles/user/{userId}` - 获取用户的文章

### 收藏接口
- `POST /api/collections` - 添加收藏
- `POST /api/collections/remove` - 取消收藏
- `GET /api/collections/user/{userId}` - 获取用户收藏列表

### 笔记接口
- `GET /api/notes/user/{userId}` - 获取用户笔记
- `POST /api/notes` - 创建笔记
- `PUT /api/notes/{id}` - 更新笔记
- `DELETE /api/notes/{id}` - 删除笔记

## 安全配置

- JWT 密钥通过环境变量配置，不要硬编码
- 数据库密码、Redis 密码等敏感信息存储在 `.env` 文件中
- `.env` 文件已加入 `.gitignore`，不会提交到版本库
- `.env.example` 提供了配置模板，不包含真实敏感信息

## 常见问题

### 后端启动失败，提示无法连接数据库
- 检查 MySQL 服务是否启动
- 检查 `.env` 文件中的 `DB_URL`、`DB_USERNAME`、`DB_PASSWORD` 配置是否正确
- 确保数据库 `tech_forum` 已创建

### 前端提示 502 Bad Gateway
- 确保后端服务正在运行（http://localhost:8081）
- 检查后端是否成功启动，无报错信息

### 头像上传失败
- 这是因为 Minio 服务未启动，头像上传功能不可用
- Minio 是可选功能，不影响其他功能使用

## 许可证

MIT License
