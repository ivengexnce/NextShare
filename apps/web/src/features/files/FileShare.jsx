import { useState, useRef } from 'react';
import useStore from '../../store/useStore';
import { filesApi } from './files.api';

const MAX_SIZE = 50 * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 ** 2)  return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

export default function FileShare() {
  const { addToast } = useStore();
  const [dragging, setDragging] = useState(false);
  const [file, setFile]         = useState(null);
  const [progress, setProgress] = useState(0);
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);
  const [copied, setCopied]     = useState(false);
  const [options, setOptions]   = useState({ expiresIn: '', maxDownloads: '' });
  const inputRef = useRef();

  function selectFile(f) {
    if (!f) return;
    if (f.size > MAX_SIZE) { addToast('File too large (max 50 MB)', 'error'); return; }
    setFile(f); setResult(null); setProgress(0);
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
        { expiresIn: options.expiresIn || undefined, maxDownloads: options.maxDownloads || undefined },
        setProgress,
      );
      setResult(data); setFile(null);
      addToast('File uploaded!', 'success');
    } catch (err) {
      addToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(result.shareUrl);
    setCopied(true);
    addToast('Link copied', 'success');
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="tool-card">
      <div className="tool-card-bar">
        <div className="card-dots">
          <div className="card-dot" /><div className="card-dot" /><div className="card-dot" />
        </div>
        <span className="card-tab-label">nextshare — file share</span>
      </div>

      <div className="tool-body">
        <div className="tool-header">
          <div className="tool-tag">FILE SHARING</div>
          <h2 className="tool-title">Share any file</h2>
          <p className="tool-desc">Drag, drop, done. Get a direct download link. Files auto-expire so you're never hoarding junk. Up to 50 MB.</p>
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
              <span className="dropzone-icon">📄</span>
              <span className="file-name">{file.name}</span>
              <span className="file-size">{formatBytes(file.size)}</span>
            </div>
          ) : (
            <div className="dropzone-hint">
              <span className="dropzone-icon">📎</span>
              <strong>Drop a file or <span>browse</span></strong>
              <span style={{ color: 'var(--t3)', fontSize: '12px' }}>Files expire automatically · no account needed</span>
            </div>
          )}
        </div>

        {/* Options */}
        {file && !loading && (
          <div className="field-row" style={{ marginTop: '16px' }}>
            <div className="field">
              <label className="label">Expires in (days)</label>
              <input className="input" type="number" min={1} max={30} placeholder="Never"
                value={options.expiresIn}
                onChange={(e) => setOptions((o) => ({ ...o, expiresIn: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">Max downloads</label>
              <input className="input" type="number" min={1} placeholder="Unlimited"
                value={options.maxDownloads}
                onChange={(e) => setOptions((o) => ({ ...o, maxDownloads: e.target.value }))} />
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
          <button className="btn-primary" onClick={handleUpload} style={{ marginTop: '16px' }}>
            Upload &amp; get link →
          </button>
        )}

        {/* Result */}
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
                <div className="result-stat-label">File</div>
                <div className="result-stat-val" style={{ fontSize: '.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {result.originalName?.split('.').pop()?.toUpperCase() || 'FILE'}
                </div>
              </div>
              <div className="result-stat">
                <div className="result-stat-label">Size</div>
                <div className="result-stat-val">{formatBytes(result.size)}</div>
              </div>
              <div className="result-stat">
                <div className="result-stat-label">Status</div>
                <div className="result-stat-val result-stat-val--green">Active</div>
              </div>
            </div>
            <a className="btn-ghost" href={result.shareUrl} target="_blank" rel="noreferrer" style={{ alignSelf: 'flex-start' }}>
              Download ↗
            </a>
          </div>
        )}
      </div>
    </div>
  );
}