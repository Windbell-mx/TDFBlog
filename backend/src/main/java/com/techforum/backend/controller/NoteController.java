package com.techforum.backend.controller;

import com.techforum.backend.dto.ArticleResponse;
import com.techforum.backend.model.Article;
import com.techforum.backend.service.ArticleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteController {
    @Autowired
    private ArticleService articleService;

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ArticleResponse> createNote(
            @RequestBody Article note,
            Authentication authentication) {
        note.setUserId(authentication.getName());
        note.setCategory("学习笔记");
        note.setCreatedAt(LocalDateTime.now());
        note.setUpdatedAt(LocalDateTime.now());
        Article savedNote = articleService.save(note);
        return articleService.findById(savedNote.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ArticleResponse> getNoteById(@PathVariable Long id) {
        return articleService.findById(id)
                .filter(article -> "学习笔记".equals(article.getCategory()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<ArticleResponse>> getNotesByUserId(@PathVariable String userId) {
        List<ArticleResponse> notes = articleService.findByUserId(userId).stream()
                .filter(note -> "学习笔记".equals(note.getCategory()))
                .toList();
        return ResponseEntity.ok(notes);
    }

    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ArticleResponse> updateNote(
            @PathVariable Long id,
            @RequestBody Article note,
            Authentication authentication) {
        Article existingNote = articleService.findEntityById(id);
        if (existingNote != null && "学习笔记".equals(existingNote.getCategory())) {
            // 验证是否为笔记作者
            if (!existingNote.getUserId().equals(authentication.getName())) {
                return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
            }
            existingNote.setTitle(note.getTitle());
            existingNote.setContent(note.getContent());
            if (note.getTags() != null) {
                existingNote.setTags(note.getTags());
            }
            existingNote.setUpdatedAt(LocalDateTime.now());
            Article savedNote = articleService.save(existingNote);
            return articleService.findById(savedNote.getId())
                    .map(ResponseEntity::ok)
                    .orElse(ResponseEntity.notFound().build());
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Void> deleteNote(
            @PathVariable Long id,
            Authentication authentication) {
        Article note = articleService.findEntityById(id);
        if (note == null) {
            return ResponseEntity.notFound().build();
        }
        // 验证是否为笔记作者
        if (!note.getUserId().equals(authentication.getName())) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.FORBIDDEN).build();
        }
        articleService.deleteById(id);
        return ResponseEntity.ok().build();
    }
}