// Route path constants
export const ROUTES = {
  // Auth
  LOGIN: '/login',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  UNAUTHORIZED: '/unauthorized',

  // Main
  DASHBOARD: '/',
  
  // POS
  POS: '/pos',
  RECEIPT: '/receipt/:id',

  // Inventory
  PRODUCTS: '/inventory/products',
  ADD_PRODUCT: '/inventory/products/add',
  EDIT_PRODUCT: '/inventory/products/edit/:id',
  PRODUCT_DETAILS: '/inventory/products/:id',
  LOW_STOCK: '/inventory/low-stock',
  STOCK_ADJUSTMENT: '/inventory/stock-adjustment',
  CATEGORIES: '/inventory/categories',
  SUPPLIERS: '/inventory/suppliers',
  BULK_IMPORT: '/inventory/bulk-import',

  // Sales
  SALES_HISTORY: '/sales/history',
  TRANSACTION_DETAILS: '/sales/transaction/:id',
  RETURNS: '/sales/returns',
  REFUND_HISTORY: '/sales/refunds',

  // Reports
  SALES_REPORTS: '/reports/sales',
  INVENTORY_REPORTS: '/reports/inventory',
  PROFIT_LOSS: '/reports/profit-loss',
  EMPLOYEE_PERFORMANCE: '/reports/employee-performance',

  // Users
  USERS: '/users',
  ADD_USER: '/users/add',
  EDIT_USER: '/users/edit/:id',
  USER_DETAILS: '/users/:id',

  // Customers
  CUSTOMERS: '/customers',
  ADD_CUSTOMER: '/customers/add',
  CUSTOMER_DETAILS: '/customers/:id',

  // Settings
  GENERAL_SETTINGS: '/settings/general',
  TAX_SETTINGS: '/settings/tax',
  PAYMENT_SETTINGS: '/settings/payment',
  DISCOUNTS: '/settings/discounts',
  SHIFT_MANAGEMENT: '/settings/shifts',
  BACKUP: '/settings/backup',

  // Profile
  MY_PROFILE: '/profile',
  MY_SHIFTS: '/profile/shifts',

  // Admin
  ACTIVITY_LOGS: '/admin/logs',
  SYSTEM_SETTINGS: '/admin/system',

  // Notifications
  NOTIFICATIONS: '/notifications',

  // Error pages
  NOT_FOUND: '*',
  SERVER_ERROR: '/500',
  MAINTENANCE: '/maintenance',
};

// Route permissions
export const ROUTE_PERMISSIONS = {
  [ROUTES.DASHBOARD]: ['admin', 'manager', 'cashier'],
  [ROUTES.POS]: ['admin', 'manager', 'cashier'],
  [ROUTES.PRODUCTS]: ['admin', 'manager'],
  [ROUTES.ADD_PRODUCT]: ['admin', 'manager'],
  [ROUTES.USERS]: ['admin'],
  [ROUTES.ACTIVITY_LOGS]: ['admin'],
  [ROUTES.SYSTEM_SETTINGS]: ['admin'],
  // Add more as needed
};