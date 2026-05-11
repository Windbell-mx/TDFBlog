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

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: TailwindCSS 3
- **图标**: Lucide React
- **路由**: React Router DOM

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
│   │   ├── entity/             # 数据库实体
│   │   ├── dto/                # 数据传输对象
│   │   ├── config/             # 配置类
│   │   └── exception/          # 异常处理
│   └── src/main/resources/
│       └── application.yml     # 应用配置
├── src/                        # React 前端
│   ├── components/             # UI 组件
│   ├── pages/                  # 页面组件
│   ├── services/               # API 服务
│   ├── types/                  # TypeScript 类型定义
│   └── App.tsx                 # 主应用组件
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

## 运行方式

### 环境要求
- JDK 21+
- Node.js 20+
- MySQL 8.0+
- Redis 7.0+
- Minio (可选，用于头像存储)

### 后端启动

1. 进入后端目录
```bash
cd backend
```

2. 配置数据库连接 (修改 `src/main/resources/application.yml`)
```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/example_db?useSSL=false&serverTimezone=UTC&allowPublicKeyRetrieval=true
    username: admin
    password: password
```

3. 配置 Redis 连接
```yaml
spring:
  data:
    redis:
      host: localhost
      port: 6379
```

4. 运行后端
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

## API 接口

### 用户接口
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/{id}` - 获取用户信息
- `PUT /api/users/{id}` - 更新用户信息
- `POST /api/users/{id}/avatar` - 上传头像

### 文章接口
- `GET /api/articles` - 获取文章列表
- `GET /api/articles/{id}` - 获取文章详情
- `POST /api/articles` - 发布文章
- `PUT /api/articles/{id}` - 更新文章
- `DELETE /api/articles/{id}` - 删除文章

### 收藏接口
- `POST /api/collections` - 添加收藏
- `POST /api/collections/remove` - 取消收藏
- `GET /api/collections/user/{userId}` - 获取用户收藏列表

## 许可证

MIT License