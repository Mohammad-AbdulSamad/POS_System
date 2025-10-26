import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ToastProvider } from './components/common/Toast.jsx';
import Temp from './Temp.jsx';

import MainTemp from '../MainTemp.jsx';


const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <ToastProvider position="top-right" maxToasts={5}>
      
      <StrictMode>
        <MainTemp />
      </StrictMode>
    </ToastProvider>
  );
}
