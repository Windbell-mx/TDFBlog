package com.techforum.backend.repository;

import com.techforum.backend.model.Note;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

public interface NoteRepository extends JpaRepository<Note, Long> {
    List<Note> findByUserId(String userId);
    
    @Transactional
    void deleteByUserId(String userId);
}
