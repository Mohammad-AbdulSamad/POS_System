import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ToastProvider } from './src/components/common/Toast.jsx';
import { AuthProvider } from './src/context/AuthContext';
import DashboardPage from './src/pages/dashboard/DashboardPage.jsx';
import LoginPage from './src/pages/auth/LoginPage.jsx';
import { useAuth } from './src/hooks/useAuth';
import { useEffect } from 'react';
import Spinner from './src/components/common/Spinner'; // Create this if not exists

// Protected Route Component with location handling
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve the attempted URL for redirect after login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

// Add auth state check wrapper
const AuthStateWrapper = ({ children }) => {
  const {isAuthenticated} = useAuth();


  // Check auth state on mount
  useEffect(() => {
    if (!isAuthenticated) {
      // Optionally, you can add logic to refresh tokens or check session here
    }
  }, []);

  return children;
};

export default function MainTemp() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <AuthStateWrapper>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              
              {/* Protected Routes */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } />
              
              {/* Redirect root to dashboard */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthStateWrapper>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}