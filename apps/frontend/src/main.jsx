import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Temp from './Temp.jsx';
import { ToastProvider } from './components/common/Toast.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';  // ADD THIS

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ToastProvider position="top-right" maxToasts={5}>
      <AuthProvider>  {/* WRAP WITH AuthProvider */}
        <CartProvider>
          <StrictMode>
            <Temp />
          </StrictMode>
        </CartProvider>
      </AuthProvider>
    </ToastProvider>
  );
}