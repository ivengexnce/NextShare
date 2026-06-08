import useStore from './store/useStore';
import { useOffline } from './shared/hooks/useOffline';
import UrlShortener from './features/url/UrlShortener';
import FileShare from './features/files/FileShare';
import TextShare from './features/text/TextShare';

const TABS = [
  { id: 'url',   label: 'URL Shortener' },
  { id: 'files', label: 'File Sharing'  },
  { id: 'text',  label: 'Code Paste'    },
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
          // offline mode — items queue locally and sync on reconnect
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header className="header">
        <div className="header-inner">
          <a href="/" className="logo" style={{ textDecoration: 'none' }}>
            <div className="logo-mark">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7 2l5 5-5 5" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
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
              <span className="tab-dot" />
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
      <div style={{ borderTop: '1px solid var(--bdr)' }}>
        <footer className="footer">
          <div>
            <div className="footer-brand">Next<span>Share</span></div>
            <div className="footer-credit">
              Built by{' '}
              <a href="https://github.com/ivengence" target="_blank" rel="noreferrer">Meet Maru</a>
              {' '}· MIT License
            </div>
          </div>
          <div className="footer-links">
            <a href="https://github.com/ivengence" target="_blank" rel="noreferrer">GitHub</a>
            <a href="https://linkedin.com/in/meetmaru149" target="_blank" rel="noreferrer">LinkedIn</a>
          </div>
        </footer>
      </div>

      {/* ── Toast Stack ─────────────────────────────────────────────────── */}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.type}`}>
            <span>{t.message}</span>
            <button className="toast-close" onClick={() => removeToast(t.id)}>✕</button>
          </div>
        ))}
      </div>

    </div>
  );
}