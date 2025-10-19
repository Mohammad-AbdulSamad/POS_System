import { AuthProvider } from '../src/context/AuthContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../src/pages/auth/LoginPage.jsx';

   import { ToastProvider } from '../src/components/common/Toast';
   
   export default function AuthTemp() {
     return (
       <AuthProvider>
         <ToastProvider>
           <BrowserRouter>
             <Routes>
               <Route path="/" element={<LoginPage />} />
               

              
                </Routes>
             </BrowserRouter>
            </ToastProvider>
         </AuthProvider>
       );
     }
   