import { useEffect } from 'react';
import useStore from './store/useStore';
import { useOffline } from './shared/hooks/useOffline';
import UrlShortener from './features/url/UrlShortener';
import FileShare from './features/files/FileShare';
import TextShare from './features/text/TextShare';

const TABS = [
  { id: 'url',   label: '🔗 URL shortener' },
  { id: 'files', label: '📁 File sharing'  },
  { id: 'text',  label: '📝 Text paste'    },
];

const COMPONENTS = { url: UrlShortener, files: FileShare, text: TextShare };

export default function App() {
  useOffline();

  const { activeTab, setActiveTab, isOnline, toasts, removeToast } = useStore();
  const ActiveComponent = COMPONENTS[activeTab];

  return (
    <div className="app">

      {/* ── Offline Banner ───────────────────────────────────────────────── */}
      {!isOnline && (
        <div className="offline-banner">
          ◉ You're offline — items will sync automatically when reconnected
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-inner">
          <a href="/" className="logo">
            <span className="logo-text">Next<span>Share</span></span>
          </a>

          <div className={`status-badge ${isOnline ? 'status-badge--online' : 'status-badge--offline'}`}>
            <span className="status-dot" />
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      </header>

      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
      <nav className="tab-bar">
        <div className="tab-bar-inner">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${activeTab === t.id ? 'tab--active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </nav>

      {/* ── Main ────────────────────────────────────────────────────────── */}
      <main className="main">
        <ActiveComponent />
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '20px 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        maxWidth: '760px',
        margin: '0 auto',
        width: '100%',
      }}>
        <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: '0.9rem', color: 'var(--off-white)' }}>
          Next<span style={{ color: 'var(--accent)' }}>Share</span>
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
          Built by{' '}
          <a href="https://github.com/ivengence" target="_blank" rel="noreferrer"
            style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
            Meet Maru
          </a>
          {' '}· MIT License
        </span>
      </footer>

      {/* ── Toast Stack ─────────────────────────────────────────────────── */}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span>{t.message}</span>
            <button className="toast-close" onClick={() => removeToast(t.id)} aria-label="Dismiss">✕</button>
          </div>
        ))}
      </div>

    </div>
  );
}