package com.techforum.backend.service;

import com.techforum.backend.model.Collection;
import com.techforum.backend.repository.CollectionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class CollectionService {
    @Autowired
    private CollectionRepository collectionRepository;

    public Collection addCollection(String userId, Long articleId) {
        if (collectionRepository.existsByUserIdAndArticleId(userId, articleId)) {
            return collectionRepository.findByUserIdAndArticleId(userId, articleId).orElse(null);
        }
        
        Collection collection = new Collection();
        collection.setUserId(userId);
        collection.setArticleId(articleId);
        return collectionRepository.save(collection);
    }

    @Transactional
    public void removeCollection(String userId, Long articleId) {
        collectionRepository.deleteByUserIdAndArticleId(userId, articleId);
    }

    public List<Collection> getUserCollections(String userId) {
        return collectionRepository.findByUserId(userId);
    }

    public boolean isCollected(String userId, Long articleId) {
        return collectionRepository.existsByUserIdAndArticleId(userId, articleId);
    }

    public Optional<Collection> findByUserIdAndArticleId(String userId, Long articleId) {
        return collectionRepository.findByUserIdAndArticleId(userId, articleId);
    }
}