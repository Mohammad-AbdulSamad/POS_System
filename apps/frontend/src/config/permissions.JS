import { ROLES } from './constants';

// Permission definitions
export const PERMISSIONS = {
  // POS
  POS_ACCESS: 'pos.access',
  POS_DISCOUNT: 'pos.discount',
  POS_REFUND: 'pos.refund',

  // Products
  PRODUCTS_VIEW: 'products.view',
  PRODUCTS_CREATE: 'products.create',
  PRODUCTS_EDIT: 'products.edit',
  PRODUCTS_DELETE: 'products.delete',

  // Inventory
  INVENTORY_ADJUST: 'inventory.adjust',
  INVENTORY_IMPORT: 'inventory.import',

  // Sales
  SALES_VIEW: 'sales.view',
  SALES_REFUND: 'sales.refund',

  // Reports
  REPORTS_VIEW: 'reports.view',
  REPORTS_EXPORT: 'reports.export',

  // Users
  USERS_VIEW: 'users.view',
  USERS_CREATE: 'users.create',
  USERS_EDIT: 'users.edit',
  USERS_DELETE: 'users.delete',

  // Settings
  SETTINGS_VIEW: 'settings.view',
  SETTINGS_EDIT: 'settings.edit',

  // Admin
  ADMIN_ACCESS: 'admin.access',
  LOGS_VIEW: 'logs.view',
};

// Role-based permissions
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: Object.values(PERMISSIONS), // All permissions
  
  [ROLES.MANAGER]: [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.POS_DISCOUNT,
    PERMISSIONS.POS_REFUND,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.PRODUCTS_CREATE,
    PERMISSIONS.PRODUCTS_EDIT,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_IMPORT,
    PERMISSIONS.SALES_VIEW,
    PERMISSIONS.SALES_REFUND,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
  ],
  
  [ROLES.CASHIER]: [
    PERMISSIONS.POS_ACCESS,
    PERMISSIONS.PRODUCTS_VIEW,
    PERMISSIONS.SALES_VIEW,
  ],
};

// Check if user has permission
export const hasPermission = (userRole, permission) => {
  const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
  return rolePermissions.includes(permission);
};

// Check if user has any of the permissions
export const hasAnyPermission = (userRole, permissions) => {
  return permissions.some(permission => hasPermission(userRole, permission));
};

// Check if user has all permissions
export const hasAllPermissions = (userRole, permissions) => {
  return permissions.every(permission => hasPermission(userRole, permission));
};