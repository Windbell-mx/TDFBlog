package com.techforum.backend.controller;

import com.techforum.backend.dto.ArticleResponse;
import com.techforum.backend.dto.CreateArticleRequest;
import com.techforum.backend.dto.UpdateArticleRequest;
import com.techforum.backend.model.Article;
import com.techforum.backend.service.ArticleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    public ResponseEntity<ArticleResponse> createArticle(@RequestBody CreateArticleRequest request) {
        Article article = new Article();
        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        article.setUserId(request.getUserId());
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
    public ResponseEntity<ArticleResponse> updateArticle(@PathVariable Long id, @RequestBody UpdateArticleRequest request) {
        // 先获取现有文章
        return articleService.findById(id)
                .map(existingResponse -> {
                    // 创建文章对象进行更新
                    Article article = new Article();
                    article.setId(id);
                    article.setTitle(request.getTitle() != null ? request.getTitle() : existingResponse.getTitle());
                    article.setContent(request.getContent() != null ? request.getContent() : existingResponse.getContent());
                    article.setCategory(request.getCategory() != null ? request.getCategory() : existingResponse.getCategory());
                    article.setTags(request.getTags() != null ? request.getTags() : existingResponse.getTags());
                    article.setUserId(existingResponse.getUserId()); // 保持原有的用户ID
                    
                    // 保存更新
                    articleService.save(article);
                    
                    // 重新获取更新后的文章
                    return articleService.findById(id)
                            .map(ResponseEntity::ok)
                            .orElse(ResponseEntity.notFound().build());
                })
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteArticle(@PathVariable Long id) {
        if (articleService.findById(id).isPresent()) {
            articleService.deleteById(id);
            return ResponseEntity.ok().build();
        }
        return ResponseEntity.notFound().build();
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