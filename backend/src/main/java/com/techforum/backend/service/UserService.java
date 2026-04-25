package com.techforum.backend.service;

import com.techforum.backend.model.User;
import com.techforum.backend.repository.UserRepository;
import com.techforum.backend.util.RedisUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {
    @Autowired
    private UserRepository userRepository;
    
    @Autowired
    private RedisUtil redisUtil;
    
    private static final String USER_CACHE_KEY = "user:";
    private static final long CACHE_EXPIRY = 3600; // 1小时缓存

    public User save(User user) {
        User savedUser = userRepository.save(user);
        
        try {
            // 清除相关缓存
            redisUtil.delete(USER_CACHE_KEY + savedUser.getId());
            redisUtil.delete(USER_CACHE_KEY + savedUser.getEmail());
        } catch (Exception e) {
            System.err.println("Redis删除缓存失败: " + e.getMessage());
        }
        
        return savedUser;
    }

    public Optional<User> findById(Long id) {
        try {
            // 尝试从缓存获取
            User user = (User) redisUtil.get(USER_CACHE_KEY + id);
            if (user != null) {
                return Optional.of(user);
            }
        } catch (Exception e) {
            System.err.println("Redis读取失败，从数据库获取: " + e.getMessage());
        }

        // 从数据库获取
        Optional<User> userOptional = userRepository.findById(id);
        
        try {
            if (userOptional.isPresent()) {
                // 缓存结果
                redisUtil.set(USER_CACHE_KEY + id, userOptional.get(), CACHE_EXPIRY);
            }
        } catch (Exception e) {
            System.err.println("Redis写入失败: " + e.getMessage());
        }
        
        return userOptional;
    }



    public Optional<User> findByEmail(String email) {
        try {
            // 尝试从缓存获取
            User user = (User) redisUtil.get(USER_CACHE_KEY + email);
            if (user != null) {
                return Optional.of(user);
            }
        } catch (Exception e) {
            System.err.println("Redis读取失败，从数据库获取: " + e.getMessage());
        }

        // 从数据库获取
        Optional<User> userOptional = userRepository.findByEmail(email);
        
        try {
            if (userOptional.isPresent()) {
                // 缓存结果
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

    public void deleteById(Long id) {
        User user = userRepository.findById(id).orElse(null);
        userRepository.deleteById(id);
        
        try {
            // 清除相关缓存
            redisUtil.delete(USER_CACHE_KEY + id);
            if (user != null) {
                redisUtil.delete(USER_CACHE_KEY + user.getEmail());
            }
        } catch (Exception e) {
            System.err.println("Redis删除缓存失败: " + e.getMessage());
        }
    }
}
