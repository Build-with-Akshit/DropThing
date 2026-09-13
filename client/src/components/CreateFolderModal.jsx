import React, { useState, useEffect } from 'react';
import { X, FolderPlus, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export const CreateFolderModal = ({ isOpen, onClose, onSuccess, onNotify }) => {
  const [name, setName] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setError('');
    setLoading(true);

    try {
      const data = await api.createPermanentFolder(name.trim(), customCode.trim() || undefined);
      onNotify(`Folder "${name}" created with PIN #${data.folder.code}!`, 'success');
      onSuccess(data.folder);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '460px' }}>
        <div className="modal-header">
          <div className="modal-title">
            <FolderPlus size={20} color="var(--accent-primary)" />
            Create Permanent Drive Folder
          </div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div style={{
                background: 'rgba(244, 63, 94, 0.15)',
                border: '1px solid rgba(244, 63, 94, 0.3)',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem'
              }}>
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Folder Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Work Documents, Study Material, Python Scripts"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Custom Access PIN / Code (Optional)</label>
              <input
                type="text"
                className="form-input"
                style={{ fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}
                placeholder="e.g. 7721 or AKSHIT (Leave blank for auto 4-digit PIN)"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                maxLength={10}
              />
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                This code can be used on any library/public PC to open this folder directly without logging in.
              </span>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--accent-emerald)',
              fontSize: '0.85rem'
            }}>
              <ShieldCheck size={18} />
              <span><strong>Permanent Storage:</strong> Files in this folder will never expire or be deleted automatically.</span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={!name.trim() || loading}>
              {loading ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
