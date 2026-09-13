import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, FileText, Send, Sparkles } from 'lucide-react';

export const TextModal = ({ isOpen, onClose, onSave, loading }) => {
  const [title, setTitle] = useState('');
  const [textContent, setTextContent] = useState('');
  const textareaRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Auto-focus directly into the textarea when modal opens
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
        }
      }, 50);
      return () => clearTimeout(timer);
    } else {
      // Reset fields on close
      setTitle('');
      setTextContent('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!textContent.trim()) return;

    onSave({
      title: title.trim(),
      textContent: textContent.trim()
    });
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setTextContent(text);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    } catch {
      // Fallback
    }
  };

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <FileText size={20} color="var(--accent-cyan)" />
            Add Text, Link, or Note
          </div>
          <button className="modal-close" onClick={onClose} title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* 1. Main Text / Link Content Area (PRIMARY FOCUS) */}
            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Write Text or Paste Link <span style={{ color: 'var(--accent-cyan)' }}>*</span>
                </label>
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-cyan)',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <Sparkles size={13} />
                  Paste from Clipboard
                </button>
              </div>

              <textarea
                ref={textareaRef}
                autoFocus
                className="form-textarea code-font"
                style={{ minHeight: '200px' }}
                placeholder="Paste your link, long text, code snippet, notes, or passwords here. It will immediately appear on the other device!"
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (textContent.trim()) {
                      handleSubmit(e);
                    }
                  }
                }}
                required
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                <span>{textContent.length} characters</span>
                <span>💡 Shortcut: <strong>Ctrl + Enter</strong> to post</span>
              </div>
            </div>

            {/* 2. Optional Title / Subject */}
            <div className="form-group" style={{ marginTop: '0.5rem' }}>
              <label className="form-label">Title / Label <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>(Optional - generated automatically if left empty)</span></label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., Python Research, Library Pass, Wi-Fi Note..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel (Esc)
            </button>
            <button
              type="submit"
              className="btn btn-accent"
              disabled={!textContent.trim() || loading}
            >
              <Send size={16} />
              <span>{loading ? 'Posting...' : 'Post to Locker'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
