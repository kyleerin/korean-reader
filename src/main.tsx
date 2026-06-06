import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { DeepLSettingsProvider } from './translation/DeepLSettings';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DeepLSettingsProvider>
      <App />
    </DeepLSettingsProvider>
  </StrictMode>,
);
