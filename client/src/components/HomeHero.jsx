import React, { useState } from 'react';
import { PinInput } from './PinInput';
import { 
  Zap, 
  ArrowRight, 
  Lock, 
  FolderPlus
} from 'lucide-react';
import { api } from '../services/api';

export const HomeHero = ({ onOpenLocker, onOpenAuth, user, onOpenNewFolder, onNotify }) => {
  const [loadingPin, setLoadingPin] = useState(false);
  const [creatingQuickDrop, setCreatingQuickDrop] = useState(false);

  // Handle PIN input completion
  const handlePinSubmit = async (code) => {
    try {
      setLoadingPin(true);
      // Validate code by fetching folder
      const data = await api.getFolderByCode(code);
      onOpenLocker(data.folder.code);
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      setLoadingPin(false);
    }
  };

  // Handle Quick 24h Drop (Guest Mode - Mobile/Incognito Friendly)
  const handleQuickDrop = async () => {
    try {
      setCreatingQuickDrop(true);
      const data = await api.createQuickDrop();
      onNotify(`Instant 24h Drop created! PIN: #${data.folder.code}`, 'success');
      onOpenLocker(data.folder.code);
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      setCreatingQuickDrop(false);
    }
  };

  return (
    <div className="home-hero-wrapper">
      {/* Glow Backdrops */}
      <div className="hero-glow-blob blob-1"></div>
      <div className="hero-glow-blob blob-2"></div>

      <div className="hero-content">
        <h1 className="hero-heading">
          Send text & files to any PC <br />
          <span className="gradient-text">with just a 4-digit code.</span>
        </h1>

        <p className="hero-subtext">
          Open on your phone, paste huge links, long notes, or upload any file (.pdf, .zip, .apk, .exe). 
          Enter the code on your library PC to download, then close the incognito window — nothing is saved.
        </p>

        {/* PIN ACCESS CARD */}
        <div className="pin-card-box">
          <div className="pin-card-label">ENTER LOCKER PIN CODE</div>
          <PinInput onComplete={handlePinSubmit} loading={loadingPin} />
        </div>

        {/* DUAL ACTION CARDS: GUEST VS PERMANENT */}
        <div className="action-cards-row">
          {/* Action 1: Quick 24h Drop */}
          <div className="dual-card guest-card" onClick={handleQuickDrop}>
            <div className="dual-card-icon guest-icon">
              <Zap size={24} />
            </div>
            <div className="dual-card-body">
              <div className="dual-card-badge">Instant • Zero Login</div>
              <h3>Create 24h Quick Drop</h3>
              <p>Generates a 4-digit PIN immediately. Ideal for temporary mobile transfers. Auto-destructs in 24 hours.</p>
            </div>
            <button className="btn btn-accent btn-sm" disabled={creatingQuickDrop}>
              {creatingQuickDrop ? 'Creating...' : 'Start Drop'} <ArrowRight size={14} />
            </button>
          </div>

          {/* Action 2: Permanent Drive */}
          <div 
            className="dual-card permanent-card" 
            onClick={user ? onOpenNewFolder : onOpenAuth}
          >
            <div className="dual-card-icon permanent-icon">
              {user ? <FolderPlus size={24} /> : <Lock size={24} />}
            </div>
            <div className="dual-card-body">
              <div className="dual-card-badge permanent-badge">Lifetime • Permanent</div>
              <h3>{user ? 'New Permanent Folder' : 'Create Drive Account'}</h3>
              <p>Keep your files forever. Create unlimited folders with custom PINs and manage them from your Drive dashboard.</p>
            </div>
            <button className="btn btn-primary btn-sm">
              {user ? 'New Folder' : 'Sign In / Register'} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .home-hero-wrapper {
          position: relative;
          width: 100%;
          min-height: calc(100vh - 72px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 3rem 1.5rem 5rem;
          overflow: hidden;
        }
        .hero-glow-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          z-index: 0;
        }
        .blob-1 {
          width: 450px;
          height: 450px;
          background: rgba(99, 102, 241, 0.15);
          top: -100px;
          left: 50%;
          transform: translateX(-50%);
        }
        .blob-2 {
          width: 350px;
          height: 350px;
          background: rgba(6, 182, 212, 0.1);
          bottom: 0;
          right: 10%;
        }
        .hero-content {
          position: relative;
          z-index: 1;
          max-width: 860px;
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .hero-pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          padding: 6px 16px;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 600;
          color: var(--text-primary);
          margin-bottom: 1.5rem;
          box-shadow: var(--shadow-sm);
        }
        .hero-heading {
          font-size: 3.25rem;
          font-weight: 800;
          line-height: 1.15;
          letter-spacing: -0.03em;
          margin-bottom: 1.25rem;
          color: var(--text-primary);
        }
        .gradient-text {
          background: var(--hero-heading-gradient);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-subtext {
          font-size: 1.15rem;
          color: var(--text-secondary);
          line-height: 1.6;
          max-width: 680px;
          margin-bottom: 2.5rem;
        }
        .pin-card-box {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 20px;
          padding: 2.25rem 2.5rem;
          width: 100%;
          max-width: 520px;
          box-shadow: var(--shadow-lg);
          backdrop-filter: blur(16px);
          margin-bottom: 2.5rem;
        }
        .pin-card-label {
          font-size: 0.8rem;
          font-weight: 800;
          letter-spacing: 0.1em;
          color: var(--text-muted);
          margin-bottom: 1.25rem;
        }
        .action-cards-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.25rem;
          width: 100%;
          max-width: 800px;
          margin-bottom: 0;
        }
        .dual-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1.5rem;
          text-align: left;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          box-shadow: var(--shadow-card);
        }
        .dual-card:hover {
          transform: translateY(-3px);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 12px 30px -8px rgba(0, 0, 0, 0.6);
        }
        .guest-card:hover {
          border-color: var(--accent-cyan);
          box-shadow: 0 10px 30px -10px rgba(6, 182, 212, 0.3);
        }
        .permanent-card:hover {
          border-color: var(--accent-primary);
          box-shadow: 0 10px 30px -10px rgba(99, 102, 241, 0.3);
        }
        .dual-card-icon {
          width: 44px;
          height: 44px;
          border-radius: var(--radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .guest-icon { background: rgba(6, 182, 212, 0.15); color: var(--accent-cyan); }
        .permanent-icon { background: rgba(99, 102, 241, 0.15); color: var(--accent-primary); }
        .dual-card-badge {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--accent-cyan);
          margin-bottom: 4px;
        }
        .permanent-badge {
          color: #a5b4fc;
        }
        .dual-card h3 {
          font-size: 1.2rem;
          font-weight: 700;
          color: var(--text-primary);
        }
        .dual-card p {
          font-size: 0.85rem;
          color: var(--text-secondary);
          line-height: 1.5;
        }
        .dual-card button {
          margin-top: auto;
          width: fit-content;
        }
        @media (max-width: 768px) {
          .hero-heading {
            font-size: 2.25rem;
          }
          .action-cards-row {
            grid-template-columns: 1fr;
          }
          .pin-card-box {
            padding: 1.75rem 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};
