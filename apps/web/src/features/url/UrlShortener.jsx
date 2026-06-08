import { useState, useEffect } from 'react';
import useStore from '../../store/useStore';
import { urlApi } from './url.api';
import { offlineDB } from '../../store/offlineDB';

const DEFAULT = { originalUrl: '', customCode: '', expiresIn: '' };
const HISTORY_KEY = 'nextshare_url_history';
const MAX_HISTORY = 20;

function formatExpiry(expiresAt) {
  if (!expiresAt) return 'Never';
  const days = Math.ceil((new Date(expiresAt) - Date.now()) / 86400000);
  if (days <= 0) return 'Expired';
  return `${days}d`;
}

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); }
  catch { return []; }
}

function saveHistory(list) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)));
}

export default function UrlShortener() {
  const { isOnline, addToast } = useStore();
  const [form, setForm]         = useState(DEFAULT);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory]   = useState(loadHistory);
  const [stats, setStats]       = useState({});      // { [shortCode]: statsData }
  const [loadingStats, setLoadingStats] = useState({});

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.originalUrl) return;
    setLoading(true); setResult(null);
    try {
      if (!isOnline) {
        await offlineDB.queueUrl({ originalUrl: form.originalUrl, title: '' });
        addToast('Saved offline — will shorten when reconnected', 'warning');
        setForm(DEFAULT); return;
      }
      const payload = { originalUrl: form.originalUrl };
      if (form.customCode) payload.customCode = form.customCode;
      if (form.expiresIn)  payload.expiresIn  = Number(form.expiresIn);

      const data = await urlApi.shorten(payload);
      setResult(data);

      // Save to local history
      const entry = {
        shortCode: data.shortCode,
        shortUrl:  data.shortUrl,
        originalUrl: form.originalUrl,
        expiresAt: data.expiresAt || null,
        createdAt: new Date().toISOString(),
      };
      const updated = [entry, ...history.filter(h => h.shortCode !== data.shortCode)];
      setHistory(updated);
      saveHistory(updated);

      setForm(DEFAULT);
      addToast('Short link created!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats(shortCode) {
    if (stats[shortCode] || loadingStats[shortCode]) return;
    setLoadingStats(s => ({ ...s, [shortCode]: true }));
    try {
      const data = await urlApi.getStats(shortCode);
      setStats(s => ({ ...s, [shortCode]: data }));
    } catch {
      setStats(s => ({ ...s, [shortCode]: { error: true } }));
    } finally {
      setLoadingStats(s => ({ ...s, [shortCode]: false }));
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast('Copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  }

  function copyHistoryItem(url) {
    navigator.clipboard.writeText(url);
    addToast('Copied to clipboard', 'success');
  }

  function clearHistory() {
    setHistory([]);
    setStats({});
    saveHistory([]);
    addToast('History cleared', 'success');
  }

  return (
    <div className="tool-card">
      {/* Browser chrome bar */}
      <div className="tool-card-bar">
        <div className="card-dots">
          <div className="card-dot" /><div className="card-dot" /><div className="card-dot" />
        </div>
        <span className="card-tab-label">nextshare — url shortener</span>
      </div>

      <div className="tool-body">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div className="tool-header" style={{ marginBottom: 0 }}>
            <div className="tool-tag">URL SHORTENER</div>
            <h2 className="tool-title">Shorten any link</h2>
            <p className="tool-desc">Turn long URLs into clean short links. Custom code, expiry, click stats.</p>
          </div>
          {history.length > 0 && (
            <button
              className="btn-ghost"
              onClick={() => setShowHistory(h => !h)}
              style={{ flexShrink: 0, marginTop: '4px' }}
            >
              {showHistory ? 'Hide history' : `History (${history.length})`}
            </button>
          )}
        </div>

        {/* History panel */}
        {showHistory && (
          <div style={{
            marginBottom: '24px',
            border: '1px solid var(--bdr)',
            borderRadius: 'var(--r-lg)',
            overflow: 'hidden',
          }}>
            {/* History header */}
            <div style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--bdr)',
              background: 'rgba(0,0,0,.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--t3)', letterSpacing: '.08em' }}>
                RECENT LINKS
              </span>
              <button
                onClick={clearHistory}
                style={{ fontSize: '11px', color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)' }}
              >
                Clear all
              </button>
            </div>

            {/* History list */}
            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
              {history.map((item, i) => (
                <div key={item.shortCode} style={{
                  padding: '14px 16px',
                  borderBottom: i < history.length - 1 ? '1px solid var(--bdr)' : 'none',
                  background: 'var(--bg-1)',
                }}>
                  {/* Short URL row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '13px',
                      color: 'var(--green)', flex: 1,
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.shortUrl}
                    </span>
                    <button className="btn-copy" onClick={() => copyHistoryItem(item.shortUrl)}>Copy</button>
                    <button
                      className="btn-ghost"
                      style={{ fontSize: '12px', padding: '5px 12px' }}
                      onClick={() => fetchStats(item.shortCode)}
                      disabled={loadingStats[item.shortCode]}
                    >
                      {loadingStats[item.shortCode] ? '…' : 'Stats'}
                    </button>
                  </div>

                  {/* Original URL */}
                  <div style={{
                    fontSize: '12px', color: 'var(--t3)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    marginBottom: stats[item.shortCode] ? '10px' : '0',
                  }}>
                    {item.originalUrl}
                  </div>

                  {/* Stats row — shown after fetch */}
                  {stats[item.shortCode] && !stats[item.shortCode].error && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '6px' }}>
                      <div className="result-stat">
                        <div className="result-stat-label">Clicks</div>
                        <div className="result-stat-val">{stats[item.shortCode].clicks ?? 0}</div>
                      </div>
                      <div className="result-stat">
                        <div className="result-stat-label">Expires</div>
                        <div className="result-stat-val">{formatExpiry(item.expiresAt)}</div>
                      </div>
                      <div className="result-stat">
                        <div className="result-stat-label">Status</div>
                        <div className="result-stat-val result-stat-val--green">Active</div>
                      </div>
                    </div>
                  )}
                  {stats[item.shortCode]?.error && (
                    <div style={{ fontSize: '11px', color: 'var(--rose)', fontFamily: 'var(--font-mono)' }}>
                      // could not load stats
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="form-stack">
          <div className="field">
            <label className="label">URL <span className="required">*</span></label>
            <input
              className="input" type="url"
              placeholder="https://example.com/very/long/path..."
              value={form.originalUrl} onChange={set('originalUrl')}
              required autoFocus
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="label">Custom code</label>
              <input className="input" placeholder="my-link"
                value={form.customCode} onChange={set('customCode')} maxLength={20} />
            </div>
            <div className="field">
              <label className="label">Expires in (days)</label>
              <input className="input" type="number" min={1} max={365} placeholder="Never"
                value={form.expiresIn} onChange={set('expiresIn')} />
            </div>
          </div>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Shortening…' : isOnline ? 'Shorten →' : 'Save offline'}
          </button>
        </form>

        {/* Latest result */}
        {result && (
          <div className="result-card">
            <div className="result-row">
              <span className="result-url">{result.shortUrl}</span>
              <button className={`btn-copy ${copied ? 'btn-copy--done' : ''}`} onClick={() => copy(result.shortUrl)}>
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
            <div className="result-stats">
              <div className="result-stat">
                <div className="result-stat-label">Clicks</div>
                <div className="result-stat-val">0</div>
              </div>
              <div className="result-stat">
                <div className="result-stat-label">Expires</div>
                <div className="result-stat-val">{formatExpiry(result.expiresAt)}</div>
              </div>
              <div className="result-stat">
                <div className="result-stat-label">Status</div>
                <div className="result-stat-val result-stat-val--green">Active</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}