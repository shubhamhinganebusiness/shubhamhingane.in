// Trigger workspace file synchronization refresh
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { LanguageProvider } from './components/LanguageContext.tsx';
import { ThemeProvider } from './components/ThemeContext.tsx';

// Auto-redirect direct path access to hash route for HashRouter
if (typeof window !== 'undefined') {
  const pathname = window.location.pathname;
  const search = window.location.search;
  const hash = window.location.hash;
  if (pathname && pathname !== '/' && pathname !== '/index.html' && !hash) {
    window.location.replace(`/#${pathname}${search}`);
  }
}

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ThemeProvider>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </ThemeProvider>
    </StrictMode>,
  );
} catch (error) {
  console.error("App rendering failed:", error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; color: #ff014f;">
      <h1>Something went wrong</h1>
      <pre>${error instanceof Error ? error.message : "Initialization error"}</pre>
    </div>
  `;
}
