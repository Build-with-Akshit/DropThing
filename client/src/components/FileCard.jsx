import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  File, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  Archive, 
  Terminal, 
  Smartphone, 
  Download, 
  Trash2, 
  Clock, 
  HardDrive,
  Eye,
  Play,
  Copy,
  Check,
  X
} from 'lucide-react';
import { api } from '../services/api';

export const FileCard = ({ item, onDelete, onNotify }) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [videoDuration, setVideoDuration] = useState(null);
  const [docContent, setDocContent] = useState(null);
  const [copiedDoc, setCopiedDoc] = useState(false);
  const videoThumbRef = useRef(null);

  // Close modal on Escape key and prevent background body scroll
  useEffect(() => {
    if (!showLightbox) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' || e.keyCode === 27) {
        setShowLightbox(false);
      }
    };

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showLightbox]);

  const getFileExtension = (filename) => {
    if (!filename) return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  };

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return 'Just now';
    try {
      const parsed = new Date(dateStr.endsWith('Z') ? dateStr : dateStr + 'Z');
      return isNaN(parsed.getTime()) ? 'Just now' : parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'Just now';
    }
  };

  const formatDuration = (sec) => {
    if (!sec || isNaN(sec)) return null;
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const ext = getFileExtension(item.file_name);
  const isImage = (item.category === 'image' || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(ext)) && !imgError;
  const isVideo = item.category === 'video' || ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext);
  const isPdf = ext === 'pdf';
  const textDocExts = ['txt', 'md', 'json', 'csv', 'js', 'jsx', 'ts', 'tsx', 'py', 'html', 'css', 'xml', 'log', 'sql', 'sh', 'bat', 'env', 'yaml', 'yml'];
  const isTextDoc = textDocExts.includes(ext);
  const canPreview = isImage || isVideo || isPdf || isTextDoc;

  const downloadUrl = api.getDownloadUrl(item.id);
  const viewUrl = api.getViewUrl(item.id);

  // Auto-fetch preview snippet for text / markdown / code documents (< 2MB)
  useEffect(() => {
    if (isTextDoc && item.file_size < 2 * 1024 * 1024) {
      let active = true;
      fetch(viewUrl)
        .then(res => res.text())
        .then(text => {
          if (active) setDocContent(text);
        })
        .catch(() => {});
      return () => { active = false; };
    }
  }, [isTextDoc, viewUrl, item.file_size]);

  const handleCopyDoc = async () => {
    if (!docContent) return;
    try {
      await navigator.clipboard.writeText(docContent);
      setCopiedDoc(true);
      if (onNotify) onNotify('File content copied to clipboard!', 'success');
      setTimeout(() => setCopiedDoc(false), 2000);
    } catch {}
  };

  // File type aesthetics config
  const getFileTypeDetails = () => {
    switch (ext) {
      case 'pdf':
        return { icon: FileText, label: 'PDF', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)' };
      case 'doc':
      case 'docx':
        return { icon: FileText, label: 'WORD', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.25)' };
      case 'xls':
      case 'xlsx':
      case 'csv':
        return { icon: FileText, label: 'EXCEL', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' };
      case 'ppt':
      case 'pptx':
        return { icon: FileText, label: 'POWERPOINT', color: '#f97316', bg: 'rgba(249, 115, 22, 0.12)', border: 'rgba(249, 115, 22, 0.25)' };
      case 'zip':
      case 'rar':
      case '7z':
      case 'tar':
      case 'gz':
        return { icon: Archive, label: 'ARCHIVE', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.25)' };
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'svg':
        return { icon: ImageIcon, label: 'IMAGE', color: '#ec4899', bg: 'rgba(236, 72, 153, 0.12)', border: 'rgba(236, 72, 153, 0.25)' };
      case 'mp4':
      case 'mkv':
      case 'mov':
      case 'avi':
      case 'webm':
        return { icon: Film, label: 'VIDEO', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.25)' };
      case 'exe':
      case 'msi':
      case 'bat':
        return { icon: Terminal, label: 'APP / EXE', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)', border: 'rgba(168, 85, 247, 0.25)' };
      case 'apk':
        return { icon: Smartphone, label: 'ANDROID APK', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.25)' };
      default:
        return { icon: File, label: ext ? ext.toUpperCase() : 'FILE', color: '#4f46e5', bg: 'rgba(79, 70, 229, 0.12)', border: 'rgba(79, 70, 229, 0.25)' };
    }
  };

  const details = getFileTypeDetails();
  const IconComponent = details.icon;

  return (
    <>
      <div className="item-card file-card">
        {/* Top Header info */}
        <div className="card-top">
          <div className="card-top-left">
            <div 
              className="file-type-icon-box"
              style={{ 
                background: details.bg, 
                color: details.color,
                borderColor: details.border
              }}
            >
              <IconComponent size={22} />
            </div>
            <div className="card-header-info">
              <span 
                className="card-type-tag" 
                style={{ background: details.bg, color: details.color, borderColor: details.border }}
              >
                {details.label}
              </span>
              <h4 className="card-title" title={item.file_name}>{item.file_name}</h4>
            </div>
          </div>

          <div className="card-actions">
            <a
              href={downloadUrl}
              download={item.file_name}
              className="btn-icon-action btn-download"
              title="Download file"
              onClick={() => onNotify && onNotify(`Downloading ${item.file_name}...`, 'info')}
            >
              <Download size={14} />
              <span>Download</span>
            </a>

            <button
              className="btn-icon-subtle btn-delete"
              onClick={() => onDelete(item.id)}
              title="Delete file"
            >
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* IMAGE PREVIEW THUMBNAIL */}
        {isImage && (
          <div 
            className="image-thumbnail-container"
            onClick={() => setShowLightbox(true)}
            title="Click to view full image"
          >
            <img 
              src={viewUrl} 
              alt={item.file_name} 
              className="image-thumb"
              onError={() => setImgError(true)}
              loading="lazy"
            />
            <div className="image-overlay-badge">
              <Eye size={14} />
              <span>Click to view</span>
            </div>
          </div>
        )}

        {/* VIDEO PREVIEW THUMBNAIL */}
        {isVideo && !videoError && (
          <div 
            className="video-thumbnail-container"
            onClick={() => setShowLightbox(true)}
            onMouseEnter={() => {
              if (videoThumbRef.current) {
                videoThumbRef.current.play().catch(() => {});
              }
            }}
            onMouseLeave={() => {
              if (videoThumbRef.current) {
                videoThumbRef.current.pause();
                videoThumbRef.current.currentTime = 0.5;
              }
            }}
            title="Click to play video"
          >
            <video 
              ref={videoThumbRef}
              src={`${viewUrl}#t=0.5`} 
              className="video-thumb"
              preload="metadata"
              muted
              playsInline
              onLoadedMetadata={(e) => setVideoDuration(e.target.duration)}
              onError={() => setVideoError(true)}
            />
            
            {/* Center Play Button Overlay */}
            <div className="video-play-center-btn">
              <div className="play-icon-glow">
                <Play size={20} fill="white" color="white" style={{ marginLeft: '3px' }} />
              </div>
            </div>

            {/* Corner Badge */}
            <div className="video-duration-badge">
              <Film size={12} />
              <span>{formatDuration(videoDuration) || 'Video'}</span>
            </div>
          </div>
        )}

        {/* TEXT / MARKDOWN / CODE CARD PREVIEW */}
        {isTextDoc && docContent && (
          <div 
            className="file-doc-preview-box"
            onClick={() => setShowLightbox(true)}
            title="Click to expand full document"
          >
            <div className="file-doc-header">
              <span className="file-doc-tag">{ext.toUpperCase()} PREVIEW</span>
              <span className="file-doc-lines">{docContent.split('\n').length} lines</span>
            </div>
            <pre className="file-doc-snippet">{docContent.slice(0, 320)}</pre>
          </div>
        )}

        {/* PDF PREVIEW BADGE */}
        {isPdf && (
          <div 
            className="file-pdf-preview-box"
            onClick={() => setShowLightbox(true)}
            title="Click to view PDF document"
          >
            <div className="pdf-preview-icon">
              <FileText size={24} color="#ef4444" />
            </div>
            <div className="pdf-preview-meta">
              <span className="pdf-preview-title">PDF Document</span>
              <span className="pdf-preview-sub">Click to open interactive reader</span>
            </div>
          </div>
        )}

        {/* Card Footer Meta */}
        <div className="card-bottom">
          <div className="card-meta">
            <div className="card-meta-item">
              <HardDrive size={13} />
              <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{formatFileSize(item.file_size)}</span>
            </div>
            <span className="card-meta-dot">•</span>
            <div className="card-meta-item">
              <Clock size={13} />
              <span>{formatTime(item.created_at)}</span>
            </div>
          </div>

          {canPreview && (
            <button
              type="button"
              className="view-media-btn"
              onClick={() => setShowLightbox(true)}
            >
              <Eye size={13} /> <span>{isVideo ? 'Play Video' : isPdf ? 'Read PDF' : 'Preview'}</span>
            </button>
          )}
        </div>
      </div>

      {/* FULL RESOLUTION LIGHTBOX MODAL */}
      {showLightbox && createPortal(
        <div 
          className="lightbox-overlay" 
          onClick={() => setShowLightbox(false)}
        >
          {/* Top Right Floating Close Button with ESC hint */}
          <button
            className="lightbox-floating-close"
            onClick={() => setShowLightbox(false)}
            title="Close preview (or press Esc)"
          >
            <X size={18} />
            <span className="esc-key-badge">ESC</span>
          </button>

          <div 
            className={`lightbox-container ${isTextDoc ? 'lightbox-container-doc' : ''} ${isPdf ? 'lightbox-container-pdf' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lightbox-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                {isVideo ? (
                  <Film size={18} color="var(--accent-primary)" />
                ) : isTextDoc || isPdf ? (
                  <FileText size={18} color="var(--accent-primary)" />
                ) : (
                  <ImageIcon size={18} color="var(--accent-primary)" />
                )}
                <span className="lightbox-title">{item.file_name}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>({formatFileSize(item.file_size)})</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isTextDoc && docContent && (
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleCopyDoc}
                    title="Copy full content"
                    style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {copiedDoc ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                    <span>{copiedDoc ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                )}
                <a
                  href={downloadUrl}
                  download={item.file_name}
                  className="btn btn-primary btn-sm"
                  title="Download"
                >
                  <Download size={14} />
                  <span>Download</span>
                </a>
                <button
                  className="modal-close"
                  onClick={() => setShowLightbox(false)}
                  title="Close preview (Esc)"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div 
              className={`lightbox-body ${isTextDoc ? 'lightbox-body-doc' : ''} ${isPdf ? 'lightbox-body-pdf' : ''}`}
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  setShowLightbox(false);
                }
              }}
              title="Click empty space or press Esc to close"
            >
              {isVideo ? (
                <video 
                  src={viewUrl} 
                  controls 
                  autoPlay 
                  className="lightbox-full-img"
                  style={{ maxHeight: '75vh', maxWidth: '100%', borderRadius: '10px' }}
                />
              ) : isTextDoc ? (
                <div className="lightbox-doc-container" onClick={(e) => e.stopPropagation()}>
                  <pre className="lightbox-doc-pre">
                    <code>{docContent !== null ? docContent : 'Loading content...'}</code>
                  </pre>
                </div>
              ) : isPdf ? (
                <iframe 
                  src={viewUrl} 
                  title={item.file_name}
                  className="lightbox-pdf-frame" 
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <img 
                  src={viewUrl} 
                  alt={item.file_name} 
                  className="lightbox-full-img"
                />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}

      <style>{`
        .image-thumbnail-container {
          position: relative;
          width: calc(100% - 1.5rem);
          margin: 0 auto 0.75rem;
          height: 180px;
          border-radius: 12px;
          overflow: hidden;
          background: var(--bg-card-hover);
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .image-thumb {
          width: 100%;
          height: 100%;
          object-fit: contain;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          background: repeating-conic-gradient(rgba(0,0,0,0.03) 0% 25%, transparent 0% 50%) 50% / 16px 16px;
        }
        .image-thumbnail-container:hover .image-thumb {
          transform: scale(1.04);
        }
        .image-overlay-badge {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(15, 23, 42, 0.75);
          backdrop-filter: blur(6px);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 600;
          padding: 4px 10px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 5px;
          opacity: 0;
          transform: translateY(4px);
          transition: all 0.2s ease;
        }
        .image-thumbnail-container:hover .image-overlay-badge {
          opacity: 1;
          transform: translateY(0);
        }
        .video-thumbnail-container {
          position: relative;
          width: calc(100% - 1.5rem);
          margin: 0 auto 0.75rem;
          height: 180px;
          border-radius: 12px;
          overflow: hidden;
          background: #090d16;
          border: 1px solid var(--border-subtle);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .video-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .video-thumbnail-container:hover .video-thumb {
          transform: scale(1.03);
        }
        .video-play-center-btn {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          background: rgba(15, 23, 42, 0.25);
          transition: all 0.25s ease;
        }
        .video-thumbnail-container:hover .video-play-center-btn {
          background: rgba(15, 23, 42, 0.05);
        }
        .play-icon-glow {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: rgba(244, 63, 94, 0.88);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(244, 63, 94, 0.5);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s ease;
        }
        .video-thumbnail-container:hover .play-icon-glow {
          transform: scale(1.15);
          background: #f43f5e;
          box-shadow: 0 6px 25px rgba(244, 63, 94, 0.75);
        }
        .video-duration-badge {
          position: absolute;
          bottom: 10px;
          right: 10px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(6px);
          color: #fff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          gap: 5px;
          border: 1px solid rgba(255, 255, 255, 0.15);
          pointer-events: none;
        }
        /* Lightbox Modal */
        .lightbox-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.88);
          backdrop-filter: blur(14px);
          z-index: 99999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 1.5rem;
          animation: fadeIn 0.2s ease;
          cursor: pointer;
        }
        .lightbox-floating-close {
          position: absolute;
          top: 20px;
          right: 24px;
          background: rgba(255, 255, 255, 0.14);
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: #ffffff;
          padding: 7px 14px;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          backdrop-filter: blur(10px);
          transition: all 0.2s ease;
          z-index: 100000;
        }
        .lightbox-floating-close:hover {
          background: rgba(239, 68, 68, 0.9);
          border-color: #ef4444;
          transform: scale(1.05);
        }
        .esc-key-badge {
          font-size: 0.7rem;
          font-family: var(--font-mono);
          background: rgba(0, 0, 0, 0.4);
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .lightbox-container {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: 18px;
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 25px 70px rgba(0, 0, 0, 0.65);
          overflow: hidden;
          animation: scaleUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          cursor: default;
        }
        .lightbox-header {
          padding: 1rem 1.25rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid var(--border-subtle);
          gap: 1rem;
        }
        .lightbox-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .lightbox-body {
          padding: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: auto;
          background: var(--bg-input);
          min-height: 250px;
        }
        .lightbox-full-img {
          max-width: 100%;
          max-height: 75vh;
          object-fit: contain;
          border-radius: 10px;
          box-shadow: var(--shadow-card);
        }

        /* Document / Code preview snippet box */
        .file-doc-preview-box {
          margin: 0 1rem 0.85rem;
          padding: 0.75rem 0.9rem;
          background: var(--bg-input);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
        }
        .file-doc-preview-box:hover {
          border-color: var(--accent-primary);
          background: var(--bg-card-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.08);
        }
        .file-doc-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.4rem;
          padding-bottom: 0.35rem;
          border-bottom: 1px solid var(--border-subtle);
        }
        .file-doc-tag {
          font-size: 0.68rem;
          font-weight: 700;
          color: var(--accent-primary);
          letter-spacing: 0.06em;
          font-family: var(--font-mono);
        }
        .file-doc-lines {
          font-size: 0.7rem;
          color: var(--text-muted);
        }
        .file-doc-snippet {
          margin: 0;
          font-family: var(--font-mono);
          font-size: 0.78rem;
          line-height: 1.45;
          color: var(--text-secondary);
          max-height: 84px;
          overflow: hidden;
          white-space: pre-wrap;
          word-break: break-word;
          position: relative;
          mask-image: linear-gradient(180deg, #000 65%, transparent 100%);
          -webkit-mask-image: linear-gradient(180deg, #000 65%, transparent 100%);
        }

        /* PDF Preview Card */
        .file-pdf-preview-box {
          margin: 0 1rem 0.85rem;
          padding: 0.75rem 1rem;
          background: rgba(239, 68, 68, 0.05);
          border: 1px dashed rgba(239, 68, 68, 0.35);
          border-radius: 10px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s ease;
        }
        .file-pdf-preview-box:hover {
          background: rgba(239, 68, 68, 0.09);
          border-color: #ef4444;
          transform: translateY(-1px);
        }
        .pdf-preview-icon {
          width: 38px;
          height: 38px;
          border-radius: 8px;
          background: rgba(239, 68, 68, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .pdf-preview-meta {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .pdf-preview-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: #ef4444;
        }
        .pdf-preview-sub {
          font-size: 0.72rem;
          color: var(--text-muted);
        }

        /* Lightbox Doc container */
        .lightbox-container-doc {
          width: min(850px, 92vw);
        }
        .lightbox-body-doc {
          padding: 0;
          background: var(--bg-card);
          height: 70vh;
          align-items: stretch;
        }
        .lightbox-doc-container {
          width: 100%;
          height: 100%;
          overflow: auto;
          padding: 1.5rem;
        }
        .lightbox-doc-pre {
          margin: 0;
          font-family: var(--font-mono);
          font-size: 0.86rem;
          line-height: 1.65;
          color: var(--text-primary);
          white-space: pre-wrap;
          word-break: break-word;
        }

        /* Lightbox PDF container */
        .lightbox-container-pdf {
          width: min(960px, 92vw);
        }
        .lightbox-body-pdf {
          padding: 0;
          height: 80vh;
        }
        .lightbox-pdf-frame {
          width: 100%;
          height: 100%;
          border: none;
          background: #fff;
        }
      `}</style>
    </>
  );
};
