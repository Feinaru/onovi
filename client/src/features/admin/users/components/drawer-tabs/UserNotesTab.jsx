import React, { useState } from 'react';
import './UserNotesTab.css';

/**
 * UserNotesTab - Internal admin notes with author and timestamp
 */
function UserNotesTab({ notes, onAddNote, onNoteAdded }) {
  const [newNote, setNewNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    
    if (!newNote.trim()) return;

    setSubmitting(true);
    try {
      await onAddNote(newNote.trim());
      setNewNote('');
      onNoteAdded();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  return (
    <div className="user-notes-tab">
      <form className="notes-form" onSubmit={handleSubmit}>
        <textarea
          className="notes-textarea"
          placeholder="הוסף הערה פנימית..."
          value={newNote}
          onChange={e => setNewNote(e.target.value)}
          rows={4}
        />
        <button
          type="submit"
          className="notes-submit-btn"
          disabled={!newNote.trim() || submitting}
        >
          {submitting ? 'שומר...' : 'הוסף הערה'}
        </button>
      </form>

      <div className="notes-list">
        {notes.length === 0 ? (
          <div className="notes-empty">
            <div className="notes-empty-icon">📝</div>
            <p>אין הערות עדיין</p>
          </div>
        ) : (
          notes.map(note => (
            <div key={note.id} className="note-item">
              <div className="note-header">
                <span className="note-author">{note.admin?.fullName || 'מנהל'}</span>
                <span className="note-date">{formatDate(note.createdAt)}</span>
              </div>
              <div className="note-content">{note.content}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default UserNotesTab;
