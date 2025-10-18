import React, { useState } from 'react';
import { LayoutDashboard, Package, Tag, ShoppingCart, Users, Truck, BarChart3, FileText, Settings, Store, X, ChevronLeft, ChevronRight, ChevronDown, LogOut } from 'lucide-react';
import Badge from '../common/Badge.jsx';


const Sidebar = ({
  isOpen = false,
  onClose = () => {},
  currentPath = '/dashboard',
  collapsed = false,
  onToggleCollapse = () => {},
}) => {
  const [storeMenuOpen, setStoreMenuOpen] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { name: 'Products', icon: Package, href: '/products', badge: '12', badgeVariant: 'warning' },
    { name: 'Categories', icon: Tag, href: '/categories' },
    { name: 'Sales', icon: ShoppingCart, href: '/sales' },
    { name: 'Customers', icon: Users, href: '/customers' },
    { name: 'Suppliers', icon: Truck, href: '/suppliers' },
    { name: 'Reports', icon: BarChart3, href: '/reports' },
    { name: 'Invoices', icon: FileText, href: '/invoices' },
    { name: 'Settings', icon: Settings, href: '/settings' },
  ];

  const stores = [
    { id: 1, name: 'Main Store', code: 'MS', active: true },
    { id: 2, name: 'Branch Store', code: 'BS', active: false },
  ];

  const activeStore = stores.find((s) => s.active) || stores[0];

  return (
    <>
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
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Store className="h-6 w-6 text-blue-400" />
            {!collapsed && <span className="text-lg font-bold">POS System</span>}
          </div>

          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>

          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex text-gray-400 hover:text-white transition-colors"
          >
            {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>

        {!collapsed && (
          <div className="px-4 py-3 border-b border-gray-800 flex-shrink-0">
            <div className="relative">
              <button
                onClick={() => setStoreMenuOpen(!storeMenuOpen)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">
                    {activeStore.code}
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-medium">{activeStore.name}</div>
                    <div className="text-xs text-gray-400">Active</div>
                  </div>
                </div>
                <ChevronDown
                  className={`h-4 w-4 text-gray-400 transition-transform ${storeMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {storeMenuOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-10">
                  {stores.map((store) => (
                    <button
                      key={store.id}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                    >
                      <div className="h-6 w-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">
                        {store.code}
                      </div>
                      <span>{store.name}</span>
                      {store.active && (
                        <div className="ml-auto h-2 w-2 bg-green-500 rounded-full" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

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
                }}
                className={`
                  w-full flex items-center rounded-lg text-sm font-medium transition-colors
                  ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
                  ${collapsed ? 'lg:p-3 lg:justify-center px-3 py-2.5' : 'px-3 py-2.5 justify-between'}
                `}
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

        <div className="border-t border-gray-800 p-4 flex-shrink-0">
          <button
            className={`
              w-full flex items-center gap-3 rounded-lg text-sm font-medium 
              text-gray-300 hover:bg-gray-800 hover:text-white transition-colors
              ${collapsed ? 'lg:p-3 lg:justify-center px-3 py-2' : 'px-3 py-2'}
            `}
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