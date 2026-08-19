import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import './index.css';

/* Last-resort boundary. The scene has its own so a GPU failure only costs the
   3D view; this one exists so no unexpected throw can leave a blank page. */
const AppCrashed = (
  <div className="flex h-screen w-screen items-center justify-center bg-hull-950 p-8">
    <div className="panel max-w-sm px-6 py-5 text-center">
      <p className="etch">System fault</p>
      <p className="mt-3 text-sm text-[#dde4ea]/70">
        The interface failed to start. Reloading usually clears it.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="mt-4 rounded border border-ice/30 bg-ice/10 px-4 py-2 text-xs text-ice transition-colors hover:bg-ice/20"
      >
        Reload
      </button>
    </div>
  </div>
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary label="App" fallback={AppCrashed}>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
