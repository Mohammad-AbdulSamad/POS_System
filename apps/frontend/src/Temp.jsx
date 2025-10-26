import Header from './components/layout/Header';
import MainLayout from './components/layout/MainLayout';
import PageHeader from './components/layout/PageHeader';
import Breadcrumbs from './components/layout/Breadcrumbs';
import Button from './components/common/Button';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import DashboardPage from './pages/dashboard/DashboardPage';
import POSPage from './pages/pos/POSPage';
const Temp = () => {
  
  return (
    <POSPage />
  );
};

export default Temp;


  
//  *   
//  *   return (
//  *     <MainLayout
//  *       user={{ name: 'John Doe', role: 'Manager', avatar: 'JD' }}
//  *       currentPath="/products"
//  *       notificationCount={5}
//  *       onSearch={(query) => setSearchQuery(query)}
//  *     >
//  *       {/* Breadcrumbs */}
//  *       <Breadcrumbs 
//  *         items={[
//  *           { label: 'Dashboard', href: '/dashboard' },
//  *           { label: 'Products' }
//  *         ]}
//  *       />
//  *       
//  *       {/* Page Header */}
//  *       <PageHeader 
//  *         title="Products"
//  *         description="Manage your product inventory"
//  *         actions={
//  *           <div className="flex gap-2">
//  *             <Button variant="outline">Import</Button>
//  *             <Button variant="primary" icon={Plus}>Add Product</Button>
//  *           </div>
//  *         }
//  *       />
//  *       
//  *       {/* Page Content */}
//  *       <div className="mt-6 space-y-6">
//  *         {/* Filters, table, etc. */}
//  *       </div>
//  *     </MainLayout>
//  *   );
//  * }
//  * 
//  * // Different pages using the same layout
//  * function SalesPage() {
//  *   return (
//  *     <MainLayout user={user} currentPath="/sales">
//  *       <PageHeader title="Sales" />
//  *       {/* Sales content */}
//  *     </MainLayout>
//  *   );
//  * }
//  * 
//  * function CustomersPage() {
//  *   return (
//  *     <MainLayout user={user} currentPath="/customers">
//  *       <PageHeader title="Customers" />
//  *       {/* Customers content */}
//  *     </MainLayout>
//  *   );
//  * }
//  * 
//  * // With custom className
//  * <MainLayout 
//  *   user={user} 
//  *   currentPath="/dashboard"
//  *   className="bg-blue-50"
//  * >
//  *   {/* Content */}
//  * </MainLayout>
// import { useState } from 'react';
// import {
//   LayoutDashboard,
//   Package,
//   ShoppingCart,
//   Users,
//   BarChart3,
//   Settings,
//   X,
//   LogOut,
//   ChevronDown,
//   Store,
//   Tag,
//   FileText,
//   Truck,
//   ChevronLeft,
//   ChevronRight,
//   Menu,
//   Bell,
//   Search,
// } from 'lucide-react';

// // Badge Component
// const Badge = ({ children, variant = 'danger', size = 'md', className = '' }) => {
//   const variants = {
//     danger: 'bg-red-500',
//     warning: 'bg-yellow-500',
//     success: 'bg-green-500',
//   };
  
//   const sizes = {
//     xs: 'text-xs px-1.5 py-0.5',
//     sm: 'text-sm px-2 py-1',
//     md: 'text-base px-2.5 py-1',
//   };
  
//   return (
//     <span className={`${variants[variant]} ${sizes[size]} ${className} rounded-full text-white font-medium`}>
//       {children}
//     </span>
//   );
// };

// Sidebar Component
// const Sidebar = ({
//   isOpen = false,
//   onClose = () => {},
//   currentPath = '/dashboard',
//   collapsed = false,
//   onToggleCollapse = () => {},
// }) => {
//   const [storeMenuOpen, setStoreMenuOpen] = useState(false);

