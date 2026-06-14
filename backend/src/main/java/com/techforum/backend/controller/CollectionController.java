package com.techforum.backend.controller;

import com.techforum.backend.model.Collection;
import com.techforum.backend.service.CollectionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/collections")
public class CollectionController {
    @Autowired
    private CollectionService collectionService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> addCollection(
            @RequestBody Map<String, Long> request,
            Authentication authentication) {
        String userId = authentication.getName();
        Long articleId = request.get("articleId");
        
        if (articleId == null) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "文章ID不能为空");
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        Collection collection = collectionService.addCollection(userId, articleId);
        
        Map<String, Object> response = new HashMap<>();
        if (collection != null) {
            response.put("success", true);
            response.put("message", "收藏成功");
            response.put("collection", collection);
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("message", "已收藏");
            return ResponseEntity.ok(response);
        }
    }

    @DeleteMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> removeCollection(
            @RequestParam Long articleId,
            Authentication authentication) {
        
        String userId = authentication.getName();
        collectionService.removeCollection(userId, articleId);
        
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("message", "取消收藏成功");
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/remove")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Map<String, Object>> removeCollectionPost(
            @RequestBody Map<String, Long> request,
            Authentication authentication) {
        try {
            String userId = authentication.getName();
            Long articleId = request.get("articleId");
            
            if (articleId == null) {
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("success", false);
                errorResponse.put("message", "参数错误");
                return ResponseEntity.badRequest().body(errorResponse);
            }
            
            collectionService.removeCollection(userId, articleId);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "取消收藏成功");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "操作失败，请稍后重试");
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getUserCollections(@PathVariable String userId) {
        List<Collection> collections = collectionService.getUserCollections(userId);
        
        List<Map<String, Object>> response = collections.stream()
                .map(collection -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", collection.getId());
                    map.put("articleId", collection.getArticleId());
                    map.put("createdAt", collection.getCreatedAt());
                    if (collection.getArticle() != null) {
                        map.put("articleTitle", collection.getArticle().getTitle());
                        map.put("articleContent", collection.getArticle().getContent());
                    }
                    return map;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/check")
    public ResponseEntity<Map<String, Boolean>> checkCollection(
            @RequestParam String userId,
            @RequestParam Long articleId) {
        boolean isCollected = collectionService.isCollected(userId, articleId);
        
        Map<String, Boolean> response = new HashMap<>();
        response.put("isCollected", isCollected);
        return ResponseEntity.ok(response);
    }
}