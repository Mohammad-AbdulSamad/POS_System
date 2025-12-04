import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  Tag, 
  ShoppingCart, 
  Users, 
  Truck, 
  BarChart3, 
  FileText, 
  Settings, 
  Store, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  LogOut,
  Building2 
} from 'lucide-react';
import Badge from '../common/Badge.jsx';
import { useAuth } from '../../hooks/useAuth.js';

const Sidebar = ({
  isOpen = false,
  onClose = () => {},
  currentPath = '/dashboard',
  collapsed = false,
  onToggleCollapse = () => {},
}) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isAdmin = ['ADMIN', 'MANAGER'].includes(user.role);

  // Navigation items - filter based on role
  const navigationItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'POS', icon: ShoppingCart, href: '/pos' },
    { name: 'Products', icon: Package, href: '/products', badge: '12', badgeVariant: 'warning' },
    { name: 'Categories', icon: Tag, href: '/categories' },
    { name: 'Customers', icon: Users, href: '/customers' },
    { name: 'Suppliers', icon: Truck, href: '/suppliers', adminOnly: true },
    { name: 'Reports', icon: BarChart3, href: '/reports', adminOnly: true },
    { name: 'Invoices', icon: FileText, href: '/invoices' },
    // Admin-only items
    ...(isAdmin ? [
      { name: 'Branches', icon: Building2, href: '/branches' },
      { name: 'Users', icon: Users, href: '/users' },
    ] : []),
    { name: 'Settings', icon: Settings, href: '/settings' },
  ].filter(item => !item.adminOnly || isAdmin);

  const handleLogout = async () => {
    try {
      await logout();
      // Redirect will be handled by your routing logic
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`
          fixed top-0 left-0 z-50 h-full bg-gray-900 text-white flex flex-col
          transition-all duration-300 ease-in-out
          lg:translate-x-0 w-64
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          ${collapsed ? 'lg:w-20' : 'lg:w-64'}
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-blue-400" />
            {!collapsed && <span className="text-lg font-bold">POS System</span>}
          </div>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          {/* Desktop collapse toggle */}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex text-gray-400 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {/* User & Branch Info */}
        {!collapsed && (
          <div className="px-4 py-3 border-b border-gray-800 flex-shrink-0">
            {/* User Info */}
            <div className="mb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
                  {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {user.name || user.email}
                  </div>
                  <div className="text-xs text-gray-400">{user.role}</div>
                </div>
              </div>
            </div>

            {/* Branch Display */}
            <div className="px-3 py-2 rounded-lg bg-gray-800">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400">
                    {isAdmin ? 'Access Level' : 'Branch'}
                  </div>
                  <div className="text-sm font-medium truncate">
                    {isAdmin 
                      ? 'All Branches' 
                      : user.branch?.name || 'No Branch Assigned'
                    }
                  </div>
                </div>
              </div>
              
              {/* Show branch address for non-admin if available */}
              {!isAdmin && user.branch?.address && (
                <div className="text-xs text-gray-500 mt-1 truncate">
                  {user.branch.address}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Collapsed user icon */}
        {collapsed && (
          <div className="px-3 py-3 border-b border-gray-800 flex justify-center">
            <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath === item.href;

            return (
              <button
                key={item.name}
                onClick={(e) => {
                  e.preventDefault();
                  console.log('Navigating to:', item.href);
                  // Add your navigation logic here
                  // navigate(item.href);
                }}
                className={`
                  w-full flex items-center rounded-lg text-sm font-medium transition-colors
                  ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                  ${collapsed ? 'lg:p-3 lg:justify-center px-3 py-2.5' : 'px-3 py-2.5 justify-between'}
                `}
                title={collapsed ? item.name : undefined}
              >
                <div className={`flex items-center gap-3 ${collapsed ? 'lg:justify-center' : ''}`}>
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <span className={collapsed ? 'lg:hidden' : ''}>{item.name}</span>
                </div>
                {item.badge && (
                  <Badge 
                    variant={item.badgeVariant || 'danger'} 
                    size="xs"
                    className={collapsed ? 'lg:hidden' : ''}
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="border-t border-gray-800 p-4 flex-shrink-0">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center gap-3 rounded-lg text-sm font-medium 
              text-gray-300 hover:bg-red-600 hover:text-white transition-colors
              ${collapsed ? 'lg:p-3 lg:justify-center px-3 py-2' : 'px-3 py-2'}
            `}
            title={collapsed ? 'Logout' : undefined}
          >
            <LogOut className="h-5 w-5" />
            <span className={collapsed ? 'lg:hidden' : ''}>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

Sidebar.displayName = 'Sidebar';
export default Sidebar;