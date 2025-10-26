import { AuthProvider } from '../src/context/AuthContext';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from '../src/pages/auth/LoginPage.jsx';

   import { ToastProvider } from '../src/components/common/Toast';
    // import HomePage from '../src/pages/dashboard/HomePage.jsx';
    import DashboardPage from '../src/pages/dashboard/DashboardPage.jsx';
   export default function AuthTemp() {
     return (
       <AuthProvider>
         <ToastProvider>
           <BrowserRouter>
             <Routes>
               <Route path="/login" element={<LoginPage />} />
              
               <Route path="/home" element={<DashboardPage />} />
               <Route path="/" element={<DashboardPage />} />


              </Routes>
             </BrowserRouter>
            </ToastProvider>
         </AuthProvider>
       );
     }
   

 
   
//   import TopProducts from '../src/components/dashboard/TopProducts';
//   import LowStockWidget from '../src/components/dashboard/LowStockWidget';
//   import QuickActions from '../src/components/dashboard/QuickActions';
//   import { ShoppingCart, RefreshCw, XCircle } from 'lucide-react';
// import DashboardPage from './pages/dashboard/DashboardPage';
  // export default function AuthTemp() {
  //   return (
  //     <DashboardPage />
  //   );
  // }