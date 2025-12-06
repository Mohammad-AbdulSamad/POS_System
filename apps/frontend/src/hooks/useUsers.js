// src/hooks/useUsers.js
import { useState, useEffect, useCallback, useRef } from 'react';
import * as userService from '../services/userService';
import { useToast } from '../components/common/Toast';

/**
 * Hook for managing users/employees
 * Handles fetching, creating, updating, and deleting users
 */
export const useUsers = (options = {}) => {
  const {
    branchId = null,
    role = null,
    autoFetch = true,
    initialLimit = 50,
  } = options;

  const toast = useToast();
  const toastRef = useRef(toast);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  // State
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Pagination
  const [pagination, setPagination] = useState({
    page: 1,
    limit: initialLimit,
    total: 0,
    pages: 0,
  });

  // Filters
  const [filters, setFilters] = useState({
    role: role,
    branchId: branchId,
    search: '',
    active: null,
  });

  /**
   * Fetch all users with filters
   */
  const fetchUsers = useCallback(async (params = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const queryParams = {
        page: params.page || pagination.page,
        limit: params.limit || pagination.limit,
        ...filters,
        ...params,
      };

      // Remove empty values
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === null || 
            queryParams[key] === undefined || 
            queryParams[key] === '') {
          delete queryParams[key];
        }
      });

      console.log('📡 Fetching users with params:', queryParams);

      const response = await userService.getAllUsers(queryParams);

      const usersList = response?.users ?? response?.data ?? [];
      setUsers(usersList);

      const paginationData = response?.pagination || {
        page: queryParams.page || 1,
        limit: queryParams.limit || pagination.limit,
        total: usersList.length,
        pages: Math.ceil(usersList.length / (queryParams.limit || pagination.limit)),
      };

      setPagination(paginationData);

      console.log('✅ Fetched users:', {
        count: usersList.length,
        total: paginationData.total,
        page: paginationData.page
      });

      return usersList;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch users';
      console.error('❌ Error fetching users:', errorMessage);
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      setUsers([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  /**
   * Fetch single user by ID
   */
  const fetchUserById = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      const user = await userService.getUserById(id);
      setSelectedUser(user);
      return user;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch user';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create new user
   */
  const createUser = useCallback(async (userData) => {
    setIsLoading(true);
    setError(null);

    try {
      const newUser = await userService.createUser(userData);
      toastRef.current?.success('User created successfully');
      
      // Refresh the list
      await fetchUsers();
      
      return newUser;
    } catch (err) {
      const errorMessage = err.message || 'Failed to create user';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [fetchUsers]);

  /**
   * Update user
   */
  const updateUser = useCallback(async (id, updateData) => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedUser = await userService.updateUser(id, updateData);
      toastRef.current?.success('User updated successfully');
      
      // Update in local state
      setUsers(prev => 
        prev.map(user => user.id === id ? updatedUser : user)
      );
      
      if (selectedUser?.id === id) {
        setSelectedUser(updatedUser);
      }
      
      return updatedUser;
    } catch (err) {
      const errorMessage = err.message || 'Failed to update user';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedUser]);

  /**
   * Delete user
   */
  const deleteUser = useCallback(async (id) => {
    setIsLoading(true);
    setError(null);

    try {
      await userService.deleteUser(id);
      toastRef.current?.success('User deleted successfully');
      
      // Remove from local state
      setUsers(prev => prev.filter(user => user.id !== id));
      
      if (selectedUser?.id === id) {
        setSelectedUser(null);
      }
      
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete user';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [selectedUser]);

  /**
   * Change user password
   */
  const changePassword = useCallback(async (id, passwordData) => {
    setIsLoading(true);
    setError(null);

    try {
      await userService.changePassword(id, passwordData);
      toastRef.current?.success('Password changed successfully');
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Failed to change password';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reset user password (admin)
   */
  const resetPassword = useCallback(async (id, newPassword) => {
    setIsLoading(true);
    setError(null);

    try {
      await userService.resetPassword(id, { newPassword });
      toastRef.current?.success('Password reset successfully');
      return true;
    } catch (err) {
      const errorMessage = err.message || 'Failed to reset password';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get user statistics
   */
  const getUserStats = useCallback(async (userId) => {
    setIsLoading(true);
    setError(null);

    try {
      const stats = await userService.getUserStats(userId);
      return stats;
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch user stats';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get users by branch
   */
  const getUsersByBranch = useCallback(async (branchId, roleFilter = null) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.getUsersByBranch(branchId, { role: roleFilter });
      return response.users || [];
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch branch users';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get users by role
   */
  const getUsersByRole = useCallback(async (role) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await userService.getUsersByRole(role);
      return response.users || [];
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch users by role';
      setError(errorMessage);
      toastRef.current?.error(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Validate email availability
   */
  const validateEmail = useCallback(async (email) => {
    try {
      const response = await userService.validateEmail({ email });
      return response.valid;
    } catch (err) {
      return false;
    }
  }, []);

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Clear filters
   */
  const clearFilters = useCallback(() => {
    setFilters({
      role: null,
      branchId: null,
      search: '',
      active: null,
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  }, []);

  /**
   * Pagination helpers
   */
  const goToPage = useCallback((page) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((limit) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }));
  }, []);

  /**
   * Calculate statistics
   */
  const calculateStats = useCallback(() => {
    const totalUsers = users.length;
    const byRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    return {
      totalUsers,
      byRole,
      adminCount: byRole.ADMIN || 0,
      managerCount: byRole.MANAGER || 0,
      cashierCount: byRole.CASHIER || 0,
      stockManagerCount: byRole.STOCK_MANAGER || 0,
    };
  }, [users]);

  /**
   * Auto-fetch on mount
   */
  useEffect(() => {
    if (autoFetch) {
      console.log('🔄 Initial fetch on mount');
      fetchUsers();
    }
  
  }, []);

  return {
    // Data
    users,
    selectedUser,
    isLoading,
    error,

    // Pagination
    pagination,
    goToPage,
    setPageSize,

    // Filters
    filters,
    updateFilters,
    clearFilters,

    // CRUD operations
    fetchUsers,
    fetchUserById,
    createUser,
    updateUser,
    deleteUser,
    refresh: fetchUsers,

    // Password operations
    changePassword,
    resetPassword,

    // Additional operations
    getUserStats,
    getUsersByBranch,
    getUsersByRole,
    validateEmail,

    // Computed
    calculateStats,

    // Setters
    setSelectedUser,
  };
};

export default useUsers;