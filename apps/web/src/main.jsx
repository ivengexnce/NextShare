import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/index.css';
import App from './App.jsx';
import PasteViewer from './features/text/PasteViewer.jsx';

const pasteMatch = window.location.pathname.match(/^\/paste\/([^/]+)$/);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {pasteMatch ? <PasteViewer code={pasteMatch[1]} /> : <App />}
  </StrictMode>,
);