import { useEffect, useState } from 'react';
import { textApi } from './text.api';

export default function PasteViewer({ code }) {
  const [paste, setPaste]     = useState(null);
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied]   = useState(false);

  useEffect(() => {
    textApi.get(code)
      .then(setPaste)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [code]);

  function copy() {
    if (!paste) return;
    navigator.clipboard.writeText(paste.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function daysLeft(expiresAt) {
    const diff = new Date(expiresAt) - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days <= 0) return 'Expired';
    if (days === 1) return '1 day left';
    return `${days}d left`;
  }

  const lineCount = paste ? paste.content.split('\n').length : 0;
  const charCount = paste ? paste.content.length : 0;
  const dynamicRows = Math.min(Math.max(lineCount + 2, 4), 36);

  const wrapper = (children) => (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'flex-start',
      minHeight: '100vh',
      padding: '40px 24px',
    }}>
      <div className="tool-card" style={{ width: '100%', maxWidth: '680px' }}>
        {children}
      </div>
    </div>
  );

  if (loading) return wrapper(
    <>
      <div className="tool-card-bar">
        <div className="card-dots">
          <div className="card-dot" /><div className="card-dot" /><div className="card-dot" />
        </div>
        <span className="card-tab-label">nextshare — loading…</span>
      </div>
      <div className="tool-body" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2.5rem' }}>
        <div style={{
          width: 18, height: 18, border: '2px solid var(--bdr)', borderTopColor: 'var(--t2)',
          borderRadius: '50%', animation: 'spin 0.7s linear infinite', flexShrink: 0,
        }} />
        <span style={{ color: 'var(--t2)', fontSize: '.85rem' }}>Fetching paste…</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );

  if (error) return wrapper(
    <>
      <div className="tool-card-bar">
        <div className="card-dots">
          <div className="card-dot" /><div className="card-dot" /><div className="card-dot" />
        </div>
        <span className="card-tab-label">nextshare — error</span>
      </div>
      <div className="tool-body">
        <div className="tool-header">
          <div className="tool-tag">ERROR</div>
          <h2 className="tool-title">Paste unavailable</h2>
          <p className="tool-desc" style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>{error}</p>
        </div>
        <button className="btn-primary" onClick={() => window.location.href = '/'}>
          ← Back to NextShare
        </button>
      </div>
    </>
  );

  const stats = [
    { label: 'Short code', val: paste.shortCode ?? '—' },
    { label: 'Views',      val: paste.viewCount?.toLocaleString() ?? '—' },
    { label: 'Created',    val: paste.createdAt
        ? new Date(paste.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—' },
  ];

  return wrapper(
    <>
      <div className="tool-card-bar">
        <div className="card-dots">
          <div className="card-dot" /><div className="card-dot" /><div className="card-dot" />
        </div>
        <span className="card-tab-label">nextshare — {paste.title || paste.shortCode}</span>
      </div>

      <div className="tool-body">

        {/* ── Header ── */}
        <div className="tool-header">
          <div className="tool-tag">CODE PASTE</div>
          <h2 className="tool-title" style={{ marginBottom: '0.75rem' }}>
            {paste.title || 'Untitled paste'}
          </h2>

          {/* ── Inline badges ── */}
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              fontFamily: 'monospace', fontSize: '.72rem', fontWeight: 600,
              padding: '0.2rem 0.55rem', borderRadius: 4,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid var(--bdr)',
              color: 'var(--t2)',
            }}>
              {paste.language}
            </span>
            {paste.expiresAt ? (
              <span style={{
                fontFamily: 'monospace', fontSize: '.72rem',
                padding: '0.2rem 0.55rem', borderRadius: 4,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--bdr)',
                color: 'var(--t2)',
              }}>
                {daysLeft(paste.expiresAt)}
              </span>
            ) : (
              <span style={{
                fontFamily: 'monospace', fontSize: '.72rem',
                padding: '0.2rem 0.55rem', borderRadius: 4,
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid var(--bdr)',
                color: 'var(--t2)',
              }}>
                never expires
              </span>
            )}
            {paste.burnAfterRead && (
              <span style={{
                fontFamily: 'monospace', fontSize: '.72rem',
                padding: '0.2rem 0.55rem', borderRadius: 4,
                background: 'rgba(200,80,30,0.08)',
                border: '1px solid rgba(200,80,30,0.18)',
                color: 'rgba(200,80,30,0.85)',
              }}>
                🔥 burned
              </span>
            )}
          </div>
        </div>

        {/* ── Code block ── */}
        <div className="field" style={{ marginTop: '1.5rem' }}>
          <div className="label-row" style={{ marginBottom: '0.5rem' }}>
            <label className="label">Content</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontFamily: 'monospace', fontSize: '.7rem', color: 'var(--t2)', opacity: 0.6 }}>
                {lineCount} lines · {charCount >= 1000 ? `${(charCount / 1000).toFixed(1)}k` : charCount} chars
              </span>
              <button
                className={`btn-copy ${copied ? 'btn-copy--done' : ''}`}
                onClick={copy}
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
          </div>
          <textarea
            className="input textarea"
            rows={dynamicRows}
            value={paste.content}
            readOnly
            spellCheck={false}
            style={{ fontFamily: 'monospace', resize: 'vertical', fontSize: '.82rem', lineHeight: 1.65 }}
          />
        </div>

        {/* ── Stats row ── */}
        <div style={{
          display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
          marginTop: '1.25rem', paddingTop: '1.25rem',
          borderTop: '1px solid var(--bdr)',
        }}>
          {stats.map(({ label, val }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
              <span style={{ fontSize: '.62rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--t2)', opacity: 0.5 }}>
                {label}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '.78rem', color: 'var(--t2)' }}>
                {val}
              </span>
            </div>
          ))}
        </div>

        {/* ── CTA ── */}
        <button
          className="btn-primary"
          style={{ marginTop: '1.5rem' }}
          onClick={() => window.location.href = '/'}
        >
          ← Create your own paste
        </button>

      </div>
    </>
  );
}