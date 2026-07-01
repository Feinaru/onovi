import React, { useState } from 'react';
import './TagManager.css';

/**
 * TagManager - Modal for managing user tags
 */
function TagManager({ userTags, availableTags, onAddTag, onRemoveTag, onClose }) {
  const userTagIds = userTags.map(ut => ut.tag.id);

  async function handleToggleTag(tagId) {
    try {
      const hasTag = userTagIds.includes(tagId);
      if (hasTag) {
        await onRemoveTag(tagId);
      } else {
        await onAddTag(tagId);
      }
    } catch (err) {
      alert(err.message);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="tag-manager-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <h3 className="tag-manager-title">ניהול תגיות</h3>
        
        <div className="tag-manager-content">
          {availableTags.length === 0 ? (
            <div className="tag-manager-empty">
              <p>אין תגיות זמינות במערכת</p>
            </div>
          ) : (
            <div className="tag-list">
              {availableTags.map(tag => {
                const isSelected = userTagIds.includes(tag.id);
                return (
                  <label
                    key={tag.id}
                    className={`tag-item ${isSelected ? 'selected' : ''}`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleTag(tag.id)}
                    />
                    <div className="tag-item-content">
                      <div className="tag-item-header">
                        <span
                          className="tag-item-indicator"
                          style={{ backgroundColor: tag.color }}
                        />
                        <span className="tag-item-name">{tag.name}</span>
                        {tag.isSystem && (
                          <span className="tag-item-badge">מערכת</span>
                        )}
                      </div>
                      {tag.description && (
                        <span className="tag-item-description">{tag.description}</span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        <div className="tag-manager-actions">
          <button className="btn-primary" onClick={onClose}>
            סגור
          </button>
        </div>
      </div>
    </div>
  );
}

export default TagManager;
