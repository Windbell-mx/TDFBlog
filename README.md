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
- 用户ID基于邮箱Hash生成（安全且唯一）
- 个人资料编辑（昵称、性别、个人简介）
- 头像上传（基于 Minio，通过后端代理访问）
- 个人主页展示
- 账户注销（需密码验证，删除所有相关数据）

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
- 实时统计数据展示（文章总数、活跃用户、今日更新）

### UI/UX 优化
- 亮色/暗色模式切换（支持本地存储保存偏好）
- 白色系配色方案
- 主题切换按钮
- 暗色模式完整样式适配

### 安全功能
- 用户ID基于邮箱SHA-256 Hash生成（16位URL安全Base64编码）
- 滑块验证码验证（登录失败超过3次触发）
- 使用 Redis 存储登录失败次数和验证码数据
- 验证码验证成功后重置失败次数
- 头像通过后端代理访问，隐藏MinIO真实地址
- 注销账户需密码验证

### 性能优化
- Redis 缓存文章列表和热门作者数据
- 数据获取优化，优先显示关键信息
- 头像设置1年浏览器缓存
- 前端API层缓存，防止重复请求（使用闭包缓存）
- 组件级防重复请求（使用useRef标记）
- 优化页面加载速度，避免不必要的网络请求

### 统一异常处理
- 使用 `@RestControllerAdvice` 实现全局异常捕获
- 支持业务异常、资源未找到、参数验证、文件上传大小超限等异常类型
- 统一的错误响应格式：`{ "error": "错误信息", "code": 错误码 }`

## 项目结构

```
blog/
├── backend/                    # Spring Boot 后端
│   ├── src/main/java/com/techforum/backend/
│   │   ├── controller/         # REST API 控制器（含媒体控制器）
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
MINIO_USERNAME=minioadmin
MINIO_PASSWORD=minioadmin
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

**注意**：部署生产环境时，将 `jar` 包和 `.env` 文件放在同一目录，确保 `.env` 能被正确加载。

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
- `POST /api/users/delete-account` - 注销账号（需密码验证）
- `DELETE /api/users/{id}` - 删除用户（管理员）
- `POST /api/users/forgot-password` - 忘记密码
- `POST /api/users/reset-password` - 重置密码

### 文章接口
- `GET /api/articles` - 获取文章列表
- `GET /api/articles/{id}` - 获取文章详情
- `POST /api/articles` - 发布文章
- `PUT /api/articles/{id}` - 更新文章
- `DELETE /api/articles/{id}` - 删除文章
- `GET /api/articles/user/{userId}` - 获取用户的文章
- `POST /api/articles/{id}/read` - 增加阅读量

### 收藏接口
- `POST /api/collections` - 添加收藏
- `POST /api/collections/remove` - 取消收藏
- `GET /api/collections/user/{userId}` - 获取用户收藏列表
- `GET /api/collections/check` - 检查是否已收藏

### 笔记接口
- `GET /api/notes/user/{userId}` - 获取用户笔记
- `POST /api/notes` - 创建笔记
- `PUT /api/notes/{id}` - 更新笔记
- `DELETE /api/notes/{id}` - 删除笔记

### 验证码接口
- `GET /api/captcha/slider` - 获取滑块验证码配置
- `POST /api/captcha/slider/validate` - 验证滑块位置

### 媒体接口
- `GET /api/media/avatar/{fileName}` - 获取头像（通过后端代理访问MinIO）

## 用户ID生成机制

用户ID不再使用自增Long类型，而是基于邮箱生成：

1. 将用户邮箱转为小写
2. 计算 SHA-256 哈希值
3. 使用 Base64 URL 安全编码
4. 取前16个字符作为用户ID

**优点**：
- 相同邮箱始终生成相同ID
- 不可预测，提高安全性
- 无需额外索引即可通过邮箱快速查找

## 安全配置

- JWT 密钥通过环境变量配置，不要硬编码
- 数据库密码、Redis 密码等敏感信息存储在 `.env` 文件中
- `.env` 文件已加入 `.gitignore`，不会提交到版本库
- `.env.example` 提供了配置模板，不包含真实敏感信息
- 头像通过后端 `/api/media/avatar/{fileName}` 代理访问，隐藏MinIO真实地址
- 用户ID基于邮箱Hash生成，不可预测

## 常见问题

### 后端启动失败，提示无法连接数据库
- 检查 MySQL 服务是否启动
- 检查 `.env` 文件中的 `DB_URL`、`DB_USERNAME`、`DB_PASSWORD` 配置是否正确
- 确保数据库 `tech_forum` 已创建

### 前端提示 502 Bad Gateway
- 确保后端服务正在运行（http://localhost:8081）
- 检查后端是否成功启动，无报错信息

### 头像无法显示
- 这是因为 Minio 服务未启动
- 或者数据库中存储的头像文件名是旧的MinIO完整URL格式（需要重新上传头像）

### 头像上传失败
- 这是因为 Minio 服务未启动，头像上传功能不可用
- Minio 是可选功能，不影响其他功能使用

## 架构说明

### 头像代理访问

为了安全起见，头像通过后端代理访问，而不是直接暴露MinIO地址：

```
前端请求头像 → /api/media/avatar/{filename} → MediaController → MinIO → 返回图片
```

**优点**：
- 隐藏MinIO的真实地址和访问凭证
- 统一的访问控制
- 可以添加水印、防盗链等额外处理

**数据存储**：
- 数据库中只存储文件名（如 `uuid_avatar.jpg`）
- 前端收到的头像URL格式：`/api/media/avatar/{filename}`
- 后端MediaController从MinIO获取文件并返回给前端

## 更新日志

### v2.2.0
- **新增**: 亮色/暗色模式切换功能
- **新增**: 主题状态管理（Context API）
- **新增**: 暗色模式完整样式适配
- **新增**: 统计数据API（文章总数、活跃用户、今日更新）
- **变更**: 后端端口从8081改为8080
- **变更**: 前端配置支持环境变量配置
- **优化**: 前端配色方案（白色系）
- **优化**: 主题切换无闪烁体验

### v2.1.0
- **优化**: 前端API层添加缓存机制，防止重复请求
- **优化**: 组件级防重复请求，使用useRef标记
- **优化**: 移除MainPage中重复获取文章的逻辑
- **优化**: 减少不必要的网络请求，提升用户体验
- **修复**: 点击科技社区时重复请求文章和作者的问题

### v2.0.0
- **重要变更**: 用户ID从自增Long改为邮箱Hash String
- 新增账户注销功能（需密码验证）
- 新增密码重置功能
- 优化数据删除逻辑（级联删除用户相关数据）
- 改进安全性（用户ID不可预测）

### v1.0.0
- 初始版本发布
- 用户注册、登录、资料编辑
- 文章发布、编辑、删除、收藏
- 滑块验证码
- Redis缓存优化

## 许可证

MIT License
