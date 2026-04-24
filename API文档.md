# 科技研讨吧 API 文档

## 1. 认证相关接口

### 1.1 用户登录
- **接口路径**: `/api/auth/login`
- **请求方法**: `POST`
- **请求参数**:
  | 参数名 | 类型 | 必填 | 描述 |
  |--------|------|------|------|
  | email | string | 是 | 用户邮箱 |
  | password | string | 是 | 用户密码 |

- **响应格式**:
  ```json
  {
    "success": true,
    "data": {
      "token": "JWT令牌",
      "user": {
        "id": 1,
        "nickname": "技术达人",
        "email": "user@example.com",
        "gender": "male",
        "registerDate": "2025-10-15",
        "bio": "前端开发工程师"
      }
    },
    "message": "登录成功"
  }
  ```

### 1.2 用户注册
- **接口路径**: `/api/auth/register`
- **请求方法**: `POST`
- **请求参数**:
  | 参数名 | 类型 | 必填 | 描述 |
  |--------|------|------|------|
  | email | string | 是 | 用户邮箱 |
  | password | string | 是 | 用户密码 |
  | confirmPassword | string | 是 | 确认密码 |

- **响应格式**:
  ```json
  {
    "success": true,
    "data": {
      "token": "JWT令牌",
      "user": {
        "id": 1,
        "nickname": "新用户",
        "email": "user@example.com",
        "gender": "secret",
        "registerDate": "2026-04-23",
        "bio": ""
      }
    },
    "message": "注册成功"
  }
  ```

## 2. 文章相关接口

### 2.1 获取文章列表
- **接口路径**: `/api/articles`
- **请求方法**: `GET`
- **请求参数**:
  | 参数名 | 类型 | 必填 | 描述 |
  |--------|------|------|------|
  | page | number | 否 | 页码，默认1 |
  | limit | number | 否 | 每页数量，默认10 |
  | search | string | 否 | 搜索关键词 |
  | category | string | 否 | 文章分类 |

- **响应格式**:
  ```json
  {
    "success": true,
    "data": {
      "articles": [
        {
          "id": 1,
          "title": "React 19 新特性详解",
          "content": "React 19 带来了许多令人兴奋的新特性，包括...",
          "date": "2026-04-20",
          "category": "技术文章",
          "readCount": 125,
          "tags": ["React", "前端"],
          "permission": "public",
          "userId": 1,
          "userName": "技术达人"
        }
      ],
      "total": 6,
      "page": 1,
      "limit": 10
    },
    "message": "获取文章列表成功"
  }
  ```

### 2.2 获取文章详情
- **接口路径**: `/api/articles/:id`
- **请求方法**: `GET`
- **响应格式**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "title": "React 19 新特性详解",
      "content": "React 19 带来了许多令人兴奋的新特性，包括...",
      "date": "2026-04-20",
      "category": "技术文章",
      "readCount": 126,
      "tags": ["React", "前端"],
      "permission": "public",
      "userId": 1,
      "userName": "技术达人"
    },
    "message": "获取文章详情成功"
  }
  ```

### 2.3 创建文章
- **接口路径**: `/api/articles`
- **请求方法**: `POST`
- **请求参数**:
  | 参数名 | 类型 | 必填 | 描述 |
  |--------|------|------|------|
  | title | string | 是 | 文章标题 |
  | content | string | 是 | 文章内容 |
  | category | string | 是 | 文章分类 |
  | tags | array | 是 | 文章标签 |
  | permission | string | 是 | 权限设置 (public/private) |

- **响应格式**:
  ```json
  {
    "success": true,
    "data": {
      "id": 7,
      "title": "新文章标题",
      "content": "新文章内容",
      "date": "2026-04-23",
      "category": "技术文章",
      "readCount": 0,
      "tags": ["前端", "JavaScript"],
      "permission": "public",
      "userId": 1,
      "userName": "技术达人"
    },
    "message": "创建文章成功"
  }
  ```

### 2.4 更新文章
- **接口路径**: `/api/articles/:id`
- **请求方法**: `PUT`
- **请求参数**:
  | 参数名 | 类型 | 必填 | 描述 |
  |--------|------|------|------|
  | title | string | 否 | 文章标题 |
  | content | string | 否 | 文章内容 |
  | category | string | 否 | 文章分类 |
  | tags | array | 否 | 文章标签 |
  | permission | string | 否 | 权限设置 (public/private) |

- **响应格式**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "title": "更新后的标题",
      "content": "更新后的内容",
      "date": "2026-04-20",
      "category": "技术文章",
      "readCount": 125,
      "tags": ["React", "前端"],
      "permission": "public",
      "userId": 1,
      "userName": "技术达人"
    },
    "message": "更新文章成功"
  }
  ```

### 2.5 删除文章
- **接口路径**: `/api/articles/:id`
- **请求方法**: `DELETE`
- **响应格式**:
  ```json
  {
    "success": true,
    "data": null,
    "message": "删除文章成功"
  }
  ```

## 3. 笔记相关接口

