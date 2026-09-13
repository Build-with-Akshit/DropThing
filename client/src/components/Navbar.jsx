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
        <div className="brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>
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
