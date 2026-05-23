package com.techforum.backend.service;

import com.techforum.backend.model.Article;
import com.techforum.backend.model.User;
import com.techforum.backend.repository.ArticleRepository;
import com.techforum.backend.repository.CollectionRepository;
import com.techforum.backend.repository.NoteRepository;
import com.techforum.backend.repository.UserRepository;
import com.techforum.backend.util.MinioUtil;
import com.techforum.backend.util.RedisUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private ArticleRepository articleRepository;
    
    @Autowired
    private NoteRepository noteRepository;
    
    @Autowired
    private CollectionRepository collectionRepository;
    
    @Autowired
    private RedisUtil redisUtil;
    
    @Autowired
    private MinioUtil minioUtil;
    
    private static final String USER_CACHE_KEY = "user:";
    private static final String ARTICLES_LIST_KEY = "articles:list";
    private static final long CACHE_EXPIRY = 3600;

    public User save(User user) {
        User savedUser = userRepository.save(user);
        
        try {
            redisUtil.delete(USER_CACHE_KEY + savedUser.getId());
            redisUtil.delete(USER_CACHE_KEY + savedUser.getEmail());
        } catch (Exception e) {
            System.err.println("Redis删除缓存失败: " + e.getMessage());
        }
        
        return savedUser;
    }

    public Optional<User> findById(String id) {
        try {
            User user = (User) redisUtil.get(USER_CACHE_KEY + id);
            if (user != null) {
                return Optional.of(user);
            }
        } catch (Exception e) {
            System.err.println("Redis读取失败，从数据库获取: " + e.getMessage());
        }

        Optional<User> userOptional = userRepository.findById(id);
        
        try {
            if (userOptional.isPresent()) {
                redisUtil.set(USER_CACHE_KEY + id, userOptional.get(), CACHE_EXPIRY);
            }
        } catch (Exception e) {
            System.err.println("Redis写入失败: " + e.getMessage());
        }
        
        return userOptional;
    }

    public Optional<User> findByEmail(String email) {
        try {
            User user = (User) redisUtil.get(USER_CACHE_KEY + email);
            if (user != null) {
                return Optional.of(user);
            }
        } catch (Exception e) {
            System.err.println("Redis读取失败，从数据库获取: " + e.getMessage());
        }

        Optional<User> userOptional = userRepository.findByEmail(email);
        
        try {
            if (userOptional.isPresent()) {
                redisUtil.set(USER_CACHE_KEY + email, userOptional.get(), CACHE_EXPIRY);
            }
        } catch (Exception e) {
            System.err.println("Redis写入失败: " + e.getMessage());
        }
        
        return userOptional;
    }

    public Optional<User> findByResetToken(String resetToken) {
        return userRepository.findByResetToken(resetToken);
    }

    @Transactional
    public void deleteAccount(String userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return;
        }
        
        if (user.getAvatar() != null && !user.getAvatar().isEmpty()) {
            try {
                minioUtil.deleteFile(user.getAvatar());
            } catch (Exception e) {
                System.err.println("删除头像失败: " + e.getMessage());
            }
        }
        
        List<Article> userArticles = articleRepository.findByUserId(userId);
        for (Article article : userArticles) {
            if (article.getCoverImage() != null && !article.getCoverImage().isEmpty()) {
                try {
                    minioUtil.deleteFile(article.getCoverImage());
                } catch (Exception e) {
                    System.err.println("删除文章封面失败: " + e.getMessage());
                }
            }
        }
        
        articleRepository.deleteByUserId(userId);
        noteRepository.deleteByUserId(userId);
        collectionRepository.deleteByUserId(userId);
        
        userRepository.deleteById(userId);
        
        try {
            redisUtil.delete(USER_CACHE_KEY + userId);
            redisUtil.delete(USER_CACHE_KEY + user.getEmail());
            redisUtil.delete(ARTICLES_LIST_KEY);
        } catch (Exception e) {
            System.err.println("Redis删除缓存失败: " + e.getMessage());
        }
    }

    public void deleteById(String id) {
        User user = userRepository.findById(id).orElse(null);
        userRepository.deleteById(id);
        
        try {
            redisUtil.delete(USER_CACHE_KEY + id);
            if (user != null) {
                redisUtil.delete(USER_CACHE_KEY + user.getEmail());
            }
        } catch (Exception e) {
            System.err.println("Redis删除缓存失败: " + e.getMessage());
        }
    }
}
