// src/pages/auth/LoginPage.jsx
import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import AuthLayout from '../../components/layout/AuthLayout';
import LoginForm from '../../components/auth/LoginForm';

/**
 * LoginPage Component
 * 
 * Full login page that combines AuthLayout and LoginForm.
 * Handles navigation and redirects after successful login.
 * 
 * @example
 * <Route path="/login" element={<LoginPage />} />
 */

const LoginPage = () => {
  const { isAuthenticated } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Redirect to dashboard or intended page
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated]);

  /**
   * Handle successful login
   */
  const handleLoginSuccess = () => {
    // Get redirect URL from query params if exists
    const urlParams = new URLSearchParams(window.location.search);
    const redirectTo = urlParams.get('redirect') || '/dashboard';
    
    // Redirect to dashboard or intended page
    window.location.href = redirectTo;
  };

  /**
   * Handle forgot password click
   */
  const handleForgotPassword = () => {
    window.location.href = '/forgot-password';
  };

  return (
    <AuthLayout
      title="Sign In"
      subtitle="Welcome back to your POS system"
    >
      <LoginForm
        onSuccess={handleLoginSuccess}
        onForgotPassword={handleForgotPassword}
      />
    </AuthLayout>
  );
};

LoginPage.displayName = 'LoginPage';

export default LoginPage;

/**
 * Example Usage:
 * 
 * // In your routing setup (React Router)
 * import { BrowserRouter, Routes, Route } from 'react-router-dom';
 * import LoginPage from '@/pages/auth/LoginPage';
 * import RegisterPage from '@/pages/auth/RegisterPage';
 * import DashboardPage from '@/pages/DashboardPage';
 * import ProtectedRoute from '@/components/ProtectedRoute';
 * 
 * function App() {
 *   return (
 *     <BrowserRouter>
 *       <Routes>
//  *         {/* Public routes */
//  *         <Route path="/login" element={<LoginPage />} />
//  *         <Route path="/register" element={<RegisterPage />} />
//  *         <Route path="/forgot-password" element={<ForgotPasswordPage />} />
//  *         
//  *         {/* Protected routes */}
//  *         <Route
//  *           path="/dashboard"
//  *           element={
//  *             <ProtectedRoute>
//  *               <DashboardPage />
//  *             </ProtectedRoute>
//  *           }
//  *         />
//  *       </Routes>
//  *     </BrowserRouter>
//  *   );
//  * }
//  * 
//  * // With redirect parameter
//  * // User tries to access /products without authentication
//  * // They get redirected to /login?redirect=/products
//  * // After login, they return to /products
//  * 
//  * // ProtectedRoute component example:
//  * function ProtectedRoute({ children, requiredRole }) {
//  *   const { isAuthenticated, hasRole, loading } = useAuth();
//  * 
//  *   if (loading) {
//  *     return <Spinner fullScreen />;
//  *   }
//  * 
//  *   if (!isAuthenticated) {
//  *     const currentPath = window.location.pathname;
//  *     window.location.href = `/login?redirect=${currentPath}`;
//  *     return null;
//  *   }
//  * 
//  *   if (requiredRole && !hasRole(requiredRole)) {
//  *     return <div>Access Denied</div>;
//  *   }
//  * 
//  *   return children;
//  * }
//  * 
//  * // Complete App.jsx setup
//  * import { AuthProvider } from '@/context/AuthContext';
//  * import { ToastProvider } from '@/components/common/Toast';
//  * 
//  * function App() {
//  *   return (
//  *     <AuthProvider>
//  *       <ToastProvider>
//  *         <BrowserRouter>
//  *           <Routes>
//  *             <Route path="/login" element={<LoginPage />} />
//  *             <Route path="/register" element={<RegisterPage />} />
//  *             
//  *             <Route
//  *               path="/dashboard"
//  *               element={
//  *                 <ProtectedRoute>
//  *                   <DashboardPage />
//  *                 </ProtectedRoute>
//  *               }
//  *             />
//  *             
//  *             <Route
//  *               path="/products"
//  *               element={
//  *                 <ProtectedRoute>
//  *                   <ProductsPage />
//  *                 </ProtectedRoute>
//  *               }
//  *             />
//  *             
//  *             <Route
//  *               path="/settings"
//  *               element={
//  *                 <ProtectedRoute requiredRole="admin">
//  *                   <SettingsPage />
//  *                 </ProtectedRoute>
//  *               }
//  *             />
//  *           </Routes>
//  *         </BrowserRouter>
//  *       </ToastProvider>
//  *     </AuthProvider>
//  *   );
//  * }
//  */