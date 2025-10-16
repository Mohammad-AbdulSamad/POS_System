// App constants
export const APP_NAME = 'Supermarket POS';
export const APP_VERSION = '1.0.0';

// API
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const API_TIMEOUT = 10000;

// Roles
export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  STOCK_MANAGER: 'stock_manager',
};

// Payment Methods
export const PAYMENT_METHODS = {
  CASH: 'cash',
  CARD: 'card',
  MOBILE: 'mobile_money',
  BANK_TRANSFER: 'bank_transfer',
};

// Transaction Status
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
};

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// Date formats
export const DATE_FORMAT = 'yyyy-MM-dd';
export const DATETIME_FORMAT = 'yyyy-MM-dd HH:mm:ss';
export const TIME_FORMAT = 'HH:mm:ss';

// Currency
export const CURRENCY = 'USD';
export const CURRENCY_SYMBOL = '$';

// Stock Alert Threshold
export const LOW_STOCK_THRESHOLD = 10;

// Max file upload size (in bytes)
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Allowed image types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

// Tax rate (can be overridden by settings)
export const DEFAULT_TAX_RATE = 0.15; // 15%

// Receipt config
export const RECEIPT_CONFIG = {
  PRINT_COPIES: 1,
  AUTO_PRINT: true,
  SHOW_LOGO: true,
  SHOW_BARCODE: true,
};

// Local storage keys
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  CART: 'cart',
  THEME: 'theme',
  LANGUAGE: 'language',
};