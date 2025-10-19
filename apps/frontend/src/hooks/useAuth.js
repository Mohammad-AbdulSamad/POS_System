// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth Hook
 * 
 * Custom hook to access authentication context.
 * Must be used within AuthProvider.
 * 
 * @example
 * const { user, login, logout, isAuthenticated } = useAuth();
 */

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};

export default useAuth;

/**
 * Example Usage:
 * 
 * import { useAuth } from '@/hooks/useAuth';
 * 
 * function MyComponent() {
 *   const { user, isAuthenticated, login, logout } = useAuth();
 * 
 *   if (!isAuthenticated) {
 *     return <div>Please login</div>;
 *   }
 * 
 *   return (
 *     <div>
 *       <h1>Welcome, {user.name}!</h1>
 *       <Button onClick={logout}>Logout</Button>
 *     </div>
 *   );
 * }
 * 
 * // Check user role
 * function AdminPanel() {
 *   const { hasRole } = useAuth();
 * 
 *   if (!hasRole('admin')) {
 *     return <div>Access denied</div>;
 *   }
 * 
 *   return <div>Admin content</div>;
 * }
 * 
 * // Check multiple roles
 * function ManagerArea() {
 *   const { hasAnyRole } = useAuth();
 * 
 *   if (!hasAnyRole(['admin', 'manager'])) {
 *     return <div>Access denied</div>;
 *   }
 * 
 *   return <div>Manager content</div>;
 * }
 */