import { useState } from 'react';
import useStore from '../../store/useStore';
import { textApi } from './text.api';
import { offlineDB } from '../../store/offlineDB';

const LANGUAGES = [
  'plaintext','javascript','typescript','python','java','c','cpp','csharp',
  'go','rust','php','ruby','swift','kotlin','html','css','json','yaml',
  'toml','markdown','sql','bash','dockerfile',
];
const EXPIRY_OPTS = ['10m','1h','24h','7d','30d','never'];
const DEFAULT = { content: '', language: 'javascript', title: '', expiresIn: 'never', burnAfterRead: false };
const MAX = 500_000;

export default function TextShare() {
  const { isOnline, addToast } = useStore();
  const [form, setForm]         = useState(DEFAULT);
  const [result, setResult]     = useState(null);
  const [loading, setLoading]   = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [copied, setCopied]     = useState(false);

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: val }));
    if (k === 'content') setCharCount(e.target.value.length);
  };

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.content.trim()) return;
    setLoading(true);
    try {
      if (!isOnline) {
        await offlineDB.queuePaste(form);
        addToast('Paste saved offline — will upload when reconnected', 'warning');
        setForm(DEFAULT); setCharCount(0);
        return;
      }
      const data = await textApi.create(form);
      await offlineDB.cachePaste({ ...data, content: form.content, language: form.language });
      setResult(data);
      setForm(DEFAULT); setCharCount(0);
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

  const pct = charCount / MAX;

  return (
    <div className="tool-card">
      <div className="tool-card-bar">
        <div className="card-dots">
          <div className="card-dot" /><div className="card-dot" /><div className="card-dot" />
        </div>
        <span className="card-tab-label">nextshare — code paste</span>
      </div>

      <div className="tool-body">
        <div className="tool-header">
          <div className="tool-tag">CODE PASTE</div>
          <h2 className="tool-title">Share code or text</h2>
          <p className="tool-desc">Syntax highlighting, burn-after-read, and offline support. Fifteen+ languages out of the box.</p>
        </div>

        <form onSubmit={handleSubmit} className="form-stack">
          <div className="field">
            <label className="label">Title</label>
            <input
              className="input"
              placeholder="Optional title…"
              value={form.title}
              onChange={set('title')}
              maxLength={255}
            />
          </div>

          <div className="field">
            <div className="label-row">
              <label className="label">Content <span className="required">*</span></label>
              <span className={`char-count ${pct > 0.9 ? 'char-count--warn' : ''}`}>
                {charCount.toLocaleString()} / {(MAX / 1000).toFixed(0)}k
              </span>
            </div>
            <textarea
              className="input textarea"
              placeholder={`// paste your code here…\nconst greet = (name) => \`Hello, \${name}!\`;`}
              rows={10}
              value={form.content}
              onChange={set('content')}
              maxLength={MAX}
              required
            />
          </div>

          <div className="field-row">
            <div className="field">
              <label className="label">Language</label>
              <select className="input" value={form.language} onChange={set('language')}>
                {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div className="field">
              <label className="label">Expires</label>
              <select className="input" value={form.expiresIn} onChange={set('expiresIn')}>
                {EXPIRY_OPTS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </div>
          </div>

          <label className="checkbox-label">
            <input type="checkbox" checked={form.burnAfterRead} onChange={set('burnAfterRead')} />
            <span>Burn after read — destroy on first view</span>
          </label>

          <button className="btn-primary" type="submit" disabled={loading}>
            {loading ? 'Creating…' : isOnline ? 'Create paste →' : 'Save offline'}
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
              <div className="result-stat">
                <div className="result-stat-label">Language</div>
                <div className="result-stat-val" style={{ fontSize: '.8rem' }}>{result.language}</div>
              </div>
              <div className="result-stat">
                <div className="result-stat-label">Expires</div>
                <div className="result-stat-val">
                  {result.expiresAt ? `${Math.ceil((new Date(result.expiresAt) - Date.now()) / 86400000)}d` : 'Never'}
                </div>
              </div>
              <div className="result-stat">
                <div className="result-stat-label">Status</div>
                <div className={`result-stat-val ${result.burnAfterRead ? '' : 'result-stat-val--green'}`}>
                  {result.burnAfterRead ? '🔥 Burn' : 'Active'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}