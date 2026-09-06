import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import './index.css';

// Automatically register PWA Service Worker for offline support and caching
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('StudyMate Sarkari PWA: New content available.');
  },
  onOfflineReady() {
    console.log('StudyMate Sarkari PWA: Offline ready.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>,
);

