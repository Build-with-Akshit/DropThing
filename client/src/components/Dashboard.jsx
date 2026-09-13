import React, { useState, useEffect } from 'react';
import { Folder, Plus, Copy, Check, ArrowRight, Trash2, HardDrive, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export const Dashboard = ({ user, onOpenFolder, onOpenNewFolder, onNotify }) => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  const fetchFolders = async () => {
    try {
      setLoading(true);
      const data = await api.getUserFolders();
      setFolders(data);
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    onNotify(`Locker PIN #${code} copied!`, 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteFolder = async (folderId, folderName, e) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${folderName}" and all its contents?`)) {
      return;
    }
    try {
      await api.deleteFolder(folderId);
      onNotify('Folder deleted successfully.', 'info');
      setFolders(folders.filter(f => f.id !== folderId));
    } catch (err) {
      onNotify(err.message, 'error');
    }
  };

  const formatFileSize = (bytes) => {
    const num = Number(bytes);
    if (!num || isNaN(num) || num <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(num) / Math.log(k)));
    return parseFloat((num / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalStorage = folders.reduce((acc, f) => acc + Number(f.total_size_bytes || 0), 0);
  const totalItems = folders.reduce((acc, f) => acc + Number(f.item_count || 0), 0);

  return (
    <div className="dashboard-container">
      {/* Header Profile Bar */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            {user?.username ? `${user.username}'s Cloud Drive` : 'My Cloud Drive'}
          </h1>
          <p className="dashboard-subtitle">
            Permanent cloud storage spaces. Access any of these on public/library PCs using their short PIN.
          </p>
        </div>

        <button className="btn btn-primary" onClick={onOpenNewFolder}>
          <Plus size={16} />
          Create New Folder
        </button>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
            <Folder size={22} />
          </div>
          <div>
            <div className="stat-num">{folders.length}</div>
            <div className="stat-label">Permanent Folders</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
            <HardDrive size={22} />
          </div>
          <div>
            <div className="stat-num">{totalItems}</div>
            <div className="stat-label">Total Files & Notes</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-emerald)' }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="stat-num">{formatFileSize(totalStorage)}</div>
            <div className="stat-label">Storage Used (Never Expires)</div>
          </div>
        </div>
      </div>

      {/* Folder Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Loading your Drive spaces...
        </div>
      ) : folders.length === 0 ? (
        <div className="empty-dashboard-card">
          <Folder size={48} color="var(--accent-primary)" style={{ opacity: 0.8 }} />
          <h3>No permanent folders yet</h3>
          <p>Create your first permanent folder with a custom or 4-digit PIN to store files lifetime.</p>
          <button className="btn btn-primary" onClick={onOpenNewFolder} style={{ marginTop: '0.5rem' }}>
            <Plus size={16} />
            Create First Folder
          </button>
        </div>
      ) : (
        <div className="folder-grid">
          {folders.map((folder) => {
            const isCopied = copiedCode === folder.code;
            return (
              <div 
                key={folder.id} 
                className="folder-card"
                onClick={() => onOpenFolder(folder.code)}
              >
                <div className="folder-card-top">
                  <div className="folder-icon-wrapper">
                    <Folder size={24} color="var(--accent-primary)" />
                  </div>
                  
                  <div 
                    className="folder-pin-pill"
                    onClick={(e) => handleCopyCode(folder.code, e)}
                    title="Click to copy access PIN"
                  >
                    <span>PIN: #{folder.code}</span>
                    {isCopied ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                  </div>
                </div>

                <h3 className="folder-name">{folder.name}</h3>

                <div className="folder-meta-row">
                  <span>{folder.item_count || 0} items</span>
                  <span>•</span>
                  <span>{formatFileSize(folder.total_size_bytes)}</span>
                </div>

                <div className="folder-card-footer">
                  <span className="folder-open-link">
                    Open Locker <ArrowRight size={14} />
                  </span>

                  <button
                    className="btn-icon-subtle btn-delete"
                    onClick={(e) => handleDeleteFolder(folder.id, folder.name, e)}
                    title="Delete folder"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        .dashboard-container {
          max-width: 1100px;
          margin: 2rem auto;
          padding: 0 1.5rem;
          width: 100%;
        }
        .dashboard-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 2rem;
          gap: 1rem;
          flex-wrap: wrap;
        }
        .dashboard-title {
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: -0.02em;
        }
        .dashboard-subtitle {
          color: var(--text-secondary);
          font-size: 0.95rem;
          margin-top: 0.25rem;
        }
        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1rem;
          margin-bottom: 2.5rem;
        }
        .stat-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          display: flex;
          align-items: center;
          gap: 1rem;
          box-shadow: var(--shadow-card);
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .stat-num {
          font-size: 1.35rem;
          font-weight: 800;
          color: var(--text-primary);
        }
        .stat-label {
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 500;
        }
        .empty-dashboard-card {
          background: var(--bg-card);
          border: 1px dashed rgba(255, 255, 255, 0.15);
          border-radius: var(--radius-lg);
          padding: 4rem 2rem;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .empty-dashboard-card p {
          color: var(--text-secondary);
          max-width: 400px;
          font-size: 0.95rem;
        }
        .folder-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1.25rem;
        }
        .folder-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1.25rem;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          box-shadow: var(--shadow-card);
        }
        .folder-card:hover {
          border-color: var(--accent-primary);
          transform: translateY(-2px);
          box-shadow: 0 10px 25px -5px rgba(99, 102, 241, 0.25);
        }
        .folder-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .folder-icon-wrapper {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-sm);
          background: rgba(99, 102, 241, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .folder-pin-pill {
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: var(--font-mono);
          font-size: 0.78rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: var(--radius-full);
          background: rgba(255, 255, 255, 0.07);
          border: 1px solid rgba(255, 255, 255, 0.12);
          color: var(--text-primary);
        }
        .folder-pin-pill:hover {
          background: rgba(99, 102, 241, 0.2);
          border-color: var(--accent-primary);
        }
        .folder-name {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .folder-meta-row {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .folder-card-footer {
          margin-top: 0.5rem;
          padding-top: 0.75rem;
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .folder-open-link {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--accent-cyan);
        }
      `}</style>
    </div>
  );
};
