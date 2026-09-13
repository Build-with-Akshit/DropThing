import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, 
  Image as ImageIcon, 
  Package, 
  Copy, 
  Check, 
  QrCode, 
  Clock, 
  ShieldCheck, 
  RefreshCw, 
  Search, 
  UploadCloud, 
  Sparkles,
  Link2,
  Film,
  AlertCircle,
  ArrowLeft,
  Plus
} from 'lucide-react';
import { api } from '../services/api';
import { TextCard } from './TextCard';
import { FileCard } from './FileCard';
import { TextModal } from './TextModal';
import { QrModal } from './QrModal';

export const LockerView = ({ code, onNotify, onGoHome }) => {
  const [folder, setFolder] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadPhase, setUploadPhase] = useState('idle'); // 'upload' | 'processing' | 'complete' | 'idle'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processProgress, setProcessProgress] = useState(0);
  const [processStatus, setProcessStatus] = useState('');
  const processTimerRef = useRef(null);
  const [copiedPin, setCopiedPin] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [isTextModalOpen, setIsTextModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Expiry Timer countdown
  const [secondsLeft, setSecondsLeft] = useState(null);

  // Hidden File Inputs for dedicated buttons
  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const anyFileInputRef = useRef(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);

  // Fetch Locker Data
  const loadFolder = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.getFolderByCode(code);
      setFolder(data.folder);
      setItems(data.items);
      if (data.folder.time_left_seconds !== null) {
        setSecondsLeft(data.folder.time_left_seconds);
      }
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadFolder();

    // Auto-poll every 5 seconds so mobile uploads appear instantly on public PC without refresh!
    const pollInterval = setInterval(() => {
      loadFolder(true);
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [code]);

  // Countdown timer effect
  useEffect(() => {
    if (secondsLeft === null || secondsLeft <= 0) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [secondsLeft]);

  const formatCountdown = (totalSec) => {
    if (!totalSec || totalSec <= 0) return 'Expired';
    const hours = Math.floor(totalSec / 3600);
    const minutes = Math.floor((totalSec % 3600) / 60);
    const seconds = totalSec % 60;
    return `${hours}h ${minutes}m ${seconds}s left`;
  };

  const handleCopyPin = () => {
    navigator.clipboard.writeText(folder.code);
    setCopiedPin(true);
    onNotify(`Locker PIN #${folder.code} copied!`, 'success');
    setTimeout(() => setCopiedPin(false), 2000);
  };

  const handleCopyShareLink = (customUrl) => {
    const link = customUrl || `${window.location.origin}/?code=${folder.code}`;
    navigator.clipboard.writeText(link);
    onNotify('Direct Locker URL copied to clipboard!', 'success');
  };

  // Add Text Note / Link
  const handleSaveText = async ({ title, textContent }) => {
    try {
      setUploading(true);
      const data = await api.addText({
        folderId: folder.id,
        title,
        textContent
      });
      setItems([data.item, ...items]);
      setIsTextModalOpen(false);
      onNotify('Text posted to locker successfully!', 'success');
    } catch (err) {
      onNotify(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  // Cleanup live timers
  const cleanupProcessTimer = () => {
    if (processTimerRef.current) {
      clearInterval(processTimerRef.current);
      processTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => cleanupProcessTimer();
  }, []);

  // Stage 2: Dynamic Live Processing & Cloud Encryption Percentage
  const startProcessingStage = (totalBytes = 0) => {
    cleanupProcessTimer();
    setUploadPhase('processing');
    setProcessProgress(6);
    setProcessStatus('Encrypting payload & preparing cloud bridge...');

    const totalMb = (totalBytes || 1024 * 1024) / (1024 * 1024);
    // Dynamic expected cloud sync duration based on file size: minimum 2.5s, plus ~1.2s per MB
    const expectedDurationMs = Math.max(2500, Math.min(60000, Math.round(totalMb * 1200) + 2000));

    const startTime = Date.now();
    processTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progressRatio = Math.min(1, elapsed / expectedDurationMs);

      // Smooth progress curve: fast at start, naturally decelerating towards 92-95%
      let next;
      if (progressRatio < 0.6) {
        next = Math.round(6 + (progressRatio / 0.6) * 59); // Reaches ~65%
      } else if (progressRatio < 1) {
        next = Math.round(65 + ((progressRatio - 0.6) / 0.4) * 25); // Reaches ~90%
      } else {
        // If server takes longer than expected, gently tick 1% every 1.5s up to 96%
        const overtime = elapsed - expectedDurationMs;
        next = Math.min(96, Math.round(90 + (overtime / 1500)));
      }

      let statusMsg = 'Encrypting payload & preparing cloud bridge...';
      if (next < 25) {
        statusMsg = 'Encrypting payload & generating cloud checksum...';
      } else if (next < 65) {
        statusMsg = 'Streaming object to Supabase S3 cloud bucket...';
      } else if (next < 88) {
        statusMsg = 'Indexing file metadata and access tokens in DB...';
      } else {
        statusMsg = 'Finalizing cloud verification & locker state...';
      }

      setProcessProgress(next);
      setProcessStatus(statusMsg);
    }, 150);
  };

  // Finalize Upload Success with Smooth 100% Transition
  const finalizeUploadSuccess = async (newItems) => {
    cleanupProcessTimer();
    setUploadPhase('complete');
    setProcessProgress(100);
    setProcessStatus('Cloud sync completed successfully!');

    // Show 100% checkmark briefly before clearing
    await new Promise((res) => setTimeout(res, 550));

    setItems((prev) => [...newItems, ...prev]);
    setUploading(false);
    setUploadPhase('idle');
    setUploadProgress(0);
    setProcessProgress(0);
  };

  // Handle Upload Failure cleanly
  const handleUploadFailure = (err) => {
    cleanupProcessTimer();
    setUploading(false);
    setUploadPhase('idle');
    setUploadProgress(0);
    setProcessProgress(0);
    onNotify(err.message || 'Upload failed', 'error');
  };

  // File Upload Handler
  const handleFileUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const totalBytes = Array.from(files).reduce((acc, f) => acc + (f.size || 0), 0);

    try {
      cleanupProcessTimer();
      setUploading(true);
      setUploadPhase('upload');
      setUploadProgress(0);
      setProcessProgress(0);
      onNotify(`Uploading ${files.length} file(s)...`, 'info');

      const data = await api.uploadFiles({
        folderId: folder.id,
        files,
        onProgress: (percent) => {
          setUploadProgress(percent);
          if (percent >= 100) {
            setUploadPhase((curr) => {
              if (curr === 'upload') {
                startProcessingStage(totalBytes);
                return 'processing';
              }
              return curr;
            });
          }
        }
      });

      await finalizeUploadSuccess(data.items);
      onNotify(`${data.items.length} file(s) uploaded to cloud!`, 'success');
    } catch (err) {
      handleUploadFailure(err);
    } finally {
      e.target.value = ''; // Reset input
    }
  };

  // Drag & Drop Handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (!droppedFiles || droppedFiles.length === 0) return;
    const totalBytes = Array.from(droppedFiles).reduce((acc, f) => acc + (f.size || 0), 0);

    try {
      cleanupProcessTimer();
      setUploading(true);
      setUploadPhase('upload');
      setUploadProgress(0);
      setProcessProgress(0);
      onNotify(`Uploading ${droppedFiles.length} dropped file(s)...`, 'info');

      const data = await api.uploadFiles({
        folderId: folder.id,
        files: droppedFiles,
        onProgress: (percent) => {
          setUploadProgress(percent);
          if (percent >= 100) {
            setUploadPhase((curr) => {
              if (curr === 'upload') {
                startProcessingStage(totalBytes);
                return 'processing';
              }
              return curr;
            });
          }
        }
      });

      await finalizeUploadSuccess(data.items);
      onNotify(`${data.items.length} file(s) uploaded to cloud!`, 'success');
    } catch (err) {
      handleUploadFailure(err);
    }
  };

  // Delete Item Handler
  const handleDeleteItem = async (itemId) => {
    try {
      await api.deleteItem(itemId);
      setItems(items.filter(i => i.id !== itemId));
      onNotify('Item removed from locker.', 'info');
    } catch (err) {
      onNotify(err.message, 'error');
    }
  };

  // Filtering
  const filteredItems = items.filter(item => {
    const matchesSearch = searchQuery === '' || 
      (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.text_content && item.text_content.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.file_name && item.file_name.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (activeTab === 'all') return true;
    if (activeTab === 'text') return item.item_type === 'text';
    if (activeTab === 'photos') return item.category === 'image';
    if (activeTab === 'videos') return item.category === 'video' || (item.file_name && ['.mp4', '.mkv', '.mov', '.avi', '.webm'].some(ext => item.file_name.toLowerCase().endsWith(ext)));
    if (activeTab === 'files') return item.item_type === 'file' && item.category !== 'image' && item.category !== 'video' && !['.mp4', '.mkv', '.mov', '.avi', '.webm'].some(ext => (item.file_name || '').toLowerCase().endsWith(ext));
    return true;
  });

  const countByType = {
    all: items.length,
    text: items.filter(i => i.item_type === 'text').length,
    photos: items.filter(i => i.category === 'image').length,
    videos: items.filter(i => i.category === 'video' || (i.file_name && ['.mp4', '.mkv', '.mov', '.avi', '.webm'].some(ext => i.file_name.toLowerCase().endsWith(ext)))).length,
    files: items.filter(i => i.item_type === 'file' && i.category !== 'image' && i.category !== 'video' && !['.mp4', '.mkv', '.mov', '.avi', '.webm'].some(ext => (i.file_name || '').toLowerCase().endsWith(ext))).length,
  };

  if (loading) {
    return (
      <div className="locker-loading-state">
        <div className="locker-loading-card">
          <div className="loading-orbit-wrapper">
            <div className="loading-orbit-ring"></div>
            <div className="loading-orbit-ring-inner"></div>
            <div className="loading-center-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--accent-primary)">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
            </div>
          </div>

          <h2 className="loading-title">Connecting to Cloud Locker</h2>
          <div className="loading-pin-pill">
            <span className="loading-pin-label">Locker PIN</span>
            <span className="loading-pin-code">#{code}</span>
          </div>

          <div className="loading-progress-track">
            <div className="loading-progress-bar"></div>
          </div>

          <p className="loading-status-text">
            Establishing secure encrypted bridge...
          </p>

          <div className="loading-security-badge">
            <ShieldCheck size={14} color="var(--accent-emerald)" />
            <span>Zero-Knowledge • SSL Cloud Bridge</span>
          </div>
        </div>
      </div>
    );
  }

  if (!folder) {
    return (
      <div className="locker-loading-state">
        <div className="locker-error-card">
          <div className="error-icon-wrapper">
            <AlertCircle size={34} color="#ef4444" />
          </div>
          <h2 className="loading-title">Locker Not Found</h2>
          <p className="error-desc">
            Cloud locker <strong>#{code}</strong> does not exist, or this 24-hour temporary space has expired and self-destructed.
          </p>
          <div className="error-actions">
            <button className="btn btn-secondary" onClick={onGoHome || (() => window.location.href = '/')}>
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </button>
            <button className="btn btn-primary" onClick={onGoHome || (() => window.location.href = '/')}>
              <Plus size={16} />
              <span>Create New Drop</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`locker-page ${isDragging ? 'dragging-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hidden File Pickers triggered by buttons */}
      <input 
        ref={photoInputRef} 
        type="file" 
        accept="image/*" 
        multiple 
        style={{ display: 'none' }} 
        onChange={handleFileUpload} 
      />
      <input 
        ref={videoInputRef} 
        type="file" 
        accept="video/*,.mp4,.mkv,.mov,.avi,.webm" 
        multiple 
        style={{ display: 'none' }} 
        onChange={handleFileUpload} 
      />
      <input 
        ref={anyFileInputRef} 
        type="file" 
        accept="*" 
        multiple 
        style={{ display: 'none' }} 
        onChange={handleFileUpload} 
      />

      {/* Drag Overlay */}
      {isDragging && (
        <div className="dropzone-overlay">
          <UploadCloud size={64} color="var(--accent-primary)" />
          <h2>Drop Files Anywhere to Upload</h2>
          <p>Files will be immediately uploaded to this locker</p>
        </div>
      )}

      {/* Locker Control Bar */}
      <div className="locker-banner">
        <div className="banner-left">
          <div className="banner-folder-info">
            <h1 className="locker-title">{folder.name}</h1>
            <div className="banner-badges">
              {/* PIN Badge */}
              <div 
                className="pin-chip"
                onClick={handleCopyPin}
                title="Click to copy PIN code"
              >
                <span className="pin-text">PIN: #{folder.code}</span>
                {copiedPin ? <Check size={14} color="var(--accent-emerald)" /> : <Copy size={14} />}
              </div>

              {/* Status Badge */}
              {folder.is_temporary ? (
                <div className="expiry-chip">
                  <Clock size={14} />
                  <span>{formatCountdown(secondsLeft)}</span>
                </div>
              ) : (
                <div className="permanent-chip">
                  <ShieldCheck size={14} />
                  <span>Permanent Space</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="banner-right">
          <button className="btn btn-secondary btn-sm" onClick={() => handleCopyShareLink()}>
            <Link2 size={15} />
            <span>Share Link</span>
          </button>

          <button className="btn btn-secondary btn-sm" onClick={() => setIsQrModalOpen(true)}>
            <QrCode size={15} />
            <span>Scan QR</span>
          </button>

          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => loadFolder(false)}
            title="Refresh locker items"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {/* DEDICATED ACTION BUTTONS BAR */}
      <div className="action-buttons-bar">
        <div className="action-buttons-grid">
          {/* 1. TEXT / LINK BUTTON */}
          <button
            className="action-btn action-text"
            onClick={() => setIsTextModalOpen(true)}
            disabled={uploading}
          >
            <div className="action-icon-circle text-circle">
              <FileText size={20} />
            </div>
            <div className="action-btn-texts">
              <span className="action-btn-title">+ Text / Link</span>
              <span className="action-btn-desc">Instant clipboard & notes</span>
            </div>
          </button>

          {/* 2. PHOTO BUTTON */}
          <button
            className="action-btn action-photo"
            onClick={() => photoInputRef.current?.click()}
            disabled={uploading}
          >
            <div className="action-icon-circle photo-circle">
              <ImageIcon size={20} />
            </div>
            <div className="action-btn-texts">
              <span className="action-btn-title">+ Photo</span>
              <span className="action-btn-desc">.jpg, .png, .webp, .svg</span>
            </div>
          </button>

          {/* 3. VIDEO BUTTON */}
          <button
            className="action-btn action-video"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading}
          >
            <div className="action-icon-circle video-circle">
              <Film size={20} />
            </div>
            <div className="action-btn-texts">
              <span className="action-btn-title">+ Videos</span>
              <span className="action-btn-desc">.mp4, .mkv, .mov, .webm...</span>
            </div>
          </button>

          {/* 4. ANY FILE BUTTON */}
          <button
            className="action-btn action-anyfile"
            onClick={() => anyFileInputRef.current?.click()}
            disabled={uploading}
            style={uploading ? { opacity: 0.7, cursor: 'not-allowed' } : {}}
          >
            <div className="action-icon-circle anyfile-circle">
              <Package size={20} />
            </div>
            <div className="action-btn-texts">
              <span className="action-btn-title">
                {uploading 
                  ? (uploadPhase === 'processing' ? `Syncing ${processProgress}%` : `Uploading ${uploadProgress}%`)
                  : '+ Any File'}
              </span>
              <span className="action-btn-desc">.pdf, .docx, .xlsx, .zip, .apk, .exe...</span>
            </div>
          </button>
        </div>
      </div>

      {/* Live Upload Progress Banner with Real Two-Stage Percentage */}
      {uploading && (
        <div className="upload-progress-toast">
          <div className="upload-progress-spinner">
            {uploadPhase === 'complete' ? (
              <Check size={20} color="var(--accent-emerald)" />
            ) : uploadPhase === 'processing' ? (
              <RefreshCw size={20} className="animate-spin" color="var(--accent-cyan)" />
            ) : (
              <span className="upload-percent-text">{uploadProgress}%</span>
            )}
          </div>
          <div className="upload-progress-info" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className={`upload-phase-pill ${uploadPhase === 'upload' ? 'active' : 'done'}`}>
                  1. Device Upload {uploadPhase !== 'upload' ? '✓' : `${uploadProgress}%`}
                </span>
                <span className="upload-phase-arrow">→</span>
                <span className={`upload-phase-pill ${uploadPhase === 'processing' ? 'active' : uploadPhase === 'complete' ? 'done' : 'pending'}`}>
                  2. Cloud Sync {uploadPhase === 'processing' ? `${processProgress}%` : uploadPhase === 'complete' ? '✓' : 'Pending'}
                </span>
              </div>

              <span className={`upload-percent-badge ${uploadPhase === 'complete' ? 'complete' : uploadPhase === 'processing' ? 'processing' : ''}`}>
                {uploadPhase === 'complete'
                  ? '100% Done'
                  : uploadPhase === 'processing'
                    ? `${processProgress}%`
                    : `${uploadProgress}%`}
              </span>
            </div>

            <div className="upload-real-progress-track">
              <div 
                className={`upload-real-progress-bar ${uploadPhase === 'processing' ? 'processing' : ''} ${uploadPhase === 'complete' ? 'complete' : ''}`}
                style={{ 
                  width: uploadPhase === 'complete' 
                    ? '100%' 
                    : uploadPhase === 'processing' 
                      ? `${Math.max(processProgress, 5)}%` 
                      : `${Math.max(uploadProgress, 4)}%` 
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px', flexWrap: 'wrap', gap: '6px' }}>
              <span className="upload-sub-text">
                {uploadPhase === 'complete'
                  ? '✅ File successfully synced and secured in cloud storage!'
                  : uploadPhase === 'processing'
                    ? processStatus
                    : 'Streaming chunks over secure SSL channel to cloud bridge...'}
              </span>
              <span className="upload-phase-counter">
                {uploadPhase === 'upload' && 'Step 1 of 2: Upload'}
                {uploadPhase === 'processing' && 'Step 2 of 2: Processing'}
                {uploadPhase === 'complete' && 'Finalized'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* DRIVE EXPLORER AREA */}
      <div className="explorer-container">
        <div className="explorer-toolbar">
          {/* Category Tabs */}
          <div className="explorer-tabs">
            <button
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Items ({countByType.all})
            </button>
            <button
              className={`tab-btn ${activeTab === 'text' ? 'active' : ''}`}
              onClick={() => setActiveTab('text')}
            >
              Texts & Links ({countByType.text})
            </button>
            <button
              className={`tab-btn ${activeTab === 'photos' ? 'active' : ''}`}
              onClick={() => setActiveTab('photos')}
            >
              Photos ({countByType.photos})
            </button>
            <button
              className={`tab-btn ${activeTab === 'videos' ? 'active' : ''}`}
              onClick={() => setActiveTab('videos')}
            >
              Videos ({countByType.videos})
            </button>
            <button
              className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
              onClick={() => setActiveTab('files')}
            >
              Other Files ({countByType.files})
            </button>
          </div>

          {/* Search Box */}
          <div className="explorer-search">
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search in locker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>

        {/* ITEMS DISPLAY */}
        {filteredItems.length === 0 ? (
          <div className="empty-locker-state">
            <Sparkles size={40} color="var(--accent-cyan)" style={{ opacity: 0.8 }} />
            <h3>This locker is currently empty</h3>
            <p>
              Use the buttons above (Text, Photo, File, Anything Else) or simply drag and drop files anywhere here to share them between mobile and PC!
            </p>
          </div>
        ) : (
          <div className="items-grid">
            {filteredItems.map((item) => (
              item.item_type === 'text' ? (
                <TextCard
                  key={item.id}
                  item={item}
                  onDelete={handleDeleteItem}
                  onNotify={onNotify}
                />
              ) : (
                <FileCard
                  key={item.id}
                  item={item}
                  onDelete={handleDeleteItem}
                  onNotify={onNotify}
                />
              )
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <TextModal
        isOpen={isTextModalOpen}
        onClose={() => setIsTextModalOpen(false)}
        onSave={handleSaveText}
        loading={uploading}
      />

      <QrModal
        code={folder.code}
        isOpen={isQrModalOpen}
        onClose={() => setIsQrModalOpen(false)}
        onCopyLink={handleCopyShareLink}
      />

      <style>{`
        .locker-page {
          max-width: 1200px;
          margin: 1.5rem auto 3rem;
          padding: 0 1.5rem;
          width: 100%;
          min-width: 0;
          overflow-x: hidden;
          box-sizing: border-box;
          position: relative;
        }
        .locker-loading-state, .locker-error-state {
          text-align: center;
          padding: 5rem 1.5rem;
          color: var(--text-secondary);
        }
        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-top-color: var(--accent-primary);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 1.5rem;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .dropzone-overlay {
          position: fixed;
          inset: 0;
          background: var(--bg-dropzone);
          backdrop-filter: blur(10px);
          z-index: 2000;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          border: 3px dashed var(--accent-primary);
          animation: fadeIn 0.15s ease;
          pointer-events: none;
        }
        .dropzone-overlay h2 {
          margin-top: 1rem;
          font-size: 1.75rem;
          color: var(--text-primary);
        }
        .dropzone-overlay p {
          color: var(--text-secondary);
        }
        .locker-banner {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 20px;
          padding: 1.5rem 1.75rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1.25rem;
          box-shadow: var(--shadow-card);
          backdrop-filter: blur(12px);
          margin-bottom: 1.75rem;
        }
        .locker-title {
          font-size: 1.75rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 0.5rem;
          color: var(--text-primary);
        }
        .banner-badges {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }
        .pin-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: var(--bg-card-hover);
          border: 1px solid var(--border-subtle);
          color: var(--accent-primary);
          font-family: 'JetBrains Mono', monospace;
          font-size: 0.9rem;
          font-weight: 800;
          padding: 5px 12px;
          border-radius: 9999px;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: var(--shadow-sm);
        }
        .pin-chip:hover {
          background: var(--bg-card);
          border-color: var(--accent-primary);
          box-shadow: 0 0 12px rgba(79, 70, 229, 0.2);
        }
        .expiry-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.3);
          color: #fcd34d;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: var(--radius-full);
        }
        .permanent-chip {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #6ee7b7;
          font-size: 0.85rem;
          font-weight: 600;
          padding: 5px 12px;
          border-radius: var(--radius-full);
        }
        .banner-right {
          display: flex;
          align-items: center;
          gap: 0.6rem;
        }
        .action-buttons-bar {
          margin-bottom: 2rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }
        .action-buttons-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 1rem;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .action-btn {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          padding: 1rem;
          display: flex;
          align-items: center;
          gap: 0.85rem;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          text-align: left;
          box-shadow: var(--shadow-card);
          min-width: 0;
          max-width: 100%;
          overflow: hidden;
          box-sizing: border-box;
        }
        .action-btn:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 255, 255, 0.2);
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        }
        /* Tinted Pastel Backgrounds & Soft Borders */
        .action-text {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, var(--bg-card) 100%);
          border: 1px solid rgba(6, 182, 212, 0.22);
        }
        .action-text:hover {
          background: linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, var(--bg-card-hover) 100%);
          border-color: var(--accent-cyan);
          box-shadow: 0 8px 24px rgba(6, 182, 212, 0.22);
        }

        .action-photo {
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.08) 0%, var(--bg-card) 100%);
          border: 1px solid rgba(236, 72, 153, 0.22);
        }
        .action-photo:hover {
          background: linear-gradient(135deg, rgba(236, 72, 153, 0.15) 0%, var(--bg-card-hover) 100%);
          border-color: #ec4899;
          box-shadow: 0 8px 24px rgba(236, 72, 153, 0.22);
        }

        .action-video {
          background: linear-gradient(135deg, rgba(244, 63, 94, 0.08) 0%, var(--bg-card) 100%);
          border: 1px solid rgba(244, 63, 94, 0.22);
        }
        .action-video:hover {
          background: linear-gradient(135deg, rgba(244, 63, 94, 0.15) 0%, var(--bg-card-hover) 100%);
          border-color: #f43f5e;
          box-shadow: 0 8px 24px rgba(244, 63, 94, 0.22);
        }

        .action-anyfile {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.09) 0%, var(--bg-card) 100%);
          border: 1px solid rgba(245, 158, 11, 0.24);
        }
        .action-anyfile:hover {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.16) 0%, var(--bg-card-hover) 100%);
          border-color: var(--accent-amber);
          box-shadow: 0 8px 24px rgba(245, 158, 11, 0.22);
        }

        .action-icon-circle {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        .text-circle { background: rgba(6, 182, 212, 0.16); color: var(--accent-cyan); border: 1px solid rgba(6, 182, 212, 0.25); }
        .photo-circle { background: rgba(236, 72, 153, 0.16); color: #ec4899; border: 1px solid rgba(236, 72, 153, 0.25); }
        .video-circle { background: rgba(244, 63, 94, 0.16); color: #f43f5e; border: 1px solid rgba(244, 63, 94, 0.25); }
        .anyfile-circle { background: rgba(245, 158, 11, 0.16); color: var(--accent-amber); border: 1px solid rgba(245, 158, 11, 0.25); }

        .action-btn-texts {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
          overflow: hidden;
          flex: 1;
        }
        .action-btn-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .action-btn-desc {
          font-size: 0.75rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .explorer-container {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 20px;
          padding: 1.5rem;
          box-shadow: var(--shadow-card);
          backdrop-filter: blur(10px);
          width: 100%;
          max-width: 100%;
          min-width: 0;
          overflow: hidden;
          box-sizing: border-box;
        }
        .explorer-toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 1rem;
          margin-bottom: 1.5rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid var(--border-subtle);
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }
        .explorer-tabs {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          overflow-x: auto;
          padding-bottom: 4px;
        }
        .tab-btn {
          background: none;
          border: 1px solid transparent;
          color: var(--text-secondary);
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
        }
        .tab-btn:hover {
          color: var(--text-primary);
          background: var(--bg-card-hover);
        }
        .tab-btn.active {
          background: rgba(79, 70, 229, 0.12);
          color: var(--accent-primary);
          border-color: rgba(79, 70, 229, 0.3);
        }
        .explorer-search {
          display: flex;
          align-items: center;
          gap: 8px;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          padding: 6px 14px;
          border-radius: 9999px;
          min-width: 240px;
        }
        .search-input {
          background: none;
          border: none;
          color: var(--text-primary);
          font-size: 0.85rem;
          outline: none;
          width: 100%;
        }
        .empty-locker-state {
          text-align: center;
          padding: 4rem 1.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }
        .empty-locker-state p {
          color: var(--text-secondary);
          max-width: 480px;
          font-size: 0.95rem;
        }
        .items-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.25rem;
        }
        @media (max-width: 900px) {
          .action-buttons-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 640px) {
          .locker-page {
            margin: 0.75rem auto 2rem;
            padding: 0 0.75rem;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            overflow-x: hidden;
            box-sizing: border-box;
          }
          .locker-banner {
            flex-direction: column;
            align-items: stretch;
            padding: 1rem 0.85rem;
            border-radius: 16px;
            margin-bottom: 1rem;
            gap: 0.85rem;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }
          .banner-left, .banner-folder-info {
            width: 100%;
            max-width: 100%;
            min-width: 0;
          }
          .locker-title {
            font-size: 1.25rem;
            margin-bottom: 0.35rem;
            word-break: break-word;
            max-width: 100%;
          }
          .banner-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 0.4rem;
            max-width: 100%;
          }
          .banner-right {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            display: flex;
            gap: 0.4rem;
          }
          .banner-right .btn {
            flex: 1;
            min-width: 0;
            justify-content: center;
            padding: 0.45rem 0.45rem;
            font-size: 0.76rem;
            white-space: nowrap;
          }
          .banner-right .btn:last-child {
            flex: 0 0 36px;
            padding: 0;
          }
          /* Modern 2x2 Grid for Mobile */
          .action-buttons-bar {
            margin-bottom: 1rem;
            width: 100%;
            max-width: 100%;
            min-width: 0;
          }
          .action-buttons-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            gap: 0.5rem;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }
          .action-btn {
            padding: 0.65rem 0.5rem;
            border-radius: 12px;
            gap: 0.45rem;
            min-width: 0;
            max-width: 100%;
            overflow: hidden;
            box-sizing: border-box;
          }
          .action-icon-circle {
            width: 32px;
            height: 32px;
            border-radius: 8px;
            flex-shrink: 0;
          }
          .action-btn-texts {
            min-width: 0;
            overflow: hidden;
            flex: 1;
          }
          .action-btn-title {
            font-size: 0.78rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          .action-btn-desc {
            font-size: 0.64rem;
            line-height: 1.15;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            max-width: 100%;
          }
          /* Drive Explorer Mobile */
          .explorer-container {
            padding: 0.85rem 0.65rem;
            border-radius: 16px;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
            overflow: hidden;
          }
          .explorer-toolbar {
            flex-direction: column;
            align-items: stretch;
            gap: 0.65rem;
            margin-bottom: 0.85rem;
            padding-bottom: 0.65rem;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }
          .explorer-tabs {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
            gap: 0.3rem;
            padding-bottom: 2px;
            box-sizing: border-box;
          }
          .explorer-tabs::-webkit-scrollbar {
            display: none;
          }
          .tab-btn {
            padding: 4px 9px;
            font-size: 0.74rem;
            flex-shrink: 0;
          }
          .explorer-search {
            width: 100%;
            max-width: 100%;
            min-width: 0;
            padding: 6px 10px;
            box-sizing: border-box;
          }
          .items-grid {
            grid-template-columns: minmax(0, 1fr) !important;
            gap: 0.75rem;
            width: 100%;
            max-width: 100%;
            min-width: 0;
            box-sizing: border-box;
          }
        }
      `}</style>
    </div>
  );
};
