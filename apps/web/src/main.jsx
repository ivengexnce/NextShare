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

const pasteMatch = window.location.pathname.match(/^\/paste\/([^/]+)$/);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {pasteMatch ? <PasteViewer code={pasteMatch[1]} /> : <App />}
  </StrictMode>,
);