package com.techforum.backend.service;

import com.techforum.backend.dto.ArticleResponse;
import com.techforum.backend.model.Article;
import com.techforum.backend.model.User;
import com.techforum.backend.repository.ArticleRepository;
import com.techforum.backend.repository.UserRepository;
import com.techforum.backend.util.RedisUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class ArticleService {
    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RedisUtil redisUtil;

    private static final String ARTICLE_CACHE_KEY = "article:";
    private static final String ARTICLES_LIST_KEY = "articles:list";
    private static final long CACHE_EXPIRY = 3600; // 1小时缓存

    public List<ArticleResponse> findAll() {
        try {
            @SuppressWarnings("unchecked")
            List<ArticleResponse> articles = (List<ArticleResponse>) redisUtil.get(ARTICLES_LIST_KEY);
            if (articles != null) {
                return articles;
            }
        } catch (Exception e) {
            System.err.println("Redis读取失败，从数据库获取: " + e.getMessage());
        }

        // 从数据库获取
        List<ArticleResponse> articles = articleRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        
        try {
            // 缓存结果
            redisUtil.set(ARTICLES_LIST_KEY, articles, CACHE_EXPIRY);
        } catch (Exception e) {
            System.err.println("Redis写入失败: " + e.getMessage());
        }
        
        return articles;
    }

    public Optional<ArticleResponse> findById(Long id) {
        try {
            // 尝试从缓存获取
            ArticleResponse article = (ArticleResponse) redisUtil.get(ARTICLE_CACHE_KEY + id);
            if (article != null) {
                return Optional.of(article);
            }
        } catch (Exception e) {
            System.err.println("Redis读取失败，从数据库获取: " + e.getMessage());
        }

        // 从数据库获取
        Optional<Article> articleOptional = articleRepository.findById(id);
        Optional<ArticleResponse> responseOptional = articleOptional.map(this::convertToResponse);
        
        try {
            if (responseOptional.isPresent()) {
                // 缓存结果
                redisUtil.set(ARTICLE_CACHE_KEY + id, responseOptional.get(), CACHE_EXPIRY);
            }
        } catch (Exception e) {
            System.err.println("Redis写入失败: " + e.getMessage());
        }
        
        return responseOptional;
    }

    public Article save(Article article) {
        Article savedArticle = articleRepository.save(article);
        
        try {
            // 清除相关缓存
            redisUtil.delete(ARTICLES_LIST_KEY);
            redisUtil.delete(ARTICLE_CACHE_KEY + savedArticle.getId());
            redisUtil.delete(POPULAR_AUTHORS_KEY);
        } catch (Exception e) {
            System.err.println("Redis删除缓存失败: " + e.getMessage());
        }
        
        return savedArticle;
    }

    public void deleteById(Long id) {
        articleRepository.deleteById(id);
        
        try {
            // 清除相关缓存
            redisUtil.delete(ARTICLES_LIST_KEY);
            redisUtil.delete(ARTICLE_CACHE_KEY + id);
            redisUtil.delete(POPULAR_AUTHORS_KEY);
        } catch (Exception e) {
            System.err.println("Redis删除缓存失败: " + e.getMessage());
        }
    }

    public List<ArticleResponse> findByUserId(Long userId) {
        return articleRepository.findByUserId(userId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public void incrementReadCount(Long articleId) {
        Optional<Article> articleOptional = articleRepository.findById(articleId);
        if (articleOptional.isPresent()) {
            Article article = articleOptional.get();
            article.setReadCount(article.getReadCount() + 1);
            articleRepository.save(article);
            
            try {
                redisUtil.delete(ARTICLES_LIST_KEY);
                redisUtil.delete(ARTICLE_CACHE_KEY + articleId);
            } catch (Exception e) {
                System.err.println("Redis删除缓存失败: " + e.getMessage());
            }
        }
    }

    private static final String POPULAR_AUTHORS_KEY = "authors:popular";
    
    public List<Map<String, Object>> getPopularAuthors() {
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> popularAuthors = (List<Map<String, Object>>) redisUtil.get(POPULAR_AUTHORS_KEY);
            if (popularAuthors != null) {
                return popularAuthors;
            }
        } catch (Exception e) {
            System.err.println("Redis读取失败，从数据库获取: " + e.getMessage());
        }

        try {
            List<Article> allArticles = articleRepository.findAll();
            
            Map<Long, Long> userArticleCount = new HashMap<>();
            for (Article article : allArticles) {
                Long userId = article.getUserId();
                userArticleCount.put(userId, userArticleCount.getOrDefault(userId, 0L) + 1);
            }
            
            List<Map.Entry<Long, Long>> sortedEntries = new ArrayList<>(userArticleCount.entrySet());
            sortedEntries.sort((a, b) -> Long.compare(b.getValue(), a.getValue()));
            
            List<Map<String, Object>> result = new ArrayList<>();
            
            for (Map.Entry<Long, Long> entry : sortedEntries) {
                Long userId = entry.getKey();
                Long articleCount = entry.getValue();
                
                Optional<User> userOptional = userRepository.findById(userId);
                if (userOptional.isPresent()) {
                    User user = userOptional.get();
                    Map<String, Object> authorInfo = new HashMap<>();
                    authorInfo.put("id", user.getId());
                    authorInfo.put("nickname", user.getNickname());
                    authorInfo.put("avatar", user.getAvatar());
                    authorInfo.put("articleCount", articleCount);
                    result.add(authorInfo);
                }
            }
            
            try {
                // 缓存结果，设置30分钟过期
                redisUtil.set(POPULAR_AUTHORS_KEY, result, 1800);
            } catch (Exception e) {
                System.err.println("Redis写入失败: " + e.getMessage());
            }
            
            return result;
        } catch (Exception e) {
            System.err.println("获取热门作者失败: " + e.getMessage());
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    private ArticleResponse convertToResponse(Article article) {
        ArticleResponse response = new ArticleResponse();
        response.setId(article.getId());
        response.setTitle(article.getTitle());
        response.setContent(article.getContent());
        response.setCategory(article.getCategory());
        response.setUserId(article.getUserId());
        response.setCoverImage(article.getCoverImage());
        response.setReadCount(article.getReadCount());
        response.setCreatedAt(article.getCreatedAt());
        response.setUpdatedAt(article.getUpdatedAt());

        // 只返回用户的基本信息
        if (article.getUser() != null) {
            ArticleResponse.UserSummary userSummary = new ArticleResponse.UserSummary();
            userSummary.setId(article.getUser().getId());
            userSummary.setUsername(article.getUser().getNickname());
            userSummary.setAvatar(article.getUser().getAvatar());
            response.setUser(userSummary);
        }

        return response;
    }
}