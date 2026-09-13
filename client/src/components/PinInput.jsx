import React, { useState, useRef, useEffect } from 'react';
import { ArrowRight, KeyRound } from 'lucide-react';

export const PinInput = ({ onComplete, loading }) => {
  const [digits, setDigits] = useState(['', '', '', '']);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const inputRefs = [useRef(), useRef(), useRef(), useRef()];

  useEffect(() => {
    if (!isCustomMode && inputRefs[0].current) {
      inputRefs[0].current.focus();
    }
  }, [isCustomMode]);

  const handleChange = (index, value) => {
    // Only accept numbers in standard 4-digit PIN mode
    const sanitized = value.replace(/[^0-9]/g, '');
    if (!sanitized) {
      const newDigits = [...digits];
      newDigits[index] = '';
      setDigits(newDigits);
      return;
    }

    const char = sanitized.slice(-1);
    const newDigits = [...digits];
    newDigits[index] = char;
    setDigits(newDigits);

    // Auto-advance to next input
    if (index < 3 && char) {
      inputRefs[index + 1].current?.focus();
    }

    // Auto-submit if all 4 digits are filled
    const fullPin = newDigits.join('');
    if (fullPin.length === 4) {
      onComplete(fullPin);
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0) {
        inputRefs[index - 1].current?.focus();
        const newDigits = [...digits];
        newDigits[index - 1] = '';
        setDigits(newDigits);
      }
    } else if (e.key === 'Enter') {
      const fullPin = digits.join('');
      if (fullPin.length === 4) {
        onComplete(fullPin);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{4}$/.test(pasted)) {
      const newDigits = pasted.split('');
      setDigits(newDigits);
      inputRefs[3].current?.focus();
      onComplete(pasted);
    } else if (pasted.length > 0) {
      // If alphanumeric or custom length, switch to custom mode
      setIsCustomMode(true);
      setCustomCode(pasted);
    }
  };

  const handleCustomSubmit = (e) => {
    e.preventDefault();
    if (customCode.trim()) {
      onComplete(customCode.trim().toUpperCase());
    }
  };

  return (
    <div className="pin-widget-container">
      {!isCustomMode ? (
        <div>
          <div className="pin-slots" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={loading}
                className="pin-box"
                autoComplete="off"
              />
            ))}
          </div>

          <div className="pin-actions">
            <button
              className="btn btn-primary btn-lg pin-submit-btn"
              onClick={() => onComplete(digits.join(''))}
              disabled={digits.join('').length < 4 || loading}
            >
              {loading ? 'Opening...' : 'Open Locker'}
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              className="custom-code-toggle"
              onClick={() => setIsCustomMode(true)}
            >
              <KeyRound size={14} />
              Have an alphanumeric or custom code?
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleCustomSubmit} className="custom-code-form">
          <input
            type="text"
            className="form-input custom-code-input"
            placeholder="ENTER CODE (e.g. DOCS99)"
            value={customCode}
            onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
            autoFocus
            disabled={loading}
          />
          <div className="custom-form-btns">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={!customCode.trim() || loading}
            >
              {loading ? 'Opening...' : 'Open Locker'}
              <ArrowRight size={18} />
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setIsCustomMode(false)}
            >
              Switch to 4-digit PIN
            </button>
          </div>
        </form>
      )}

      <style>{`
        .pin-widget-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          width: 100%;
          max-width: 460px;
          margin: 0 auto;
        }
        .pin-slots {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        .pin-box {
          width: 68px;
          height: 78px;
          font-family: 'JetBrains Mono', monospace;
          font-size: 2.2rem;
          font-weight: 700;
          text-align: center;
          background: var(--pin-bg);
          border: 2px solid var(--pin-border);
          border-radius: 14px;
          color: var(--text-primary);
          box-shadow: var(--shadow-card);
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .pin-box:focus {
          outline: none;
          border-color: var(--accent-primary);
          box-shadow: 0 0 0 4px var(--border-glow), 0 8px 24px rgba(79, 70, 229, 0.25);
          transform: translateY(-2px);
          background: var(--bg-card);
        }
        .pin-actions {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
          width: 100%;
        }
        .pin-submit-btn {
          width: 100%;
          border-radius: var(--radius-md);
        }
        .custom-code-toggle {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 0.85rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          transition: color 0.2s;
        }
        .custom-code-toggle:hover {
          color: var(--accent-primary);
          text-decoration: underline;
        }
        .custom-code-form {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .custom-code-input {
          font-family: var(--font-mono);
          font-size: 1.25rem;
          font-weight: 700;
          text-align: center;
          letter-spacing: 0.1em;
          padding: 1rem;
        }
        .custom-form-btns {
          display: flex;
          gap: 0.75rem;
        }
        .custom-form-btns > button:first-child {
          flex: 1;
        }
        @media (max-width: 480px) {
          .pin-box {
            width: 54px;
            height: 64px;
            font-size: 1.75rem;
          }
          .pin-slots {
            gap: 0.6rem;
          }
        }
      `}</style>
    </div>
  );
};
