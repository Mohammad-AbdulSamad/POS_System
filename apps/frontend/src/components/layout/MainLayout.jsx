// src/components/layout/MainLayout.jsx
// src/components/layout/MainLayout.jsx
import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import clsx from 'clsx';

/**
 * MainLayout Component
 * 
 * Handles sidebar (mobile + desktop), header, and main content layout.
 */

const MainLayout = ({ 
  children,
  user,
  currentPath,
  onSearch,
  notificationCount,
  className = '',
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);   // mobile open/close
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); // desktop collapse/expand

  return (
    <div className={clsx('min-h-screen bg-gray-50 flex', className)}>
      {/* Sidebar */}
      <Sidebar 
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={currentPath}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)} // <-- new
      />

      {/* Main content area */}
      <div
        className={clsx(
          'flex-1 flex flex-col transition-all duration-300',
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        )}
      >
        {/* Header */}
        <Header 
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          notificationCount={notificationCount}
          onSearch={onSearch}
        />

        {/* Page content */}
        <main className="p-4 lg:p-6 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

MainLayout.displayName = 'MainLayout';

export default MainLayout;
/**
 * Example Usage:
 * 
 * import MainLayout from '@/components/layout/MainLayout';
 * 
 * // In your App.jsx or page component
 * function DashboardPage() {
 *   const user = {
 *     name: 'John Doe',
 *     role: 'Manager',
 *     avatar: 'JD'
 *   };
 * 
 *   const handleSearch = (query) => {
 *     console.log('Searching for:', query);
 *     // Implement search logic
 *   };
 * 
 *   return (
 *     <MainLayout
 *       user={user}
 *       currentPath="/dashboard"
 *       notificationCount={3}
 *       onSearch={handleSearch}
 *     >
 *       <div>
 *         <h1 className="text-2xl font-bold">Dashboard</h1>
 *         <p>Your page content goes here...</p>
 *       </div>
 *     </MainLayout>
 *   );
 * }
 * 
 * // With PageHeader component (to be created)
 * <MainLayout user={user} currentPath="/products">
 *   <PageHeader 
 *     title="Products" 
 *     actions={
 *       <Button variant="primary">Add Product</Button>
 *     }
 *   />
 *   
 *   <div className="mt-6">
 *     {/* Product list *///  *   </div>
//  * </MainLayout>
//  * 
//  * // With Breadcrumbs component (to be created)
//  * <MainLayout user={user} currentPath="/products/edit">
//  *   <Breadcrumbs 
//  *     items={[
//  *       { label: 'Dashboard', href: '/dashboard' },
//  *       { label: 'Products', href: '/products' },
//  *       { label: 'Edit Product' }
//  *     ]}
//  *   />
//  *   
//  *   <PageHeader title="Edit Product" />
//  *   
//  *   <div className="mt-6">
//  *     {/* Edit form */}
//  *   </div>
//  * </MainLayout>
//  * 
//  * // Full example with all components
//  * function ProductsPage() {
//  *   const [searchQuery, setSearchQuery] = useState('');
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
//  */