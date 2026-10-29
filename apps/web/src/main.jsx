import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App.jsx';
import PasteViewer from './features/text/PasteViewer.jsx';

const redirectMatch = window.location.pathname.match(/^\/(?:s|r)\/([^/]+)$/);
if (redirectMatch) {
  const code = redirectMatch[1];
  window.location.replace(`https://nextshare-0cy3.onrender.com/${code}`);
}

const fileMatch = window.location.pathname.match(/^\/(?:f|d)\/([^/]+)$/);
if (fileMatch) {
  const code = fileMatch[1];
  window.location.replace(`https://nextshare-0cy3.onrender.com/api/files/${code}/download`);
}

const pasteMatch = window.location.pathname.match(/^\/(?:paste|p)\/([^/]+)$/);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {pasteMatch ? <PasteViewer code={pasteMatch[1]} /> : <App />}
  </StrictMode>,
);