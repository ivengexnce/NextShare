import { useState } from 'react';
import useStore from '../../store/useStore';
import { urlApi } from './url.api';
import { offlineDB } from '../../store/offlineDB';

const DEFAULT = { originalUrl: '', customCode: '', expiresIn: '' };

export default function UrlShortener() {
  const { isOnline, addToast } = useStore();
  const [form, setForm] = useState(DEFAULT);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.originalUrl) return;
    setLoading(true);
    try {
      if (!isOnline) {
        await offlineDB.queueUrl({ originalUrl: form.originalUrl, title: '' });
        addToast('Saved offline — will shorten when reconnected', 'warning');
        setForm(DEFAULT);
        return;
      }
      const payload = { originalUrl: form.originalUrl };
      if (form.customCode) payload.customCode = form.customCode;
      if (form.expiresIn)  payload.expiresIn  = Number(form.expiresIn);

      const data = await urlApi.shorten(payload);
      setResult(data);
      setForm(DEFAULT);
      addToast('Short link created!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text);
    addToast('Copied to clipboard', 'success');
  }

  return (
    <div className="tool-card">
      <h2 className="tool-title">URL shortener</h2>
      <p className="tool-desc">Shorten any link. Optionally set a custom code and expiry.</p>

      <form onSubmit={handleSubmit} className="form-stack">
        <div className="field">
          <label className="label">URL <span className="required">*</span></label>
          <input
            className="input"
            type="url"
            placeholder="https://example.com/very/long/path"
            value={form.originalUrl}
            onChange={set('originalUrl')}
            required
          />
        </div>

        <div className="field-row">
          <div className="field">
            <label className="label">Custom code</label>
            <input
              className="input"
              placeholder="my-link"
              value={form.customCode}
              onChange={set('customCode')}
              maxLength={20}
            />
          </div>
          <div className="field">
            <label className="label">Expires in (days)</label>
            <input
              className="input"
              type="number"
              min={1}
              max={365}
              placeholder="Never"
              value={form.expiresIn}
              onChange={set('expiresIn')}
            />
          </div>
        </div>

        <button className="btn-primary" type="submit" disabled={loading}>
          {loading ? 'Shortening…' : isOnline ? 'Shorten' : 'Save offline'}
        </button>
      </form>

      {result && (
        <div className="result-card">
          <div className="result-row">
            <span className="result-url">{result.shortUrl}</span>
            <button className="btn-ghost" onClick={() => copy(result.shortUrl)}>Copy</button>
          </div>
          <div className="result-meta">
            {result.expiresAt
              ? `Expires ${new Date(result.expiresAt).toLocaleDateString()}`
              : 'No expiry'}{' '}
            · <a href={`/api/urls/${result.shortCode}/stats`} target="_blank" rel="noreferrer">Stats</a>
          </div>
        </div>
      )}
    </div>
  );
}
