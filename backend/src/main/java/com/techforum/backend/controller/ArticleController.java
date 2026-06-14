package com.techforum.backend.controller;

import com.techforum.backend.dto.ArticleResponse;
import com.techforum.backend.dto.CreateArticleRequest;
import com.techforum.backend.dto.UpdateArticleRequest;
import com.techforum.backend.model.Article;
import com.techforum.backend.service.ArticleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/articles")
public class ArticleController {
    @Autowired
    private ArticleService articleService;

    @GetMapping
    public ResponseEntity<List<ArticleResponse>> getAllArticles(
            @RequestParam(required = false, defaultValue = "latest") String sort) {
        List<ArticleResponse> articles = articleService.findAll(sort);
        return ResponseEntity.ok(articles);
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArticleResponse> getArticleById(@PathVariable Long id) {
        return articleService.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ArticleResponse> createArticle(
            @RequestBody CreateArticleRequest request,
            Authentication authentication) {
        Article article = new Article();
        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        article.setUserId(authentication.getName());
        article.setCategory(request.getCategory());
        if (request.getTags() != null) {
            article.setTags(request.getTags());
        }
        
        Article savedArticle = articleService.save(article);
        
        // 重新获取保存后的文章，确保返回正确的响应格式
        return articleService.findById(savedArticle.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ArticleResponse> updateArticle(
            @PathVariable Long id,
            @RequestBody UpdateArticleRequest request,
            Authentication authentication) {
        // 从数据库获取实际的文章实体
        Article article = articleService.findEntityById(id);
        if (article == null) {
            return ResponseEntity.notFound().build();
        }
        
        // 验证是否为文章作者
        if (!article.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        
        // 更新字段
        if (request.getTitle() != null) {
            article.setTitle(request.getTitle());
        }
        if (request.getContent() != null) {
            article.setContent(request.getContent());
        }
        if (request.getCategory() != null) {
            article.setCategory(request.getCategory());
        }
        if (request.getTags() != null) {
            article.setTags(request.getTags());
        }
        
        // 保存更新
        Article savedArticle = articleService.save(article);
        
        // 重新获取更新后的文章
        return articleService.findById(savedArticle.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

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
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        
        articleService.deleteById(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ArticleResponse>> getArticlesByUserId(@PathVariable String userId) {
        List<ArticleResponse> articles = articleService.findByUserId(userId);
        return ResponseEntity.ok(articles);
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> incrementReadCount(@PathVariable Long id) {
        articleService.incrementReadCount(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/popular-authors")
    public ResponseEntity<List<Map<String, Object>>> getPopularAuthors() {
        List<Map<String, Object>> authors = articleService.getPopularAuthors();
        return ResponseEntity.ok(authors);
    }
}