import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  Plus, 
  Copy, 
  Check, 
  ArrowRight, 
  Trash2, 
  HardDrive, 
  ShieldCheck, 
  Settings, 
  Clock, 
  Zap 
} from 'lucide-react';
import { api } from '../services/api';

export const Dashboard = ({ user, onOpenFolder, onOpenNewFolder, onOpenProfile, onNotify }) => {
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [filterTab, setFilterTab] = useState('all'); // 'all' | 'permanent' | 'temporary'
  const [creatingQuickDrop, setCreatingQuickDrop] = useState(false);

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

  // Tick countdown timer for temporary folders
  useEffect(() => {
    const timer = setInterval(() => {
      setFolders((prev) =>
        prev.map((f) => {
          if (f.is_temporary && f.time_left_seconds > 0) {
            return { ...f, time_left_seconds: f.time_left_seconds - 1 };
          }
          return f;
        })
      );
    }, 1000);

    return () => clearInterval(timer);
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
      setFolders(folders.filter((f) => f.id !== folderId));
    } catch (err) {
      onNotify(err.message, 'error');
    }
  };

  const handleCreateQuickDrop = async () => {
    try {
      setCreatingQuickDrop(true);
      const data = await api.createQuickDrop();
      onNotify(`Instant 24h Drop #${data.folder.code} created!`, 'success');
      onOpenFolder(data.folder.code);
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      setCreatingQuickDrop(false);
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

  const formatCountdown = (totalSec) => {
    if (!totalSec || totalSec <= 0) return 'Expiring soon';
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    if (hours > 0) return `${hours}h ${minutes}m left`;
    return `${minutes}m ${seconds}s left`;
  };

  const permanentFolders = folders.filter((f) => !f.is_temporary);
  const temporaryFolders = folders.filter((f) => Boolean(f.is_temporary));

  const displayedFolders = folders.filter((f) => {
    if (filterTab === 'permanent') return !f.is_temporary;
    if (filterTab === 'temporary') return Boolean(f.is_temporary);
    return true;
  });

  const totalStorage = folders.reduce((acc, f) => acc + Number(f.total_size_bytes || 0), 0);
  const totalItems = folders.reduce((acc, f) => acc + Number(f.item_count || 0), 0);

  return (
    <div className="dashboard-container">
      {/* Header Profile Bar */}
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            {user?.name ? `${user.name}'s Cloud Drive` : 'My Cloud Drive'}
          </h1>
          <p className="dashboard-subtitle">
            Permanent cloud storage spaces & 24h quick drops. Access any of these on public/library PCs using their short PIN.
          </p>
        </div>

        <div className="dashboard-header-actions">
          <button className="btn btn-secondary" onClick={onOpenProfile} title="Account Settings & Security">
            <Settings size={15} />
            <span>Account Settings</span>
          </button>

          <button 
            className="btn btn-secondary" 
            onClick={handleCreateQuickDrop} 
            disabled={creatingQuickDrop}
            title="Create 24-hour instant drop"
            style={{ border: '1px solid rgba(245, 158, 11, 0.4)', color: 'var(--text-primary)' }}
          >
            <Clock size={15} color="var(--accent-amber)" />
            <span>{creatingQuickDrop ? 'Creating...' : 'New 24h Drop'}</span>
          </button>

          <button className="btn btn-primary" onClick={onOpenNewFolder}>
            <Plus size={16} />
            <span>New Permanent Folder</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(99, 102, 241, 0.15)', color: 'var(--accent-primary)' }}>
            <Folder size={22} />
          </div>
          <div>
            <div className="stat-num">{permanentFolders.length}</div>
            <div className="stat-label">Permanent Folders</div>
            {temporaryFolders.length > 0 && (
              <div style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 600, marginTop: '2px' }}>
                + {temporaryFolders.length} active 24h {temporaryFolders.length === 1 ? 'drop' : 'drops'}
              </div>
            )}
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
            <div className="stat-label">Storage Used</div>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="dashboard-tabs-bar">
        <button
          className={`dash-tab-btn ${filterTab === 'all' ? 'active' : ''}`}
          onClick={() => setFilterTab('all')}
        >
          <span className="dash-tab-label-desktop">All Spaces</span>
          <span className="dash-tab-label-mobile">All</span>
          <span className="dash-tab-count">{folders.length}</span>
        </button>

        <button
          className={`dash-tab-btn ${filterTab === 'permanent' ? 'active' : ''}`}
          onClick={() => setFilterTab('permanent')}
        >
          <Folder size={14} />
          <span>Permanent</span>
          <span className="dash-tab-count">{permanentFolders.length}</span>
        </button>

        <button
          className={`dash-tab-btn ${filterTab === 'temporary' ? 'active' : ''}`}
          onClick={() => setFilterTab('temporary')}
        >
          <Clock size={14} />
          <span className="dash-tab-label-desktop">24h Quick Drops</span>
          <span className="dash-tab-label-mobile">24h Drops</span>
          <span className="dash-tab-count">{temporaryFolders.length}</span>
        </button>
      </div>

      {/* Folder Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
          Loading your Drive spaces...
        </div>
      ) : displayedFolders.length === 0 ? (
        <div className="empty-dashboard-card">
          {filterTab === 'temporary' ? (
            <>
              <Clock size={48} color="var(--accent-amber)" style={{ opacity: 0.8 }} />
              <h3>No active 24h drops</h3>
              <p>You haven't created any temporary quick drops recently. Create one to transfer files instantly.</p>
              <button className="btn btn-secondary" onClick={handleCreateQuickDrop} style={{ marginTop: '0.5rem' }}>
                <Clock size={16} color="var(--accent-amber)" />
                Create 24h Drop
              </button>
            </>
          ) : (
            <>
              <Folder size={48} color="var(--accent-primary)" style={{ opacity: 0.8 }} />
              <h3>No folders found</h3>
              <p>Create your first permanent folder with a custom or 4-digit PIN to store files lifetime.</p>
              <button className="btn btn-primary" onClick={onOpenNewFolder} style={{ marginTop: '0.5rem' }}>
                <Plus size={16} />
                Create Permanent Folder
              </button>
            </>
          )}
        </div>
      ) : (
        <div className="folder-grid">
          {displayedFolders.map((folder) => {
            const isCopied = copiedCode === folder.code;
            const isTemp = Boolean(folder.is_temporary);

            return (
              <div 
                key={folder.id} 
                className={`folder-card ${isTemp ? 'card-temporary' : ''}`}
                onClick={() => onOpenFolder(folder.code)}
              >
                <div className="folder-card-top">
                  <div className={`folder-icon-wrapper ${isTemp ? 'temp-icon' : ''}`}>
                    {isTemp ? (
                      <Clock size={22} color="var(--accent-amber)" />
                    ) : (
                      <Folder size={24} color="var(--accent-primary)" />
                    )}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {isTemp && (
                      <span className="dash-temp-pill" title="Auto-destructs in 24 hours">
                        <Zap size={11} />
                        <span>{formatCountdown(folder.time_left_seconds)}</span>
                      </span>
                    )}

                    <div 
                      className="folder-pin-pill"
                      onClick={(e) => handleCopyCode(folder.code, e)}
                      title="Click to copy access PIN"
                    >
                      <span>PIN: #{folder.code}</span>
                      {isCopied ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="folder-name">{folder.name}</h3>
                  {isTemp && (
                    <span style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', fontWeight: 600 }}>
                      ⚡ 24h Temporary Space
                    </span>
                  )}
                </div>

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
          margin-bottom: 2rem;
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

        /* Tabs Bar */
        .dashboard-tabs-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 1.5rem;
          border-bottom: 1px solid var(--border-subtle);
          padding-bottom: 0.75rem;
          flex-wrap: wrap;
        }
        .dash-tab-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 9999px;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card);
          color: var(--text-secondary);
          font-size: 0.85rem;
          font-weight: 600;
          font-family: inherit;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .dash-tab-btn:hover {
          color: var(--text-primary);
          border-color: var(--border-hover);
          background: var(--bg-card-hover);
        }
        .dash-tab-btn.active {
          background: var(--accent-primary);
          color: #ffffff;
          border-color: var(--accent-primary);
        }
        .dash-tab-count {
          font-size: 0.72rem;
          padding: 1px 6px;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.2);
        }
        [data-theme="light"] .dash-tab-btn:not(.active) .dash-tab-count {
          background: rgba(0, 0, 0, 0.07);
        }
        .dash-tab-label-mobile {
          display: none;
        }
        .dash-tab-label-desktop {
          display: inline;
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
        .folder-card.card-temporary:hover {
          border-color: var(--accent-amber);
          box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.25);
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
        .folder-icon-wrapper.temp-icon {
          background: rgba(245, 158, 11, 0.15);
        }
        .dash-temp-pill {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 0.72rem;
          font-weight: 700;
          color: var(--accent-amber);
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          padding: 3px 8px;
          border-radius: 9999px;
          letter-spacing: 0.01em;
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
        .dashboard-header-actions {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .folder-open-link {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--accent-cyan);
        }
        @media (max-width: 640px) {
          .dashboard-container {
            margin: 1rem auto 2rem;
            padding: 0 0.85rem;
          }
          .dashboard-header {
            flex-direction: column;
            align-items: stretch;
            gap: 1rem;
            margin-bottom: 1.25rem;
          }
          .dashboard-title {
            font-size: 1.45rem;
          }
          .dashboard-subtitle {
            font-size: 0.85rem;
            line-height: 1.45;
          }
          .dashboard-header-actions {
            width: 100%;
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
          }
          .dashboard-header-actions .btn {
            width: 100%;
            justify-content: center;
          }
          /* 3 Compact Stat Tiles */
          .stats-row {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.45rem;
            margin-bottom: 1.25rem;
          }
          .stat-card {
            padding: 0.75rem 0.35rem;
            flex-direction: column;
            text-align: center;
            gap: 0.35rem;
            border-radius: 12px;
          }
          .stat-icon {
            width: 34px;
            height: 34px;
            border-radius: 8px;
          }
          .stat-num {
            font-size: 1.05rem;
          }
          .stat-label {
            font-size: 0.68rem;
            line-height: 1.2;
          }
          /* Horizontal Scrollable Tabs */
          .dashboard-tabs-bar {
            overflow-x: auto;
            flex-wrap: nowrap;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            gap: 0.35rem;
            padding-bottom: 0.4rem;
            margin-bottom: 1rem;
          }
          .dashboard-tabs-bar::-webkit-scrollbar {
            display: none;
          }
          .dash-tab-label-mobile {
            display: inline;
          }
          .dash-tab-label-desktop {
            display: none;
          }
          .dash-tab-btn {
            white-space: nowrap;
            font-size: 0.78rem;
            padding: 5px 10px;
            flex-shrink: 0;
          }
          .folder-grid {
            grid-template-columns: 1fr;
            gap: 0.85rem;
          }
          .folder-card {
            padding: 1rem;
            border-radius: 14px;
          }
          .empty-dashboard-card {
            padding: 2.5rem 1rem;
          }
        }
      `}</style>
    </div>
  );
};
