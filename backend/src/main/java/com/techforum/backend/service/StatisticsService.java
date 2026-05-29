package com.techforum.backend.service;

import com.techforum.backend.repository.ArticleRepository;
import com.techforum.backend.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Service
public class StatisticsService {

    private final UserRepository userRepository;
    private final ArticleRepository articleRepository;

    public StatisticsService(UserRepository userRepository, ArticleRepository articleRepository) {
        this.userRepository = userRepository;
        this.articleRepository = articleRepository;
    }

    public Map<String, Object> getStatistics() {
        Map<String, Object> stats = new HashMap<>();
        
        // 文章总数（包括技术文章和学习笔记）
        long articleCount = articleRepository.count();
        stats.put("articleCount", articleCount);
        
        // 活跃用户数（总用户数）
        long userCount = userRepository.count();
        stats.put("userCount", userCount);
        
        // 今日更新数（今日创建的文章，包括技术文章和学习笔记）
        LocalDate today = LocalDate.now();
        long todayArticles = articleRepository.countByCreatedAtBetween(today.atStartOfDay(), today.atTime(23, 59, 59));
        stats.put("todayUpdates", todayArticles);
        
        return stats;
    }
}