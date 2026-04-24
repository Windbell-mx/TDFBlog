import React from 'react';

interface Note {
  id: number;
  title: string;
  content: string;
  date: string;
  tags: string[];
}

interface NoteCardProps {
  note: Note;
}

const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  return (
    <div className="note-card">
      <div className="note-header">
        <span className="note-date">{note.date}</span>
      </div>
      <h3 className="note-title">{note.title}</h3>
      <p className="note-content">{note.content}</p>
      <div className="note-tags">
        {note.tags.map((tag, index) => (
          <span key={index} className="note-tag">{tag}</span>
        ))}
      </div>
      <div className="note-actions">
        <button className="action-button edit">编辑</button>
        <button className="action-button delete">删除</button>
      </div>
    </div>
  );
};

export default NoteCard;