// src/components/layout/Header.jsx
import { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import {
  Menu,
  Search,
  Bell,
  ChevronDown,
  User,
  Settings,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import Badge from '../common/Badge';

/**
 * Header Component
 * 
 * Top navigation header with search, notifications, and user menu.
 * Responsive with mobile menu trigger.
 * 
 * @example
 * <Header 
 *   onMenuClick={() => setSidebarOpen(true)}
 *   user={currentUser}
 * />
 */

const Header = ({ 
  onMenuClick = () => {},
  user = { name: 'John Doe', role: 'Manager', avatar: 'JD' },
  notificationCount = 3,
  onSearch = () => {},
  className = '',
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  
  const userMenuRef = useRef(null);
  const notificationsRef = useRef(null);

  // Sample notifications - can be passed as props
  const notifications = [
    {
      id: 1,
      title: 'Low Stock Alert',
      message: '5 products are running low in stock',
      time: '5 min ago',
      unread: true,
      variant: 'warning',
    },
    {
      id: 2,
      title: 'New Order',
      message: 'Order #1234 has been placed',
      time: '15 min ago',
      unread: true,
      variant: 'success',
    },
    {
      id: 3,
      title: 'Payment Received',
      message: 'Payment of $250 received',
      time: '1 hour ago',
      unread: false,
      variant: 'info',
    },
  ];

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  return (
    <header className={clsx(
      'sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm',
      className
    )}>
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden text-gray-600 hover:text-gray-900 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Search */}
          <form onSubmit={handleSearch} className="hidden md:flex">
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2 w-96 focus-within:ring-2 focus-within:ring-primary-500 transition-shadow">
              <Search className="h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search products, customers..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-400"
              />
            </div>
          </form>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Help button */}
          <button 
            className="hidden sm:flex p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Help"
          >
            <HelpCircle className="h-5 w-5" />
          </button>

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-danger-500 rounded-full" />
              )}
            </button>

            {/* Notifications dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-900">Notifications</h3>
                  <Badge variant="primary" size="xs">{notificationCount}</Badge>
                </div>

                {/* Notifications list */}
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={clsx(
                        'px-4 py-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors',
                        { 'bg-blue-50': notification.unread }
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <div className={clsx(
                          'h-2 w-2 rounded-full mt-2 flex-shrink-0',
                          {
                            'bg-warning-500': notification.variant === 'warning',
                            'bg-success-500': notification.variant === 'success',
                            'bg-primary-500': notification.variant === 'info',
                          }
                        )} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.title}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {notification.time}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-gray-200">
                  <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="hidden md:block text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user.name}
                </div>
                <div className="text-xs text-gray-500">{user.role}</div>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-bold">
                {user.avatar}
              </div>
              <ChevronDown className={clsx(
                'h-4 w-4 text-gray-400 transition-transform hidden sm:block',
                { 'rotate-180': userMenuOpen }
              )} />
            </button>

            {/* User dropdown menu */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                {/* User info */}
                <div className="px-4 py-3 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{user.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{user.role}</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <a
                    href="/profile"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <User className="h-4 w-4" />
                    <span>Your Profile</span>
                  </a>
                  <a
                    href="/settings"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </a>
                  <a
                    href="/help"
                    className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                  >
                    <HelpCircle className="h-4 w-4" />
                    <span>Help & Support</span>
                  </a>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-200 py-1">
                  <button className="w-full flex items-center gap-3 px-4 py-2 text-sm text-danger-600 hover:bg-danger-50 transition-colors">
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearch}>
          <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
            <Search className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="bg-transparent border-none outline-none text-sm w-full"
            />
          </div>
        </form>
      </div>
    </header>
  );
};

Header.displayName = 'Header';

export default Header;

/**
 * Example Usage:
 * 
 * import Header from '@/components/layout/Header';
 * 
 * const App = () => {
 *   const user = {
 *     name: 'John Doe',
 *     role: 'Manager',
 *     avatar: 'JD'
 *   };
 * 
 *   const handleSearch = (query) => {
 *     console.log('Searching for:', query);
 *   };
 * 
 *   return (
 *     <Header 
 *       onMenuClick={() => setSidebarOpen(true)}
 *       user={user}
 *       notificationCount={3}
 *       onSearch={handleSearch}
 *     />
 *   );
 * };
 */