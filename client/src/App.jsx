import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HomeHero } from './components/HomeHero';
import { LockerView } from './components/LockerView';
import { Dashboard } from './components/Dashboard';
import { AuthModal } from './components/AuthModal';
import { CreateFolderModal } from './components/CreateFolderModal';
import { ProfileModal } from './components/ProfileModal';
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
  const [isProfileOpen, setIsProfileOpen] = useState(false);

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

  // Initialize User, URL Query Params, & Browser Back/Forward navigation (Alt + Left)
  useEffect(() => {
    const storedUser = api.getCurrentUser();
    if (storedUser) setUser(storedUser);

    const params = new URLSearchParams(window.location.search);
    const urlCode = params.get('code');
    if (urlCode) {
      setActiveCode(urlCode.toUpperCase());
      setView('locker');
      window.history.replaceState({ view: 'locker', code: urlCode.toUpperCase() }, '', window.location.href);
    } else if (window.location.hash === '#drive' && storedUser) {
      setView('dashboard');
      window.history.replaceState({ view: 'dashboard' }, '', window.location.href);
    } else {
      window.history.replaceState({ view: 'home' }, '', window.location.href);
    }

    // Handle Browser Back / Forward buttons & Alt + Left / Alt + Right
    const handlePopState = (e) => {
      const currentParams = new URLSearchParams(window.location.search);
      const currentCode = currentParams.get('code');
      if (currentCode) {
        setActiveCode(currentCode.toUpperCase());
        setView('locker');
      } else if (e.state?.view === 'dashboard' || window.location.hash === '#drive') {
        setActiveCode(null);
        setView('dashboard');
      } else {
        setActiveCode(null);
        setView('home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
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

  // Open a Locker by Code (prevents pushing duplicate history if already open)
  const handleOpenLocker = (code) => {
    const formattedCode = code.toUpperCase();
    if (view === 'locker' && activeCode === formattedCode) {
      return;
    }
    setActiveCode(formattedCode);
    setView('locker');
    const newUrl = `${window.location.pathname}?code=${formattedCode}`;
    const currentUrl = `${window.location.pathname}${window.location.search}`;
    if (currentUrl !== newUrl) {
      window.history.pushState({ view: 'locker', code: formattedCode }, '', newUrl);
    }
  };

  // Return to Home / Leave Locker (no-op if already on Home, preventing duplicate history entries)
  const handleGoHome = () => {
    const isAlreadyHome = view === 'home' && !window.location.search && !window.location.hash;
    if (isAlreadyHome) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setActiveCode(null);
    setView('home');
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentUrl !== window.location.pathname) {
      window.history.pushState({ view: 'home' }, '', window.location.pathname);
    }
  };

  // Open Dashboard (My Drive) (prevents duplicate history entries if already on Dashboard)
  const handleOpenDashboard = () => {
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    if (view === 'dashboard' && window.location.hash === '#drive') {
      return;
    }
    setActiveCode(null);
    setView('dashboard');
    const targetUrl = `${window.location.pathname}#drive`;
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (currentUrl !== targetUrl) {
      window.history.pushState({ view: 'dashboard' }, '', targetUrl);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    api.logout();
    setUser(null);
    handleGoHome();
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
        onOpenProfile={() => setIsProfileOpen(true)}
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
            onOpenProfile={() => setIsProfileOpen(true)}
            onNotify={notify}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
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

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        user={user}
        onUpdateUser={(updatedUser) => {
          setUser((prev) => ({ ...prev, ...updatedUser }));
        }}
        onNotify={notify}
      />

      {/* Floating Notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
