package com.techforum.backend.service;

import com.techforum.backend.model.Collection;
import com.techforum.backend.repository.CollectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class CollectionService {
    @Autowired
    private CollectionRepository collectionRepository;

    public Collection addCollection(Long userId, Long articleId) {
        if (collectionRepository.existsByUserIdAndArticleId(userId, articleId)) {
            return collectionRepository.findByUserIdAndArticleId(userId, articleId).orElse(null);
        }
        
        Collection collection = new Collection();
        collection.setUserId(userId);
        collection.setArticleId(articleId);
        return collectionRepository.save(collection);
    }

    public void removeCollection(Long userId, Long articleId) {
        collectionRepository.deleteByUserIdAndArticleId(userId, articleId);
    }

    public List<Collection> getUserCollections(Long userId) {
        return collectionRepository.findByUserId(userId);
    }

    public boolean isCollected(Long userId, Long articleId) {
        return collectionRepository.existsByUserIdAndArticleId(userId, articleId);
    }

    public Optional<Collection> findByUserIdAndArticleId(Long userId, Long articleId) {
        return collectionRepository.findByUserIdAndArticleId(userId, articleId);
    }
}