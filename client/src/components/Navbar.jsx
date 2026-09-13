import React from 'react';
import { Home, HardDrive, User, LogOut, Plus, Sun, Moon, Settings } from 'lucide-react';

export const Navbar = ({ 
  user, 
  currentFolder, 
  currentView,
  onGoHome, 
  onOpenAuth, 
  onOpenDashboard, 
  onLogout,
  onOpenNewFolder,
  theme,
  onToggleTheme,
  onOpenProfile
}) => {
  return (
    <header className="navbar">
      <div 
        className="brand" 
        onClick={onGoHome} 
        title={currentView === 'home' ? 'DropThing' : 'Go to Home'}
      >
        <div className="brand-icon" title={currentView === 'home' ? 'DropThing' : 'Go to Home'}>
          {currentView === 'home' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
          ) : (
            <Home size={19} strokeWidth={2.2} />
          )}
        </div>
        <div>
          <span className={`brand-name ${currentView !== 'home' ? 'brand-name-subview' : ''}`}>
            DropThing
          </span>
        </div>
        <span className="brand-badge brand-badge-desktop">Cloud Bridge</span>
      </div>

      <div className="nav-actions">
        {/* Theme Toggle (Light / Dark) */}
        <button
          className="theme-toggle-btn"
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
        >
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} color="#f59e0b" />}
        </button>

        {user ? (
          <div className="user-nav-group">
            {currentView !== 'dashboard' && (
              <button
                className="btn btn-secondary btn-sm nav-action-btn"
                onClick={onOpenDashboard}
                title="My Drive Spaces"
              >
                <HardDrive size={14} color="var(--accent-cyan)" />
                <span className="nav-btn-text">My Drive</span>
                <span className="nav-btn-text-mobile">Drive</span>
              </button>
            )}

            <button
              className="btn btn-primary btn-sm nav-action-btn desktop-only"
              onClick={onOpenNewFolder}
              title="Create New Folder"
            >
              <Plus size={14} />
              <span className="nav-btn-text">New Folder</span>
            </button>

            <button
              className={`user-profile-btn ${currentView === 'dashboard' ? 'user-profile-btn-dashboard' : ''}`}
              onClick={onOpenProfile}
              title="Account Settings & Profile"
            >
              <div className="user-profile-avatar-mini">
                <User size={13} color="var(--accent-primary)" />
              </div>
              <span className="user-profile-name">{user.name}</span>
              <Settings size={13} className="user-profile-gear" />
            </button>

            <button
              className="btn btn-secondary btn-sm nav-logout-btn desktop-only"
              onClick={onLogout}
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          </div>
        ) : (
          <button className="btn btn-secondary btn-sm nav-action-btn" onClick={onOpenAuth} title="Sign In to Cloud Drive">
            <HardDrive size={14} color="var(--accent-cyan)" />
            <span className="nav-btn-text">Sign In / Drive</span>
            <span className="nav-btn-text-mobile">Drive</span>
          </button>
        )}
      </div>
    </header>
  );
};
