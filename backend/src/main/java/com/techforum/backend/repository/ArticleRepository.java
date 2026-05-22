package com.techforum.backend.repository;

import com.techforum.backend.model.Article;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface ArticleRepository extends JpaRepository<Article, Long> {
    List<Article> findByUserId(String userId);
    
    @Transactional
    void deleteByUserId(String userId);
}
