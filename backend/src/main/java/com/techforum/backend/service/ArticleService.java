package com.techforum.backend.service;

import com.techforum.backend.dto.ArticleResponse;
import com.techforum.backend.model.Article;
import com.techforum.backend.model.User;
import com.techforum.backend.repository.ArticleRepository;
import com.techforum.backend.repository.UserRepository;
import com.techforum.backend.util.RedisUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
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
            List<ArticleResponse> articles = (List<ArticleResponse>) redisUtil.get(ARTICLES_LIST_KEY);
            if (articles != null) {
                log.debug("从Redis缓存获取文章列表，数量: {}", articles.size());
                return articles;
            }
        } catch (Exception e) {
            log.warn("Redis读取文章列表缓存失败，从数据库获取数据", e);
        }

        List<ArticleResponse> articles = articleRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
        log.info("从数据库获取文章列表，数量: {}", articles.size());

        try {
            redisUtil.set(ARTICLES_LIST_KEY, articles, CACHE_EXPIRY);
            log.debug("文章列表已缓存到Redis");
        } catch (Exception e) {
            log.warn("Redis写入文章列表缓存失败，继续使用数据库数据", e);
        }

        return articles;
    }

    public Optional<ArticleResponse> findById(Long id) {
        try {
            ArticleResponse article = (ArticleResponse) redisUtil.get(ARTICLE_CACHE_KEY + id);
            if (article != null) {
                log.debug("从Redis缓存获取文章，ID: {}", id);
                return Optional.of(article);
            }
        } catch (Exception e) {
            log.warn("Redis读取文章缓存失败，ID: {}，从数据库获取", id, e);
        }

        Optional<Article> articleOptional = articleRepository.findById(id);
        Optional<ArticleResponse> responseOptional = articleOptional.map(this::convertToResponse);

        try {
            if (responseOptional.isPresent()) {
                redisUtil.set(ARTICLE_CACHE_KEY + id, responseOptional.get(), CACHE_EXPIRY);
                log.debug("文章已缓存到Redis，ID: {}", id);
            }
        } catch (Exception e) {
            log.warn("Redis写入文章缓存失败，ID: {}", id, e);
        }

        return responseOptional;
    }

    public Article save(Article article) {
        Article savedArticle = articleRepository.save(article);
        log.info("保存文章成功，ID: {}", savedArticle.getId());

        try {
            redisUtil.delete(ARTICLES_LIST_KEY);
            redisUtil.delete(ARTICLE_CACHE_KEY + savedArticle.getId());
            log.debug("文章保存后清除相关缓存，ID: {}", savedArticle.getId());
        } catch (Exception e) {
            log.warn("Redis清除文章缓存失败，ID: {}", savedArticle.getId(), e);
        }

        return savedArticle;
    }

    public void deleteById(Long id) {
        articleRepository.deleteById(id);
        log.info("删除文章成功，ID: {}", id);

        try {
            redisUtil.delete(ARTICLES_LIST_KEY);
            redisUtil.delete(ARTICLE_CACHE_KEY + id);
            log.debug("删除文章后清除相关缓存，ID: {}", id);
        } catch (Exception e) {
            log.warn("Redis清除文章缓存失败，ID: {}", id, e);
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
            log.debug("文章阅读量递增，ID: {}, 新阅读量: {}", articleId, article.getReadCount());

            try {
                redisUtil.delete(ARTICLES_LIST_KEY);
                redisUtil.delete(ARTICLE_CACHE_KEY + articleId);
            } catch (Exception e) {
                log.warn("Redis清除阅读量缓存失败，ID: {}", articleId, e);
            }
        }
    }

    public List<Map<String, Object>> getPopularAuthors() {
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
                    authorInfo.put("username", user.getUsername());
                    authorInfo.put("avatar", user.getAvatar());
                    authorInfo.put("articleCount", articleCount);
                    result.add(authorInfo);
                }
            }

            log.info("获取热门作者成功，共 {} 位", result.size());
            return result;
        } catch (Exception e) {
            log.error("获取热门作者失败", e);
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

        if (article.getUser() != null) {
            ArticleResponse.UserSummary userSummary = new ArticleResponse.UserSummary();
            userSummary.setId(article.getUser().getId());
            userSummary.setUsername(article.getUser().getUsername());
            userSummary.setAvatar(article.getUser().getAvatar());
            response.setUser(userSummary);
        }

        return response;
    }
}