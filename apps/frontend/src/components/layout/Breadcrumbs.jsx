// src/components/layout/Breadcrumbs.jsx
import clsx from 'clsx';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumbs Component
 * 
 * Navigation breadcrumbs for showing the current page location in the hierarchy.
 * Improves navigation and user orientation.
 * 
 * @example
 * <Breadcrumbs 
 *   items={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Products', href: '/products' },
 *     { label: 'Edit Product' }
 *   ]}
 * />
 */

const Breadcrumbs = ({ 
  items = [],
  showHome = true,
  homeHref = '/dashboard',
  separator = 'chevron', // 'chevron', 'slash', 'dot'
  size = 'md',
  className = '',
}) => {
  // Size styles
  const sizeStyles = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  const iconSizeStyles = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };

  // Separator component
  const Separator = () => {
    if (separator === 'chevron') {
      return <ChevronRight className={clsx('text-gray-400', iconSizeStyles[size])} />;
    } else if (separator === 'slash') {
      return <span className="text-gray-400 mx-2">/</span>;
    } else if (separator === 'dot') {
      return <span className="text-gray-400 mx-2">•</span>;
    }
    return null;
  };

  // Combine home with items if showHome is true
  const allItems = showHome 
    ? [{ label: 'Home', href: homeHref, icon: Home }, ...items]
    : items;

  if (allItems.length === 0) return null;

  return (
    <nav 
      aria-label="Breadcrumb"
      className={clsx('flex items-center flex-wrap', sizeStyles[size], className)}
    >
      <ol className="flex items-center flex-wrap gap-1">
        {allItems.map((item, index) => {
          const isLast = index === allItems.length - 1;
          const Icon = item.icon;

          return (
            <li key={index} className="flex items-center">
              {/* Separator (except for first item) */}
              {index > 0 && <Separator />}

              {/* Breadcrumb item */}
              {item.href && !isLast ? (
                <a
                  href={item.href}
                  className={clsx(
                    'flex items-center gap-1.5',
                    'text-gray-600 hover:text-gray-900',
                    'transition-colors duration-200',
                    'hover:underline'
                  )}
                >
                  {Icon && <Icon className={iconSizeStyles[size]} />}
                  <span>{item.label}</span>
                </a>
              ) : (
                <span
                  className={clsx(
                    'flex items-center gap-1.5',
                    {
                      'text-gray-900 font-medium': isLast,
                      'text-gray-600': !isLast,
                    }
                  )}
                  aria-current={isLast ? 'page' : undefined}
                >
                  {Icon && <Icon className={iconSizeStyles[size]} />}
                  <span>{item.label}</span>
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

Breadcrumbs.displayName = 'Breadcrumbs';

export default Breadcrumbs;

/**
 * Example Usage:
 * 
 * import Breadcrumbs from '@/components/layout/Breadcrumbs';
 * import { Package, Edit } from 'lucide-react';
 * 
 * // Basic usage
 * <Breadcrumbs 
 *   items={[
 *     { label: 'Products', href: '/products' },
 *     { label: 'Edit Product' }
 *   ]}
 * />
 * 
 * // Without home icon
 * <Breadcrumbs 
 *   showHome={false}
 *   items={[
 *     { label: 'Dashboard', href: '/dashboard' },
 *     { label: 'Products', href: '/products' },
 *     { label: 'Add Product' }
 *   ]}
 * />
 * 
 * // Custom home link
 * <Breadcrumbs 
 *   homeHref="/"
 *   items={[
 *     { label: 'Products', href: '/products' },
 *     { label: 'Electronics', href: '/products/electronics' },
 *     { label: 'Laptops' }
 *   ]}
 * />
 * 
 * // With custom icons
 * <Breadcrumbs 
 *   items={[
 *     { label: 'Products', href: '/products', icon: Package },
 *     { label: 'Edit Product', icon: Edit }
 *   ]}
 * />
 * 
 * // Different separators
 * <Breadcrumbs 
 *   separator="chevron"
 *   items={[
 *     { label: 'Products', href: '/products' },
 *     { label: 'View' }
 *   ]}
 * />
 * 
 * <Breadcrumbs 
 *   separator="slash"
 *   items={[
 *     { label: 'Products', href: '/products' },
 *     { label: 'View' }
 *   ]}
 * />
 * 
 * <Breadcrumbs 
 *   separator="dot"
 *   items={[
 *     { label: 'Products', href: '/products' },
 *     { label: 'View' }
 *   ]}
 * />
 * 
 * // Different sizes
 * <Breadcrumbs 
 *   size="sm"
 *   items={[
 *     { label: 'Products', href: '/products' },
 *     { label: 'View' }
 *   ]}
 * />
 * 
 * <Breadcrumbs 
 *   size="md"
 *   items={[
 *     { label: 'Products', href: '/products' },
 *     { label: 'View' }
 *   ]}
 * />
 * 
 * <Breadcrumbs 
 *   size="lg"
 *   items={[
 *     { label: 'Products', href: '/products' },
 *     { label: 'View' }
 *   ]}
 * />
 * 
 * // POS specific: Product management
 * <Breadcrumbs 
 *   items={[
 *     { label: 'Products', href: '/products' },
 *     { label: 'Add New Product' }
 *   ]}
 * />
 * 
 * <Breadcrumbs 
 *   items={[
 *     { label: 'Products', href: '/products' },
 *     { label: 'Electronics', href: '/products?category=electronics' },
 *     { label: 'Laptop HP 15s' }
 *   ]}
 * />
 * 
 * // POS specific: Sales management
 * <Breadcrumbs 
 *   items={[
 *     { label: 'Sales', href: '/sales' },
 *     { label: 'Today', href: '/sales/today' },
 *     { label: 'Transaction #12345' }
 *   ]}
 * />
 * 
 * // POS specific: Customer management
 * <Breadcrumbs 
 *   items={[
 *     { label: 'Customers', href: '/customers' },
 *     { label: 'John Doe', href: '/customers/123' },
 *     { label: 'Edit Profile' }
 *   ]}
 * />
 * 
 * // POS specific: Reports
 * <Breadcrumbs 
 *   items={[
 *     { label: 'Reports', href: '/reports' },
 *     { label: 'Sales Reports', href: '/reports/sales' },
 *     { label: 'Monthly Report - October 2025' }
 *   ]}
 * />
 * 
 * // POS specific: Inventory
 * <Breadcrumbs 
 *   items={[
 *     { label: 'Inventory', href: '/inventory' },
 *     { label: 'Low Stock', href: '/inventory/low-stock' },
 *     { label: 'Product XYZ' }
 *   ]}
 * />
 * 
 * // POS specific: Settings
 * <Breadcrumbs 
 *   items={[
 *     { label: 'Settings', href: '/settings' },
 *     { label: 'Store Settings', href: '/settings/store' },
 *     { label: 'Payment Methods' }
 *   ]}
 * />
 * 
 * // In a page with PageHeader
 * function ProductEditPage() {
 *   return (
 *     <MainLayout currentPath="/products/edit">
 *       <div className="space-y-4">
 *         <Breadcrumbs 
 *           items={[
 *             { label: 'Products', href: '/products' },
 *             { label: 'Edit Product' }
 *           ]}
 *         />
 *         
 *         <PageHeader 
 *           title="Edit Product"
 *           actions={
 *             <div className="flex gap-2">
 *               <Button variant="outline">Cancel</Button>
 *               <Button variant="primary">Save Changes</Button>
 *             </div>
 *           }
 *         />
 *         
 *         <div className="card">
//  *           {/* Edit form */
//  *         </div>
//  *       </div>
//  *     </MainLayout>
//  *   );
//  * }
//  * 
//  * // Dynamic breadcrumbs from URL
//  * function DynamicBreadcrumbs() {
//  *   const pathname = window.location.pathname;
//  *   const paths = pathname.split('/').filter(Boolean);
//  *   
//  *   const items = paths.map((path, index) => {
//  *     const href = '/' + paths.slice(0, index + 1).join('/');
//  *     const label = path.charAt(0).toUpperCase() + path.slice(1);
//  *     const isLast = index === paths.length - 1;
//  *     
//  *     return {
//  *       label,
//  *       href: isLast ? undefined : href
//  *     };
//  *   });
//  *   
//  *   return <Breadcrumbs items={items} />;
//  * }
//  * 
//  * // With React Router
//  * import { useLocation, Link } from 'react-router-dom';
//  * 
//  * function RouterBreadcrumbs() {
//  *   const location = useLocation();
//  *   const paths = location.pathname.split('/').filter(Boolean);
//  *   
//  *   const items = paths.map((path, index) => {
//  *     const to = '/' + paths.slice(0, index + 1).join('/');
//  *     const label = path.charAt(0).toUpperCase() + path.slice(1);
//  *     const isLast = index === paths.length - 1;
//  *     
//  *     return {
//  *       label,
//  *       href: to,
//  *       isLast
//  *     };
//  *   });
//  *   
//  *   return (
//  *     <nav className="flex items-center text-sm">
//  *       {items.map((item, index) => (
//  *         <div key={index} className="flex items-center">
//  *           {index > 0 && <ChevronRight className="h-4 w-4 text-gray-400 mx-1" />}
//  *           {item.isLast ? (
//  *             <span className="text-gray-900 font-medium">{item.label}</span>
//  *           ) : (
//  *             <Link to={item.href} className="text-gray-600 hover:text-gray-900">
//  *               {item.label}
//  *             </Link>
//  *           )}
//  *         </div>
//  *       ))}
//  *     </nav>
//  *   );
//  * }
//  * 
//  * // With custom styling
//  * <Breadcrumbs 
//  *   className="mb-4 p-3 bg-gray-50 rounded-lg"
//  *   items={[
//  *     { label: 'Products', href: '/products' },
//  *     { label: 'View' }
//  *   ]}
//  * />
//  * 
//  * // Complete page example
//  * function ProductDetailPage({ product }) {
//  *   return (
//  *     <MainLayout currentPath="/products/123">
//  *       <div className="space-y-6">
//  *         {/* Breadcrumbs */}
//  *         <Breadcrumbs 
//  *           items={[
//  *             { label: 'Products', href: '/products' },
//  *             { label: product.category, href: `/products?category=${product.category}` },
//  *             { label: product.name }
//  *           ]}
//  *         />
//  *         
//  *         {/* Page Header */}
//  *         <PageHeader 
//  *           title={product.name}
//  *           description={`SKU: ${product.sku}`}
//  *           actions={
//  *             <div className="flex gap-2">
//  *               <Button variant="outline">Edit</Button>
//  *               <Button variant="danger">Delete</Button>
//  *             </div>
//  *           }
//  *         />
//  *         
//  *         {/* Content */}
//  *         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//  *           {/* Product details */}
//  *         </div>
//  *       </div>
//  *     </MainLayout>
//  *   );
//  * }
//  */