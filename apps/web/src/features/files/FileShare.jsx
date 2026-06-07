import { useState, useRef } from 'react';
import useStore from '../../store/useStore';
import { filesApi } from './files.api';

const MAX_SIZE = 50 * 1024 * 1024; // 50 MB

function formatBytes(bytes) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export default function FileShare() {
  const { addToast } = useStore();
  const [dragging, setDragging]   = useState(false);
  const [file, setFile]           = useState(null);
  const [progress, setProgress]   = useState(0);
  const [loading, setLoading]     = useState(false);
  const [result, setResult]       = useState(null);
  const [options, setOptions]     = useState({ expiresIn: '', maxDownloads: '' });
  const inputRef = useRef();

  function selectFile(f) {
    if (!f) return;
    if (f.size > MAX_SIZE) { addToast('File too large (max 50 MB)', 'error'); return; }
    setFile(f);
    setResult(null);
    setProgress(0);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    selectFile(e.dataTransfer.files[0]);
  }

  async function handleUpload() {
    if (!file) return;
    setLoading(true);
    try {
      const data = await filesApi.upload(
        file,
        {
          expiresIn:    options.expiresIn    || undefined,
          maxDownloads: options.maxDownloads || undefined,
        },
        setProgress,
      );
      setResult(data);
      setFile(null);
      addToast('File uploaded!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function copy(text) {
    navigator.clipboard.writeText(text);
    addToast('Link copied', 'success');
  }

  return (
    <div className="tool-card">
      <div className="tool-header">
        <div className="tool-tag">// FILE SHARING</div>
        <h2 className="tool-title">Share any file</h2>
        <p className="tool-desc">Drag, drop, done. Get a secure link in seconds. Supports up to 50 MB with optional expiry and download limits.</p>
      </div>

      {/* Drop Zone */}
      <div
        className={`dropzone ${dragging ? 'dropzone--active' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current.click()}
      >
        <input
          ref={inputRef} type="file" style={{ display: 'none' }}
          onChange={(e) => selectFile(e.target.files[0])}
        />
        {file ? (
          <div className="file-selected">
            <span className="file-name">📄 {file.name}</span>
            <span className="file-size">{formatBytes(file.size)}</span>
          </div>
        ) : (
          <div className="dropzone-hint">
            <span className="dropzone-icon">↑</span>
            <strong>Drop a file or click to browse</strong>
            <span>Max 50 MB · Any file type</span>
          </div>
        )}
      </div>

      {/* Options */}
      {file && !loading && (
        <div className="field-row" style={{ marginTop: '16px' }}>
          <div className="field">
            <label className="label">Expires in (days)</label>
            <input
              className="input" type="number" min={1} max={30} placeholder="Never"
              value={options.expiresIn}
              onChange={(e) => setOptions((o) => ({ ...o, expiresIn: e.target.value }))}
            />
          </div>
          <div className="field">
            <label className="label">Max downloads</label>
            <input
              className="input" type="number" min={1} placeholder="Unlimited"
              value={options.maxDownloads}
              onChange={(e) => setOptions((o) => ({ ...o, maxDownloads: e.target.value }))}
            />
          </div>
        </div>
      )}

      {/* Progress */}
      {loading && (
        <div className="progress-wrap" style={{ marginTop: '16px' }}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
          <span className="progress-label">Uploading… {progress}%</span>
        </div>
      )}

      {file && !loading && (
        <button
          className="btn-primary"
          onClick={handleUpload}
          style={{ marginTop: '16px' }}
        >
          Upload &amp; get link →
        </button>
      )}

      {/* Result */}
      {result && (
        <div className="result-card">
          <div className="result-row">
            <span className="result-url">{result.shareUrl}</span>
            <button className="btn-ghost" onClick={() => copy(result.shareUrl)}>Copy</button>
          </div>
          <div className="result-meta">
            {result.originalName} · {formatBytes(result.size)}
            {result.expiresAt    ? ` · Expires ${new Date(result.expiresAt).toLocaleDateString()}` : ''}
            {result.maxDownloads ? ` · ${result.maxDownloads} download(s) max` : ''}
          </div>
          <a className="btn-ghost" href={result.shareUrl} target="_blank" rel="noreferrer">
            Download ↗
          </a>
        </div>
      )}
    </div>
  );
}