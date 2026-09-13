import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import QRCode from 'qrcode';
import { X, Copy } from 'lucide-react';

export const QrModal = ({ code, isOpen, onClose, onCopyLink }) => {
  const canvasRef = useRef(null);
  const shareUrl = `${window.location.origin}/?code=${code}`;

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, shareUrl, {
        width: 240,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      }, (err) => {
        if (err) console.error('QR code generation error:', err);
      });
    }
  }, [isOpen, code, shareUrl]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px', textAlign: 'center' }}>
        <div className="modal-header">
          <div className="modal-title">📱 Scan to Open</div>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ alignItems: 'center', gap: '1rem' }}>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Scan with your phone's camera to instantly open this locker without typing.
          </p>

          <div style={{
            background: '#ffffff',
            padding: '12px',
            borderRadius: '16px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            display: 'inline-block'
          }}>
            <canvas ref={canvasRef} style={{ display: 'block' }}></canvas>
          </div>

          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '1.4rem',
            fontWeight: 800,
            letterSpacing: '0.1em',
            color: 'var(--accent-primary)',
            background: 'rgba(99, 102, 241, 0.1)',
            padding: '6px 18px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid rgba(99, 102, 241, 0.3)'
          }}>
            PIN: {code}
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={() => onCopyLink(shareUrl)}>
            <Copy size={16} />
            Copy Direct Link
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
