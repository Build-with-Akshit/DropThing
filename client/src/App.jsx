import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeHero } from './components/HomeHero';
import { LockerView } from './components/LockerView';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { CreateFolderModal } from './components/CreateFolderModal';
import { Toast } from './components/Toast';
import { api } from './services/api';

export function App() {
  const [user, setUser] = useState(null);
  const [activeCode, setActiveCode] = useState(null);
  const [view, setView] = useState('home'); // 'home', 'locker', 'dashboard'
  const [toasts, setToasts] = useState([]);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);

  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('droppin_theme') || 'light';
  });

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('droppin_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  // Initialize User & URL Query Params (?code=XXXX)
  useEffect(() => {
    const storedUser = api.getCurrentUser();
    if (storedUser) setUser(storedUser);

    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) {
      setActiveCode(urlCode.toUpperCase());
      setView('locker');
    }
  }, []);

  // Toast Notification System
  const notify = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Open a Locker by Code
  const handleOpenLocker = (code) => {
    setActiveCode(code.toUpperCase());
    setView('locker');
    // Update URL query string without reloading page
    const newUrl = `${window.location.pathname}?code=${code.toUpperCase()}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  // Return to Home / Leave Locker
  const handleGoHome = () => {
    setActiveCode(null);
    setView('home');
    window.history.pushState({}, '', window.location.pathname);
  };

  // Open Dashboard (My Drive)
  const handleOpenDashboard = () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    setActiveCode(null);
    setView('dashboard');
    window.history.pushState({}, '', window.location.pathname);
  };

  // Handle Logout
  const handleLogout = () => {
    api.logout();
    setUser(null);
    setView('home');
    notify('Logged out successfully.', 'info');
  };

  return (
    <div className="app-container">
      {/* Navbar */}
      <Navbar
        user={user}
        currentFolder={view === 'locker' ? activeCode : null}
        onGoHome={handleGoHome}
        onOpenAuth={() => setIsAuthOpen(true)}
        onOpenDashboard={handleOpenDashboard}
        onLogout={handleLogout}
        onOpenNewFolder={() => setIsNewFolderOpen(true)}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main View Switching */}
      <main style={{ flex: 1 }}>
        {view === 'home' && (
          <HomeHero
            onOpenLocker={handleOpenLocker}
            onOpenAuth={() => setIsAuthOpen(true)}
            user={user}
            onOpenNewFolder={() => setIsNewFolderOpen(true)}
            onNotify={notify}
          />
        )}

        {view === 'locker' && activeCode && (
          <LockerView
            code={activeCode}
            onNotify={notify}
            onGoHome={handleGoHome}
          />
        )}

        {view === 'dashboard' && user && (
          <Dashboard
            user={user}
            onOpenFolder={handleOpenLocker}
            onOpenNewFolder={() => setIsNewFolderOpen(true)}
            onNotify={notify}
          />
        )}
      </main>

      {/* Footer */}
      <footer style={{
        padding: '1.5rem',
        borderTop: '1px solid var(--border-subtle)',
        textAlign: 'center',
        fontSize: '0.85rem',
        color: 'var(--text-muted)',
        background: 'rgba(10, 13, 20, 0.9)'
      }}>
        <p>DropThing &copy; 2026 — Secure, Zero-Login Instant Cloud File & Text Bridge</p>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(loggedUser) => {
          setUser(loggedUser);
          setView('dashboard');
        }}
        onNotify={notify}
      />

      <CreateFolderModal
        isOpen={isNewFolderOpen}
        onClose={() => setIsNewFolderOpen(false)}
        onSuccess={(folder) => {
          handleOpenLocker(folder.code);
        }}
        onNotify={notify}
      />

      {/* Floating Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
