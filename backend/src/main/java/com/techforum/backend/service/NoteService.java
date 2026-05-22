package com.techforum.backend.service;

import com.techforum.backend.model.Note;
import com.techforum.backend.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class NoteService {
    @Autowired
    private NoteRepository noteRepository;

    public Note save(Note note) {
        return noteRepository.save(note);
    }

    public Optional<Note> findById(Long id) {
        return noteRepository.findById(id);
    }

    public List<Note> findByUserId(String userId) {
        return noteRepository.findByUserId(userId);
    }

    public void deleteById(Long id) {
        noteRepository.deleteById(id);
    }
}