//   const navigationItems = [
//     { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
//     { name: 'Products', icon: Package, href: '/products', badge: '12', badgeVariant: 'warning' },
//     { name: 'Categories', icon: Tag, href: '/categories' },
//     { name: 'Sales', icon: ShoppingCart, href: '/sales' },
//     { name: 'Customers', icon: Users, href: '/customers' },
//     { name: 'Suppliers', icon: Truck, href: '/suppliers' },
//     { name: 'Reports', icon: BarChart3, href: '/reports' },
//     { name: 'Invoices', icon: FileText, href: '/invoices' },
//     { name: 'Settings', icon: Settings, href: '/settings' },
//   ];

//   const stores = [
//     { id: 1, name: 'Main Store', code: 'MS', active: true },
//     { id: 2, name: 'Branch Store', code: 'BS', active: false },
//   ];

//   const activeStore = stores.find((s) => s.active) || stores[0];

//   return (
//     <>
//       {isOpen && (
//         <div
//           className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
//           onClick={onClose}
//         />
//       )}

//       <aside
//         className={`
//           fixed top-0 left-0 z-50 h-full bg-gray-900 text-white flex flex-col
//           transition-all duration-300 ease-in-out
//           lg:translate-x-0 w-64
//           ${isOpen ? 'translate-x-0' : '-translate-x-full'}
//           ${collapsed ? 'lg:w-20' : 'lg:w-64'}
//         `}
//       >
//         <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800 flex-shrink-0">
//           <div className="flex items-center gap-2">
//             <Store className="h-6 w-6 text-blue-400" />
//             {!collapsed && <span className="text-lg font-bold">POS System</span>}
//           </div>

//           <button
//             onClick={onClose}
//             className="lg:hidden text-gray-400 hover:text-white transition-colors"
//           >
//             <X className="h-6 w-6" />
//           </button>

//           <button
//             onClick={onToggleCollapse}
//             className="hidden lg:flex text-gray-400 hover:text-white transition-colors"
//           >
//             {collapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
//           </button>
//         </div>

//         {!collapsed && (
//           <div className="px-4 py-3 border-b border-gray-800 flex-shrink-0">
//             <div className="relative">
//               <button
//                 onClick={() => setStoreMenuOpen(!storeMenuOpen)}
//                 className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 transition-colors"
//               >
//                 <div className="flex items-center gap-2">
//                   <div className="h-8 w-8 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">
//                     {activeStore.code}
//                   </div>
//                   <div className="text-left">
//                     <div className="text-sm font-medium">{activeStore.name}</div>
//                     <div className="text-xs text-gray-400">Active</div>
//                   </div>
//                 </div>
//                 <ChevronDown
//                   className={`h-4 w-4 text-gray-400 transition-transform ${storeMenuOpen ? 'rotate-180' : ''}`}
//                 />
//               </button>

//               {storeMenuOpen && (
//                 <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-lg border border-gray-700 py-1 z-10">
//                   {stores.map((store) => (
//                     <button
//                       key={store.id}
//                       className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
//                     >
//                       <div className="h-6 w-6 rounded bg-blue-500 flex items-center justify-center text-xs font-bold">
//                         {store.code}
//                       </div>
//                       <span>{store.name}</span>
//                       {store.active && (
//                         <div className="ml-auto h-2 w-2 bg-green-500 rounded-full" />
//                       )}
//                     </button>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         )}

//         <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
//           {navigationItems.map((item) => {
//             const Icon = item.icon;
//             const isActive = currentPath === item.href;

//             return (
//               <button
//                 key={item.name}
//                 onClick={(e) => {
//                   e.preventDefault();
//                   console.log('Navigating to:', item.href);
//                 }}
//                 className={`
//                   w-full flex items-center rounded-lg text-sm font-medium transition-colors
//                   ${isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'}
//                   ${collapsed ? 'lg:p-3 lg:justify-center px-3 py-2.5' : 'px-3 py-2.5 justify-between'}
//                 `}
//               >
//                 <div className={`flex items-center gap-3 ${collapsed ? 'lg:justify-center' : ''}`}>
//                   <Icon className="h-5 w-5 flex-shrink-0" />
//                   <span className={collapsed ? 'lg:hidden' : ''}>{item.name}</span>
//                 </div>
//                 {item.badge && (
//                   <Badge 
//                     variant={item.badgeVariant || 'danger'} 
//                     size="xs"
//                     className={collapsed ? 'lg:hidden' : ''}
//                   >
//                     {item.badge}
//                   </Badge>
//                 )}
//               </button>
//             );
//           })}
//         </nav>

