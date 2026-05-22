package com.techforum.backend.controller;

import com.techforum.backend.model.Note;
import com.techforum.backend.service.NoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/notes")
public class NoteController {
    @Autowired
    private NoteService noteService;

    @PostMapping
    public Note createNote(@RequestBody Note note) {
        note.setCreatedAt(LocalDateTime.now());
        note.setUpdatedAt(LocalDateTime.now());
        return noteService.save(note);
    }

    @GetMapping("/{id}")
    public Optional<Note> getNoteById(@PathVariable Long id) {
        return noteService.findById(id);
    }

    @GetMapping("/user/{userId}")
    public List<Note> getNotesByUserId(@PathVariable String userId) {
        return noteService.findByUserId(userId);
    }

    @PutMapping("/{id}")
    public Note updateNote(@PathVariable Long id, @RequestBody Note note) {
        Optional<Note> existingNote = noteService.findById(id);
        if (existingNote.isPresent()) {
            Note updatedNote = existingNote.get();
            updatedNote.setTitle(note.getTitle());
            updatedNote.setContent(note.getContent());
            updatedNote.setUpdatedAt(LocalDateTime.now());
            return noteService.save(updatedNote);
        }
        return null;
    }

    @DeleteMapping("/{id}")
    public void deleteNote(@PathVariable Long id) {
        noteService.deleteById(id);
    }
}