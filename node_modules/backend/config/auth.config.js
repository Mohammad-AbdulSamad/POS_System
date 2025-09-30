// config/auth.config.js
//Auth configuration (token expiry, secrets)

export const authConfig = {
  // JWT Secret Keys (use environment variables in production!)
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
  
  // Token Expiry Times
  accessTokenExpiry: '30m',      // 30 minutes
  refreshTokenExpiry: '7d',      // 7 days
  
  // Token Cookie Options
  cookieOptions: {
    httpOnly: true,               // Prevents XSS attacks
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'strict',           // CSRF protection
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  },
  
  // Bcrypt Rounds (already in users.controller, but kept for reference)
  saltRounds: 10,
  
  // Role Hierarchy (higher number = more permissions)
  roleHierarchy: {
    'ADMIN': 4,
    'MANAGER': 3,
    'STOCK_MANAGER': 2,
    'CASHIER': 1
  },
  
  // Role Permissions Map
  permissions: {
    'ADMIN': ['*'], // All permissions
    'MANAGER': [
      'users:read',
      'users:create',
      'users:update',
      'products:*',
      'transactions:*',
      'reports:*',
      'categories:*',
      'suppliers:*',
      'promotions:*'
    ],
    'STOCK_MANAGER': [
      'products:read',
      'products:create',
      'products:update',
      'stock:*',
      'suppliers:read',
      'categories:read'
    ],
    'CASHIER': [
      'transactions:create',
      'transactions:read',
      'products:read',
      'customers:read',
      'customers:create'
    ]
  }
};