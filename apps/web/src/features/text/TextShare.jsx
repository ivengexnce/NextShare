import { useState } from 'react';
import useStore from '../../store/useStore';
import { textApi } from './text.api';
import { offlineDB } from '../../store/offlineDB';

const LANGUAGES = ['plaintext','javascript','typescript','python','java','c','cpp','csharp','go','rust','php','ruby','swift','kotlin','html','css','json','yaml','toml','markdown','sql','bash','dockerfile'];
const EXPIRY_OPTS = ['10m','1h','24h','7d','30d','never'];
const DEFAULT = { content: '', language: 'javascript', title: '', expiresIn: 'never', burnMode: 'off', maxViews: 1 };
const MAX = 500_000;

export default function TextShare() {
  const { isOnline, addToast } = useStore();
  const [form, setForm] = useState(DEFAULT);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.content.trim()) return;
    setLoading(true);
    try {
      const payload = {
        content: form.content, language: form.language, title: form.title, expiresIn: form.expiresIn, burnAfterRead: form.burnMode !== 'off',
        ...(form.burnMode === 'after-views' && { maxViews: Number(form.maxViews) }),
      };

      if (!isOnline) {
        await offlineDB.queuePaste(payload);
        addToast('Paste saved offline — will upload when reconnected', 'warning');
        setForm(DEFAULT);
        return;
      }
      const data = await textApi.create(payload);
      const origin = (typeof window !== 'undefined' && window.location.origin) || 'https://nextsharebymeet.vercel.app';
      data.shareUrl = `${origin}/p/${data.shortCode}`;
      await offlineDB.cachePaste({ ...data, content: form.content, language: form.language });
      setResult(data);
      setForm(DEFAULT);
      addToast('Paste created!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(result.shareUrl);
    setCopied(true);
    addToast('Copied', 'success');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="tool-card">
      <div className="tool-card-bar">
        <div className="card-dots"><div className="card-dot" /><div className="card-dot" /><div className="card-dot" /></div>
        <span className="card-tab-label">nextshare — code paste</span>
      </div>

      <div className="tool-body">
        <div className="tool-header">
          <div className="tool-tag">CODE PASTE</div>
          <h2 className="tool-title">Share code or text</h2>
          <p className="tool-desc">Syntax highlighting, burn-after-read, and offline support. 23+ languages out of the box.</p>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="field-row">
            <div className="field">
              <label className="label">Language</label>
              <select className="input" value={form.language} onChange={set('language')}>
                {LANGUAGES.map((l) => (<option key={l} value={l}>{l}</option>))}
              </select>
            </div>
            <div className="field">
              <label className="label">Title (optional)</label>
              <input className="input" placeholder="e.g. auth-middleware.js" value={form.title} onChange={set('title')} maxLength={100} />
            </div>
          </div>

          <div className="field">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label className="label" style={{ margin: 0 }}>Content <span className="required">*</span></label>
              <span style={{ fontSize: '11px', color: form.content.length > MAX ? 'var(--rose)' : 'var(--t3)', fontFamily: 'var(--font-mono)' }}>
                {form.content.length.toLocaleString()} / {MAX.toLocaleString()}
              </span>
            </div>
            <textarea
              className="input paste-textarea" rows={10} placeholder="Paste code or text here..."
              value={form.content} onChange={set('content')} maxLength={MAX} required autoFocus
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="label">Expires in</label>
              <select className="input" value={form.expiresIn} onChange={set('expiresIn')}>
                {EXPIRY_OPTS.map((e) => (<option key={e} value={e}>{e === 'never' ? 'Never' : e}</option>))}
              </select>
            </div>
            <div className="field">
              <label className="label">Burn mode</label>
              <select className="input" value={form.burnMode} onChange={set('burnMode')}>
                <option value="off">No burn</option>
                <option value="on-close">Burn when viewer closes tab</option>
                <option value="after-views">Burn after N views</option>
              </select>
            </div>
          </div>

          {form.burnMode === 'after-views' && (
            <div className="field">
              <label className="label">Max views before destruction</label>
              <input className="input" type="number" min={1} max={100} value={form.maxViews} onChange={set('maxViews')} />
            </div>
          )}

          <button className="btn-primary" type="submit" disabled={loading || !form.content.trim()}>
            {loading ? 'Creating paste…' : isOnline ? 'Create paste →' : 'Save offline'}
          </button>
        </form>

        {result && (
          <div className="result-card">
            <div className="result-row">
              <span className="result-url">{result.shareUrl}</span>
              <button className={`btn-copy ${copied ? 'btn-copy--done' : ''}`} onClick={copy}>
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
            <div className="result-stats">
              <div className="result-stat"><div className="result-stat-label">Lang</div><div className="result-stat-val">{result.language}</div></div>
              <div className="result-stat"><div className="result-stat-label">Burn</div><div className="result-stat-val">{result.burnAfterRead ? '🔥 Active' : 'Off'}</div></div>
              <div className="result-stat"><div className="result-stat-label">Status</div><div className="result-stat-val result-stat-val--green">Active</div></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
