import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initializeObservability } from './lib/observability';
import './app/globals.css';

initializeObservability();

const root = document.getElementById('root');
if (!root) throw new Error('Application root is missing');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>
);