//         <div className="border-t border-gray-800 p-4 flex-shrink-0">
//           <button
//             className={`
//               w-full flex items-center gap-3 rounded-lg text-sm font-medium 
//               text-gray-300 hover:bg-gray-800 hover:text-white transition-colors
//               ${collapsed ? 'lg:p-3 lg:justify-center px-3 py-2' : 'px-3 py-2'}
//             `}
//           >
//             <LogOut className="h-5 w-5" />
//             <span className={collapsed ? 'lg:hidden' : ''}>Logout</span>
//           </button>
//         </div>
//       </aside>
//     </>
//   );
// };

// // Header Component
// const Header = ({ onMenuClick, notificationCount = 0 }) => {
//   return (
//     <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
//       <button
//         onClick={onMenuClick}
//         className="lg:hidden text-gray-600 hover:text-gray-900"
//       >
//         <Menu className="h-6 w-6" />
//       </button>
      
//       <div className="flex-1 max-w-md mx-4">
//         <div className="relative">
//           <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
//           <input
//             type="text"
//             placeholder="Search..."
//             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
//           />
//         </div>
//       </div>

//       <div className="flex items-center gap-4">
//         <button className="relative text-gray-600 hover:text-gray-900">
//           <Bell className="h-6 w-6" />
//           {notificationCount > 0 && (
//             <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
//               {notificationCount}
//             </span>
//           )}
//         </button>
//       </div>
//     </header>
//   );
// };

// // MainLayout Component
// const MainLayout = ({ children, currentPath }) => {
//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

//   return (
//     <div className="min-h-screen bg-gray-50 flex">
//       <Sidebar 
//         isOpen={sidebarOpen}
//         onClose={() => setSidebarOpen(false)}
//         currentPath={currentPath}
//         collapsed={sidebarCollapsed}
//         onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
//       />

//       <div
//         className={`
//           flex-1 flex flex-col transition-all duration-300
//           ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}
//         `}
//       >
//         <Header 
//           onMenuClick={() => setSidebarOpen(true)}
//           notificationCount={3}
//         />

//         <main className="p-4 lg:p-6 flex-1">
//           {children}
//         </main>
//       </div>
//     </div>
//   );
// };

// // Demo App
// export default function Temp() {
//   const [currentPath, setCurrentPath] = useState('/dashboard');

//   return (
//     <MainLayout currentPath={currentPath}>
//       <div className="max-w-4xl">
//         <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
//         <div className="bg-white rounded-lg shadow p-6 space-y-4">
//           <h2 className="text-xl font-semibold">Sidebar Demo</h2>
//           <div className="space-y-2 text-gray-600">
//             <p><strong>On Mobile:</strong> Click the menu icon in the header to open sidebar</p>
//             <p><strong>On Desktop:</strong> Click the collapse button in the sidebar header</p>
//             <p><strong>Navigation:</strong> Click any icon in collapsed mode - sidebar stays collapsed</p>
//           </div>
          
//           <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
//             <p className="text-sm text-blue-800">
//               <strong>Current Path:</strong> {currentPath}
//             </p>
//             <p className="text-xs text-blue-600 mt-2">
//               Try clicking navigation items in the sidebar. The sidebar will NOT expand!
//             </p>
//           </div>

//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
//             <div className="p-4 bg-blue-100 rounded-lg">
//               <h3 className="font-semibold text-blue-900">Total Sales</h3>
//               <p className="text-2xl font-bold text-blue-700">$12,345</p>
//             </div>
//             <div className="p-4 bg-green-100 rounded-lg">
//               <h3 className="font-semibold text-green-900">Products</h3>
//               <p className="text-2xl font-bold text-green-700">1,234</p>
//             </div>
//             <div className="p-4 bg-purple-100 rounded-lg">
//               <h3 className="font-semibold text-purple-900">Customers</h3>
//               <p className="text-2xl font-bold text-purple-700">567</p>
//             </div>
//           </div>
//         </div>
//       </div>
//     </MainLayout>
//   );
// }