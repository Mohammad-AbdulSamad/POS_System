// src/context/AuthContext.jsx
import { createContext, useState, useEffect } from 'react';
import * as authService from '../services/authService';

/**
 * Auth Context
 * 
 * Provides authentication state and methods to the entire application.
 * Wrap your app with AuthProvider to use authentication.
 */

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Initialize auth state from storage
  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedUser = authService.getCurrentUser();
        const authenticated = authService.isAuthenticated();

        if (authenticated && storedUser) {
          setUser(storedUser);
          setIsAuthenticated(true);
        } else {
          // ✅ Ensure clean state if no valid auth
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // ✅ Set clean state on error
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login user
   * @param {string} email
   * @param {string} password
   * @param {boolean} rememberMe
   */
  const login = async (email, password, rememberMe = false) => {
    try {
      const data = await authService.login({
        email: email,
        password: password,
        rememberMe: rememberMe
      });
      
      // ✅ Only set auth state on successful login
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      // ✅ CRITICAL FIX: Clear auth state on login failure
      setUser(null);
      setIsAuthenticated(false);
      console.error('Login failed:', error.message);
      throw error;
    }
  };

  /**
   * Register new user
   * @param {object} userData
   */
  const register = async (userData) => {
    try {
      const data = await authService.register(userData);
      setUser(data.user);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      // ✅ Clear auth state on registration failure
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  /**
   * Logout user
   */
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // ✅ Always clear state on logout, even if API call fails
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  /**
   * Update user data
   * @param {object} updates
   */
  const updateUser = (updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  };

  /**
   * Check if user has specific role
   * @param {string} role
   * @returns {boolean}
   */
  const hasRole = (role) => {
    return user?.role === role;
  };

  /**
   * Check if user has any of the specified roles
   * @param {string[]} roles
   * @returns {boolean}
   */
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    hasRole,
    hasAnyRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;