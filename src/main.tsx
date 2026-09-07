import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import './index.css';

// Automatically register PWA Service Worker for offline support and caching
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  try {
    registerSW({
      immediate: false,
      onNeedRefresh() {
        console.log('StudyMate Sarkari PWA: New content available.');
      },
      onOfflineReady() {
        console.log('StudyMate Sarkari PWA: Offline ready.');
      },
      onRegisterError(error) {
        console.warn('PWA service worker registration notice:', error);
      },
    });
  } catch (err) {
    console.warn('PWA registration skipped in current environment');
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>,
);

