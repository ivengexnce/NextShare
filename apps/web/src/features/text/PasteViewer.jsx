import { useEffect, useState } from 'react';
import { textApi } from './text.api';

export default function PasteViewer({ code }) {
  const [paste, setPaste] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    const prev = meta?.content || 'index, follow';
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow';
    textApi.get(code).then(setPaste).catch(e => setError(e.message)).finally(() => setLoading(false));
    return () => { if (meta) meta.content = prev; };
  }, [code]);

  const copy = () => {
    if (!paste) return;
    navigator.clipboard.writeText(paste.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const daysLeft = (exp) => {
    if (!exp) return 'never expires';
    const d = Math.ceil((new Date(exp) - Date.now()) / 864e5);
    return d <= 0 ? 'Expired' : `${d}d left`;
  };

  const wrap = (title, children) => (
    <div style={{ display: 'flex', justifyContent: 'center', minHeight: '100vh', padding: '40px 24px' }}>
      <div className="tool-card" style={{ width: '100%', maxWidth: '680px' }}>
        <div className="tool-card-bar">
          <div className="card-dots"><div className="card-dot" /><div className="card-dot" /><div className="card-dot" /></div>
          <span className="card-tab-label">nextshare — {title}</span>
        </div>
        <div className="tool-body">{children}</div>
      </div>
    </div>
  );

  if (loading) return wrap('loading…', (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '2.5rem' }}>
      <div style={{ width: 18, height: 18, border: '2px solid var(--bdr)', borderTopColor: 'var(--t2)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <span style={{ color: 'var(--t2)', fontSize: '.85rem' }}>Fetching paste…</span>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  ));

  if (error) return wrap('error', (
    <>
      <div className="tool-header">
        <div className="tool-tag">ERROR</div>
        <h2 className="tool-title">Paste unavailable</h2>
        <p className="tool-desc" style={{ fontFamily: 'monospace', fontSize: '.82rem' }}>{error}</p>
      </div>
      <button className="btn-primary" onClick={() => window.location.href = '/'}>← Back to NextShare</button>
    </>
  ));

  const lines = paste.content.split('\n').length;
  const chars = paste.content.length;

  return wrap(paste.title || paste.shortCode, (
    <>
      <div className="tool-header">
        <div className="tool-tag">CODE PASTE</div>
        <h2 className="tool-title" style={{ marginBottom: '0.75rem' }}>{paste.title || 'Untitled paste'}</h2>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="pill-badge">{paste.language}</span>
          <span className="pill-badge">{daysLeft(paste.expiresAt)}</span>
          {paste.burnAfterRead && <span className="pill-badge" style={{ color: 'var(--rose)' }}>🔥 burned</span>}
        </div>
      </div>

      <div className="field" style={{ marginTop: '1.5rem' }}>
        <div className="label-row" style={{ marginBottom: '0.5rem' }}>
          <label className="label">Content</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '.7rem', color: 'var(--t2)', opacity: 0.6 }}>
              {lines} lines · {chars >= 1000 ? `${(chars / 1000).toFixed(1)}k` : chars} chars
            </span>
            <button className={`btn-copy ${copied ? 'btn-copy--done' : ''}`} onClick={copy}>{copied ? 'Copied ✓' : 'Copy'}</button>
          </div>
        </div>
        <textarea
          className="input textarea"
          rows={Math.min(Math.max(lines + 2, 4), 36)}
          value={paste.content} readOnly spellCheck={false}
          style={{ fontFamily: 'monospace', resize: 'vertical', fontSize: '.82rem', lineHeight: 1.65 }}
        />
      </div>

      <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid var(--bdr)' }}>
        <div><div style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--t3)' }}>CODE</div><div style={{ fontFamily: 'monospace', fontSize: '.78rem' }}>{paste.shortCode}</div></div>
        <div><div style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--t3)' }}>VIEWS</div><div style={{ fontFamily: 'monospace', fontSize: '.78rem' }}>{paste.viewCount || 0}</div></div>
        <div><div style={{ fontSize: '.62rem', fontWeight: 700, color: 'var(--t3)' }}>CREATED</div><div style={{ fontFamily: 'monospace', fontSize: '.78rem' }}>{new Date(paste.createdAt).toLocaleDateString()}</div></div>
      </div>

      <button className="btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => window.location.href = '/'}>← Create your own paste</button>
    </>
  ));
}
