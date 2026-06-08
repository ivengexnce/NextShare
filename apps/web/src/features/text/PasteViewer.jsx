import { useEffect, useState } from 'react';
import { textApi } from './text.api';

export default function PasteViewer({ code }) {
  const [paste, setPaste]   = useState(null);
  const [error, setError]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    textApi.get(code)
      .then(setPaste)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [code]);

  function copy() {
    navigator.clipboard.writeText(paste.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) return (
    <div className="tool-card">
      <div className="tool-body">
        <p style={{ color: 'var(--fg-2)' }}>Loading paste…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="tool-card">
      <div className="tool-body">
        <div className="tool-header">
          <div className="tool-tag">ERROR</div>
          <h2 className="tool-title">Paste unavailable</h2>
          <p className="tool-desc">{error}</p>
        </div>
        <button className="btn-primary" onClick={() => window.location.href = '/'}>
          ← Back to NextShare
        </button>
      </div>
    </div>
  );

  return (
    <div className="tool-card">
      <div className="tool-card-bar">
        <div className="card-dots">
          <div className="card-dot" /><div className="card-dot" /><div className="card-dot" />
        </div>
        <span className="card-tab-label">nextshare — {paste.title || paste.shortCode}</span>
      </div>

      <div className="tool-body">
        <div className="tool-header">
          <div className="tool-tag">CODE PASTE</div>
          <h2 className="tool-title">{paste.title || 'Untitled paste'}</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <span style={{ color: 'var(--fg-2)', fontSize: '.8rem' }}>
              Language: <strong style={{ color: 'var(--fg-1)' }}>{paste.language}</strong>
            </span>
            {paste.expiresAt && (
              <span style={{ color: 'var(--fg-2)', fontSize: '.8rem' }}>
                Expires: <strong style={{ color: 'var(--fg-1)' }}>
                  {Math.ceil((new Date(paste.expiresAt) - Date.now()) / 86400000)}d
                </strong>
              </span>
            )}
            {paste.burnAfterRead && (
              <span style={{ fontSize: '.8rem' }}>🔥 Burned after this view</span>
            )}
          </div>
        </div>

        <div className="field" style={{ marginTop: '1rem' }}>
          <div className="label-row">
            <label className="label">Content</label>
            <button
              className={`btn-copy ${copied ? 'btn-copy--done' : ''}`}
              onClick={copy}
            >
              {copied ? 'Copied ✓' : 'Copy'}
            </button>
          </div>
          <textarea
            className="input textarea"
            rows={16}
            value={paste.content}
            readOnly
            style={{ fontFamily: 'monospace', resize: 'vertical' }}
          />
        </div>

        <button
          className="btn-primary"
          style={{ marginTop: '1rem' }}
          onClick={() => window.location.href = '/'}
        >
          ← Create your own paste
        </button>
      </div>
    </div>
  );
}