### 3.1 获取笔记列表
- **接口路径**: `/api/notes`
- **请求方法**: `GET`
- **请求参数**:
  | 参数名 | 类型 | 必填 | 描述 |
  |--------|------|------|------|
  | page | number | 否 | 页码，默认1 |
  | limit | number | 否 | 每页数量，默认10 |
  | search | string | 否 | 搜索关键词 |

- **响应格式**:
  ```json
  {
    "success": true,
    "data": {
      "notes": [
        {
          "id": 1,
          "title": "React Hooks 学习笔记",
          "content": "useState、useEffect、useContext 等 hooks 的使用方法...",
          "date": "2026-04-19",
          "tags": ["React", "Hooks"],
          "permission": "private",
          "userId": 1
        }
      ],
      "total": 3,
      "page": 1,
      "limit": 10
    },
    "message": "获取笔记列表成功"
  }
  ```

### 3.2 创建笔记
- **接口路径**: `/api/notes`
- **请求方法**: `POST`
- **请求参数**:
  | 参数名 | 类型 | 必填 | 描述 |
  |--------|------|------|------|
  | title | string | 是 | 笔记标题 |
  | content | string | 是 | 笔记内容 |
  | tags | array | 是 | 笔记标签 |
  | permission | string | 是 | 权限设置 (public/private) |

- **响应格式**:
  ```json
  {
    "success": true,
    "data": {
      "id": 4,
      "title": "新笔记标题",
      "content": "新笔记内容",
      "date": "2026-04-23",
      "tags": ["JavaScript"],
      "permission": "private",
      "userId": 1
    },
    "message": "创建笔记成功"
  }
  ```

## 4. 个人信息相关接口

### 4.1 获取个人信息
- **接口路径**: `/api/users/profile`
- **请求方法**: `GET`
- **响应格式**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "avatar": "https://example.com/avatar.jpg",
      "nickname": "技术达人",
      "gender": "male",
      "registerDate": "2025-10-15",
      "bio": "前端开发工程师，热爱技术分享和学习",
      "stats": {
        "articles": 15,
        "views": 2345,
        "collections": 89
      }
    },
    "message": "获取个人信息成功"
  }
  ```

### 4.2 更新个人信息
- **接口路径**: `/api/users/profile`
- **请求方法**: `PUT`
- **请求参数**:
  | 参数名 | 类型 | 必填 | 描述 |
  |--------|------|------|------|
  | nickname | string | 否 | 用户昵称 |
  | gender | string | 否 | 用户性别 (male/female/secret) |
  | bio | string | 否 | 个人简介 |
  | avatar | string | 否 | 头像URL |

- **响应格式**:
  ```json
  {
    "success": true,
    "data": {
      "id": 1,
      "avatar": "https://example.com/new-avatar.jpg",
      "nickname": "技术专家",
      "gender": "male",
      "registerDate": "2025-10-15",
      "bio": "前端开发工程师，专注于React和TypeScript",
      "stats": {
        "articles": 15,
        "views": 2345,
        "collections": 89
      }
    },
    "message": "更新个人信息成功"
  }
  ```

## 5. 收藏相关接口

### 5.1 获取收藏列表
- **接口路径**: `/api/collections`
- **请求方法**: `GET`
- **请求参数**:
  | 参数名 | 类型 | 必填 | 描述 |
  |--------|------|------|------|
  | page | number | 否 | 页码，默认1 |
  | limit | number | 否 | 每页数量，默认10 |

- **响应格式**:
  ```json
  {
    "success": true,
    "data": {
      "collections": [
        {
          "id": 1,
          "articleId": 2,
          "title": "TypeScript 高级类型技巧",
          "author": "前端专家",
          "date": "2026-04-10",
          "readCount": 342,
          "collectDate": "2026-04-15"
        }
      ],
      "total": 3,
      "page": 1,
      "limit": 10
    },
    "message": "获取收藏列表成功"
  }
  ```

### 5.2 添加收藏
- **接口路径**: `/api/collections`
- **请求方法**: `POST`
- **请求参数**:
  | 参数名 | 类型 | 必填 | 描述 |
  |--------|------|------|------|
  | articleId | number | 是 | 文章ID |

- **响应格式**:
  ```json
  {
    "success": true,
    "data": {
      "id": 4,
      "articleId": 3,
      "title": "Node.js 性能优化实战",
      "author": "后端专家",
      "date": "2026-04-15",
      "readCount": 156,
      "collectDate": "2026-04-23"
    },
    "message": "添加收藏成功"
  }
  ```

### 5.3 删除收藏
- **接口路径**: `/api/collections/:id`
- **请求方法**: `DELETE`
- **响应格式**:
  ```json
  {
    "success": true,
    "data": null,
    "message": "删除收藏成功"
  }
  ```

## 6. 通用响应格式

所有API接口的响应格式统一为：

```json
{
  "success": boolean,       // 请求是否成功
  "data": any,            // 响应数据
  "message": string        // 响应消息
}
```

- `success`: 布尔值，表示请求是否成功
- `data`: 响应数据，根据接口不同返回不同格式
- `message`: 响应消息，通常是操作结果的描述

## 7. 错误处理

当请求失败时，响应格式如下：

```json
{
  "success": false,
  "data": null,
  "message": "错误信息"
}

```

常见错误码：
- `400`: 请求参数错误
- `401`: 未授权，需要登录
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误
