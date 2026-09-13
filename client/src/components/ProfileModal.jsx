import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  KeyRound, 
  ShieldCheck, 
  Folder, 
  HardDrive, 
  CheckCircle2, 
  AlertCircle,
  Eye, 
  EyeOff, 
  Save, 
  Check,
  LogOut
} from 'lucide-react';
import { api } from '../services/api';

export const ProfileModal = ({ isOpen, onClose, user, onUpdateUser, onNotify, onLogout }) => {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'
  
  // Profile state
  const [name, setName] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');
  
  // Extra profile stats from getMe
  const [userStats, setUserStats] = useState(null);

  // Security / Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Sync user details on open
  useEffect(() => {
    if (isOpen && user) {
      setName(user.name || '');
      setProfileSuccess('');
      setProfileError('');
      setPasswordSuccess('');
      setPasswordError('');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');

      // Fetch fresh stats from /auth/me
      api.getMe()
        .then((freshUser) => {
          if (freshUser) {
            setUserStats(freshUser);
            if (freshUser.name) setName(freshUser.name);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, user]);

  // Keyboard shortcuts: Escape to close, Ctrl+Shift+H to toggle password visibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        setShowCurrentPw((prev) => {
          const next = !prev;
          setShowNewPw(next);
          setShowConfirmPw(next);
          return next;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const formatFileSize = (bytes) => {
    const num = Number(bytes);
    if (!num || isNaN(num) || num <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(sizes.length - 1, Math.floor(Math.log(num) / Math.log(k)));
    return parseFloat((num / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    if (!name.trim()) {
      setProfileError('Name cannot be empty.');
      return;
    }
    if (name.trim().length < 2) {
      setProfileError('Name must be at least 2 characters.');
      return;
    }

    setProfileLoading(true);
    try {
      const data = await api.updateProfile(name.trim());
      setProfileSuccess('Profile name updated successfully!');
      if (onUpdateUser) {
        onUpdateUser(data.user);
      }
      if (onNotify) {
        onNotify('Profile updated successfully!', 'success');
      }
      setTimeout(() => setProfileSuccess(''), 3000);
    } catch (err) {
      setProfileError(err.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError('New password must be different from current password.');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setPasswordSuccess('Password changed successfully! Your account is secure.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onNotify) {
        onNotify('Password changed successfully!', 'success');
      }
      setTimeout(() => setPasswordSuccess(''), 3500);
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  const userInitial = (user.name || user.email || 'U').charAt(0).toUpperCase();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-card profile-modal-card" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={22} color="var(--accent-primary)" />
            <span>Account Settings</span>
          </div>
          <button className="modal-close" onClick={onClose} title="Close (Esc)">
            <X size={18} />
          </button>
        </div>

        {/* User Identity Card */}
        <div className="profile-identity-card">
          <div className="profile-avatar-wrapper">
            <div className="profile-avatar">
              {userInitial}
            </div>
            <div className="profile-online-dot" title="Active Account" />
          </div>

          <div className="profile-identity-info">
            <h3 className="profile-identity-name">{user.name}</h3>
            <p className="profile-identity-email">{user.email}</p>
          </div>
        </div>

        {/* Quick Stats Badges */}
        <div className="profile-stats-grid">
          <div className="profile-stat-box">
            <div className="profile-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: 'var(--accent-primary)' }}>
              <Folder size={16} />
            </div>
            <div>
              <div className="profile-stat-val">{userStats?.folder_count ?? '—'}</div>
              <div className="profile-stat-lbl">Permanent Folders</div>
            </div>
          </div>

          <div className="profile-stat-box">
            <div className="profile-stat-icon" style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)' }}>
              <HardDrive size={16} />
            </div>
            <div>
              <div className="profile-stat-val">{formatFileSize(userStats?.total_storage || 0)}</div>
              <div className="profile-stat-lbl">Cloud Storage Used</div>
            </div>
          </div>
        </div>

        {/* Nav Tabs */}
        <div className="profile-tabs">
          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={15} />
            <span>Profile Details</span>
          </button>

          <button
            type="button"
            className={`profile-tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <KeyRound size={15} />
            <span>Password & Security</span>
          </button>
        </div>

        <div className="modal-body" style={{ padding: '1.25rem 1.5rem' }}>
          {/* TAB 1: PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile}>
              {profileError && (
                <div className="alert-box alert-error">
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{profileError}</span>
                </div>
              )}

              {profileSuccess && (
                <div className="alert-box alert-success">
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <span>{profileSuccess}</span>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ paddingLeft: '2.5rem' }}
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <User 
                    size={16} 
                    style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'var(--text-muted)' 
                    }} 
                  />
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  This name is displayed on your personal cloud folders and navbar.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="form-input"
                    style={{ 
                      paddingLeft: '2.5rem', 
                      paddingRight: '6rem', 
                      opacity: 0.75, 
                      cursor: 'not-allowed',
                      background: 'var(--bg-elevated)'
                    }}
                    value={user.email}
                    disabled
                  />
                  <Mail 
                    size={16} 
                    style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'var(--text-muted)' 
                    }} 
                  />
                  <span style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    color: 'var(--accent-emerald)',
                    background: 'rgba(16, 185, 129, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    border: '1px solid rgba(16, 185, 129, 0.25)'
                  }}>
                    Verified
                  </span>
                </div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Email address is permanently bound to your account and cannot be changed.
                </span>
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={profileLoading || name === user.name}
                  style={{ minWidth: '130px' }}
                >
                  {profileLoading ? 'Saving...' : (
                    <>
                      <Save size={15} />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: PASSWORD & SECURITY */}
          {activeTab === 'security' && (
            <form onSubmit={handleChangePassword}>
              {passwordError && (
                <div className="alert-box alert-error">
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="alert-box alert-success">
                  <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {/* Current Password */}
              <div className="form-group">
                <label className="form-label">Current Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <Lock 
                    size={16} 
                    style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'var(--text-muted)' 
                    }} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="password-toggle-btn"
                    title={showCurrentPw ? 'Hide password (Ctrl+Shift+H)' : 'Show password (Ctrl+Shift+H)'}
                    tabIndex={-1}
                  >
                    {showCurrentPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <KeyRound 
                    size={16} 
                    style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'var(--text-muted)' 
                    }} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="password-toggle-btn"
                    title={showNewPw ? 'Hide password (Ctrl+Shift+H)' : 'Show password (Ctrl+Shift+H)'}
                    tabIndex={-1}
                  >
                    {showNewPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    className="form-input"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <ShieldCheck 
                    size={16} 
                    style={{ 
                      position: 'absolute', 
                      left: '12px', 
                      top: '50%', 
                      transform: 'translateY(-50%)', 
                      color: 'var(--text-muted)' 
                    }} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="password-toggle-btn"
                    title={showConfirmPw ? 'Hide password (Ctrl+Shift+H)' : 'Show password (Ctrl+Shift+H)'}
                    tabIndex={-1}
                  >
                    {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {newPassword && confirmPassword && (
                  <div style={{ 
                    marginTop: '6px', 
                    fontSize: '0.78rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: newPassword === confirmPassword ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                  }}>
                    {newPassword === confirmPassword ? (
                      <>
                        <Check size={13} />
                        <span>Passwords match</span>
                      </>
                    ) : (
                      <>
                        <X size={13} />
                        <span>Passwords do not match</span>
                      </>
                    )}
                  </div>
                )}
              </div>

              <div style={{ marginTop: '1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword}
                  style={{ minWidth: '150px' }}
                >
                  {passwordLoading ? 'Updating...' : (
                    <>
                      <Lock size={15} />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between', display: 'flex', alignItems: 'center' }}>
          {onLogout ? (
            <button 
              type="button" 
              className="btn btn-danger btn-sm"
              onClick={() => {
                onClose();
                onLogout();
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          ) : <div />}
          <button type="button" className="btn btn-secondary btn-sm" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
