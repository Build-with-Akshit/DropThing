import React, { useState } from 'react';
import { FileText, Copy, Check, ExternalLink, Download, Trash2, Clock, Globe } from 'lucide-react';

export const TextCard = ({ item, onDelete, onNotify }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.text_content);
      setCopied(true);
      if (onNotify) onNotify('Text copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = item.text_content;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      if (onNotify) onNotify('Text copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([item.text_content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `${item.title || 'note'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const isUrl = /^https?:\/\//i.test(item.text_content?.trim() || '');

  const getDisplayTitle = () => {
    // If user provided a specific custom title that is not just the raw url
    if (item.title && !item.title.startsWith('http://') && !item.title.startsWith('https://')) {
      return item.title;
    }
    // If it's a URL, extract a clean domain name for title
    if (isUrl) {
      try {
        const urlObj = new URL(item.text_content.trim());
        return urlObj.hostname.replace(/^www\./, '');
      } catch {
        return 'Shared Link';
      }
    }
    return item.title || 'Text Note';
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

  const IconComponent = isUrl ? Globe : FileText;

  return (
    <div className="item-card text-card">
      {/* Card Header */}
      <div className="card-top">
        <div className="card-top-left">
          <div className="text-badge-icon" style={{
            background: isUrl ? 'rgba(2, 132, 199, 0.12)' : 'rgba(99, 102, 241, 0.12)',
            color: isUrl ? 'var(--accent-cyan)' : 'var(--accent-primary)',
            borderColor: isUrl ? 'rgba(2, 132, 199, 0.25)' : 'rgba(99, 102, 241, 0.25)'
          }}>
            <IconComponent size={20} />
          </div>
          <div className="card-header-info">
            <span className="card-type-tag" style={{
              background: isUrl ? 'rgba(2, 132, 199, 0.12)' : 'rgba(99, 102, 241, 0.12)',
              color: isUrl ? 'var(--accent-cyan)' : 'var(--accent-primary)',
              borderColor: isUrl ? 'rgba(2, 132, 199, 0.25)' : 'rgba(99, 102, 241, 0.25)'
            }}>
              {isUrl ? 'LINK / URL' : 'TEXT NOTE'}
            </span>
            <h4 className="card-title" title={item.text_content}>
              {getDisplayTitle()}
            </h4>
          </div>
        </div>

        <div className="card-actions">
          <button
            className={`btn-icon-action btn-copy ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Copy to Clipboard"
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          
          <button
            className="btn-icon-subtle"
            onClick={handleDownloadTxt}
            title="Download as .txt"
          >
            <Download size={15} />
          </button>

          <button
            className="btn-icon-subtle btn-delete"
            onClick={() => onDelete(item.id)}
            title="Delete item"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Text Body Area */}
      <div className="card-content-area">
        <div className="text-body-preview-container">
          <pre className="text-body-preview">{item.text_content}</pre>
        </div>
      </div>

      {/* Card Footer */}
      <div className="card-bottom">
        <div className="card-meta">
          <div className="card-meta-item">
            <Clock size={13} />
            <span>{formatTime(item.created_at)}</span>
          </div>
          <span className="card-meta-dot">•</span>
          <span>{item.text_content ? item.text_content.length : 0} chars</span>
        </div>

        {isUrl && (
          <a
            href={item.text_content.trim()}
            target="_blank"
            rel="noopener noreferrer"
            className="open-link-btn"
          >
            Open Link <ExternalLink size={13} />
          </a>
        )}
      </div>

      <style>{`
        .item-card {
          background: var(--bg-card);
          border: 1px solid var(--border-subtle);
          border-radius: var(--radius-md);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: var(--shadow-card);
          backdrop-filter: blur(12px);
          min-width: 0;
        }
        .item-card:hover {
          border-color: var(--border-hover);
          transform: translateY(-2px);
          box-shadow: var(--shadow-card-hover);
        }
        .text-badge-icon {
          width: 44px;
          height: 44px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid;
          flex-shrink: 0;
        }
        .card-top {
          padding: 1rem 1.25rem 0.5rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          min-width: 0;
        }
        .card-header-info {
          display: flex;
          flex-direction: column;
          gap: 0.3rem;
          min-width: 0;
          overflow: hidden;
        }
        .card-type-tag {
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 0.05em;
          padding: 2px 7px;
          border-radius: 9999px;
          width: fit-content;
          border: 1px solid transparent;
        }
        .card-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-primary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin: 0;
          max-width: 100%;
        }
        .card-actions {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-shrink: 0;
        }
        .btn-icon-action {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 10px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 700;
          cursor: pointer;
          border: 1px solid var(--border-subtle);
          background: var(--bg-card-hover);
          color: var(--text-primary);
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .btn-copy:hover {
          background: rgba(79, 70, 229, 0.15);
          border-color: var(--accent-primary);
          color: var(--accent-primary);
        }
        .btn-copy.copied {
          background: rgba(5, 150, 105, 0.15);
          border-color: var(--accent-emerald);
          color: var(--accent-emerald);
        }
        .btn-icon-subtle {
          background: none;
          border: none;
          color: var(--text-muted);
          padding: 6px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
        }
        .btn-icon-subtle:hover {
          color: var(--text-primary);
          background: var(--bg-card-hover);
        }
        .btn-icon-subtle.btn-delete:hover {
          color: var(--accent-rose);
          background: rgba(225, 29, 72, 0.12);
        }
        .card-content-area {
          padding: 0.6rem 1.25rem 0.85rem;
          flex: 1;
          min-width: 0;
        }
        .text-body-preview-container {
          background: var(--bg-card-hover);
          border: 1px solid var(--border-subtle);
          border-radius: 10px;
          padding: 0.75rem 1rem;
          max-height: 140px;
          overflow-y: auto;
          overflow-x: hidden;
          transition: border-color 0.2s ease;
        }
        .text-body-preview-container:hover {
          border-color: var(--border-hover);
        }
        .text-body-preview {
          font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
          font-size: 0.825rem;
          line-height: 1.55;
          color: var(--text-primary);
          background: transparent;
          border: none;
          padding: 0;
          margin: 0;
          white-space: pre-wrap;
          word-break: break-all;
          overflow-wrap: anywhere;
        }
        .card-bottom {
          padding: 0.75rem 1.25rem;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .card-meta {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .open-link-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--accent-cyan);
          text-decoration: none;
          font-size: 0.8rem;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        .open-link-btn:hover {
          background: rgba(2, 132, 199, 0.1);
          text-decoration: underline;
        }
        @media (max-width: 600px) {
          .card-top {
            padding: 0.85rem 1rem 0.5rem;
          }
          .text-badge-icon {
            width: 36px;
            height: 36px;
            border-radius: 10px;
          }
          .card-title {
            font-size: 0.88rem;
          }
          .card-content-area {
            padding: 0.5rem 1rem 0.75rem;
          }
          .text-body-preview-container {
            padding: 0.65rem 0.85rem;
            max-height: 120px;
          }
          .card-bottom {
            padding: 0.65rem 1rem;
            font-size: 0.75rem;
          }
        }
      `}</style>
    </div>
  );
};
