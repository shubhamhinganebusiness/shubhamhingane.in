import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './components/LanguageContext.tsx';
import { ThemeProvider } from './components/ThemeContext.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';

// Auto-redirect direct path access to hash route for HashRouter (only if pathname is non-root)
if (typeof window !== 'undefined') {
  try {
    const pathname = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;
    if (pathname && pathname !== '/' && pathname !== '/index.html' && !hash) {
      window.history.replaceState(null, '', `/#${pathname}${search}`);
    }
  } catch (err) {
    console.warn('Navigation redirect skipped:', err);
  }
}

const rootEl = document.getElementById('root');
if (rootEl) {
  try {
    createRoot(rootEl).render(
      <StrictMode>
        <ErrorBoundary>
          <ThemeProvider>
            <LanguageProvider>
              <App />
            </LanguageProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </StrictMode>,
    );
  } catch (error) {
    console.error("App rendering failed:", error);
    rootEl.innerHTML = `
      <div style="padding: 24px; font-family: system-ui, sans-serif; color: #ff014f; text-align: center;">
        <h2 style="font-size: 1.5rem; font-weight: bold; margin-bottom: 8px;">Something went wrong</h2>
        <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 16px;">Please refresh the page to reload the application.</p>
        <button onclick="window.location.reload()" style="padding: 10px 20px; background: #ff014f; color: white; border: none; border-radius: 8px; font-weight: bold; cursor: pointer;">
          Refresh
        </button>
      </div>
    `;
  }
}
