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
    private static final String POPULAR_AUTHORS_KEY = "authors:popular";
    // private static final long CACHE_EXPIRY = 3600;

    public List<ArticleResponse> findAll(String sort) {
        // 从数据库获取
        List<ArticleResponse> articles = articleRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        
        // 根据排序参数排序
        if ("hot".equals(sort)) {
            // 按阅读量排序（最热）
            articles.sort((a, b) -> Integer.compare(b.getReadCount(), a.getReadCount()));
        } else {
            // 默认按创建时间排序（最新）
            articles.sort((a, b) -> {
                if (a.getCreatedAt() == null && b.getCreatedAt() == null) return 0;
                if (a.getCreatedAt() == null) return 1;
                if (b.getCreatedAt() == null) return -1;
                return b.getCreatedAt().compareTo(a.getCreatedAt());
            });
        }
        
        return articles;
    }

    public Optional<ArticleResponse> findById(Long id) {
        // 临时禁用缓存，从数据库获取最新数据
        System.out.println("findById - 从数据库获取文章ID: " + id);
        Optional<Article> articleOptional = articleRepository.findById(id);
        Optional<ArticleResponse> responseOptional = articleOptional.map(this::convertToResponse);
        return responseOptional;
    }

    public Article findEntityById(Long id) {
        Optional<Article> articleOptional = articleRepository.findById(id);
        return articleOptional.orElse(null);
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

    public List<ArticleResponse> findByUserId(String userId) {
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
            
            Map<String, Long> userArticleCount = new HashMap<>();
            for (Article article : allArticles) {
                String userId = article.getUserId();
                userArticleCount.put(userId, userArticleCount.getOrDefault(userId, 0L) + 1);
            }
            
            List<Map.Entry<String, Long>> sortedEntries = new ArrayList<>(userArticleCount.entrySet());
            sortedEntries.sort((a, b) -> Long.compare(b.getValue(), a.getValue()));
            
            List<Map<String, Object>> result = new ArrayList<>();
            
            for (Map.Entry<String, Long> entry : sortedEntries) {
                String userId = entry.getKey();
                Long articleCount = entry.getValue();
                
                Optional<User> userOptional = userRepository.findById(userId);
                if (userOptional.isPresent()) {
                    User user = userOptional.get();
                    Map<String, Object> authorInfo = new HashMap<>();
                    authorInfo.put("id", user.getId());
                    authorInfo.put("nickname", user.getNickname());
                    authorInfo.put("avatar", convertAvatarUrl(user.getAvatar()));
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
        response.setTags(article.getTags());
        response.setUserId(article.getUserId());
        response.setCoverImage(article.getCoverImage());
        response.setReadCount(article.getReadCount());
        response.setCreatedAt(article.getCreatedAt());
        response.setUpdatedAt(article.getUpdatedAt());
        
        System.out.println("convertToResponse - 文章ID: " + article.getId() + ", 分类: " + article.getCategory() + ", 标签: " + article.getTags());

        // 只返回用户的基本信息
        if (article.getUser() != null) {
            ArticleResponse.UserSummary userSummary = new ArticleResponse.UserSummary();
            userSummary.setId(article.getUser().getId());
            userSummary.setNickname(article.getUser().getNickname());
            userSummary.setAvatar(convertAvatarUrl(article.getUser().getAvatar()));
            response.setUser(userSummary);
        }

        return response;
    }

    private String convertAvatarUrl(String avatar) {
        return avatar;
    }
}
