import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/common/Toast.jsx';

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ToastProvider position="top-right" maxToasts={5}>
      <StrictMode>
        <App />
      </StrictMode>
    </ToastProvider>
  );
}
