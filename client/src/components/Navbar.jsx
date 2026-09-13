import React from 'react';
import { HardDrive, User, LogOut, ArrowLeft, Plus, LogIn, Sun, Moon } from 'lucide-react';

export const Navbar = ({ 
  user, 
  currentFolder, 
  onGoHome, 
  onOpenAuth, 
  onOpenDashboard, 
  onLogout,
  onOpenNewFolder,
  theme,
  onToggleTheme
}) => {
  return (
    <header className="navbar">
      <div className="brand" onClick={onGoHome}>
        <div className="brand-icon">⚡</div>
        <div>
          <span className="brand-name">DropThing</span>
        </div>
        <span className="brand-badge">Cloud Bridge</span>
      </div>

      <div className="nav-actions">
        {/* Theme Toggle (Light / Dark) */}
        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={18} /> : <Sun size={18} color="#f59e0b" />}
        </button>

        {currentFolder && (
          <button 
            className="btn btn-secondary btn-sm"
            onClick={onGoHome}
            title="Leave Locker / Back to Home"
          >
            <ArrowLeft size={14} />
            <span>Leave Locker</span>
          </button>
        )}

        {user ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <button
              className="btn btn-secondary btn-sm"
              onClick={onOpenDashboard}
            >
              <HardDrive size={15} color="var(--accent-cyan)" />
              <span>My Drive</span>
            </button>

            <button
              className="btn btn-primary btn-sm"
              onClick={onOpenNewFolder}
            >
              <Plus size={15} />
              <span>New Folder</span>
            </button>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '4px 10px',
              borderRadius: '9999px',
              background: 'var(--bg-card-hover)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.85rem'
            }}>
              <User size={14} color="var(--accent-primary)" />
              <span style={{ fontWeight: 600 }}>{user.name}</span>
            </div>

            <button
              className="btn btn-secondary btn-sm"
              onClick={onLogout}
              title="Logout"
              style={{ padding: '6px' }}
            >
              <LogOut size={15} />
            </button>
          </div>
        ) : (
          <button className="btn btn-secondary btn-sm" onClick={onOpenAuth}>
            <LogIn size={15} color="var(--accent-primary)" />
            <span>Sign In / Drive</span>
          </button>
        )}
      </div>
    </header>
  );
};
