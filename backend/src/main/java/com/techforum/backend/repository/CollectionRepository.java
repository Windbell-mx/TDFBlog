package com.techforum.backend.repository;

import com.techforum.backend.model.Collection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public interface CollectionRepository extends JpaRepository<Collection, Long> {
    List<Collection> findByUserId(String userId);
    
    Optional<Collection> findByUserIdAndArticleId(String userId, Long articleId);
    
    boolean existsByUserIdAndArticleId(String userId, Long articleId);
    
    @Transactional
    void deleteByUserIdAndArticleId(String userId, Long articleId);
    
    @Transactional
    void deleteByUserId(String userId);
}
