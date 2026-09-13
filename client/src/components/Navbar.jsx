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
      <div className="brand" onClick={onGoHome} title="Go to Home">
        <div className="brand-icon" title="Home">
          <Home size={19} strokeWidth={2.2} />
        </div>
        <div>
          <span className="brand-name brand-name-desktop">DropThing</span>
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
              className="user-profile-btn"
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
