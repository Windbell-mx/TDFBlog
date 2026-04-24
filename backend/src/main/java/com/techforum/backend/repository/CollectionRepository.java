package com.techforum.backend.repository;

import com.techforum.backend.model.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, Long> {
    List<Collection> findByUserId(Long userId);
    
    Optional<Collection> findByUserIdAndArticleId(Long userId, Long articleId);
    
    boolean existsByUserIdAndArticleId(Long userId, Long articleId);
    
    void deleteByUserIdAndArticleId(Long userId, Long articleId);
}