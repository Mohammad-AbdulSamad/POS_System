// src/components/common/EmptyState.jsx
import { forwardRef } from 'react';
import clsx from 'clsx';
import { 
  PackageOpen, 
  ShoppingCart, 
  Users, 
  Search,
  FileText,
  Inbox
} from 'lucide-react';

/**
 * EmptyState Component
 * 
 * A reusable empty state component for displaying when no data is available.
 * Provides helpful messaging and optional actions for users.
 * 
 * @example
 * <EmptyState
 *   icon={PackageOpen}
 *   title="No products found"
 *   description="Get started by adding your first product"
 *   action={<Button>Add Product</Button>}
 * />
 */

const EmptyState = forwardRef(
  (
    {
      icon: Icon = Inbox,
      title = 'No data available',
      description,
      action,
      children,
      size = 'md',
      variant = 'default',
      className = '',
      ...props
    },
    ref
  ) => {
    // Size styles
    const sizeStyles = {
      sm: {
        container: 'py-8',
        icon: 'h-12 w-12',
        title: 'text-base',
        description: 'text-xs',
      },
      md: {
        container: 'py-12',
        icon: 'h-16 w-16',
        title: 'text-lg',
        description: 'text-sm',
      },
      lg: {
        container: 'py-16',
        icon: 'h-20 w-20',
        title: 'text-xl',
        description: 'text-base',
      },
    };

    // Variant styles
    const variantStyles = {
      default: {
        icon: 'text-gray-400',
        title: 'text-gray-900',
        description: 'text-gray-500',
      },
      primary: {
        icon: 'text-primary-400',
        title: 'text-primary-900',
        description: 'text-primary-600',
      },
      success: {
        icon: 'text-success-400',
        title: 'text-success-900',
        description: 'text-success-600',
      },
      warning: {
        icon: 'text-warning-400',
        title: 'text-warning-900',
        description: 'text-warning-600',
      },
      danger: {
        icon: 'text-danger-400',
        title: 'text-danger-900',
        description: 'text-danger-600',
      },
    };

    const currentSize = sizeStyles[size];
    const currentVariant = variantStyles[variant];

    return (
      <div
        ref={ref}
        className={clsx(
          'flex flex-col items-center justify-center text-center',
          currentSize.container,
          className
        )}
        {...props}
      >
        {/* Icon */}
        {Icon && (
          <div className={clsx(
            'mb-4 rounded-full p-4 bg-gray-50',
            currentSize.icon
          )}>
            <Icon className={clsx('w-full h-full', currentVariant.icon)} />
          </div>
        )}

        {/* Title */}
        <h3 className={clsx(
          'font-semibold mb-2',
          currentSize.title,
          currentVariant.title
        )}>
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className={clsx(
            'max-w-md mb-4',
            currentSize.description,
            currentVariant.description
          )}>
            {description}
          </p>
        )}

        {/* Custom children content */}
        {children && (
          <div className="mb-4">
            {children}
          </div>
        )}

        {/* Action */}
        {action && (
          <div className="mt-2">
            {action}
          </div>
        )}
      </div>
    );
  }
);

EmptyState.displayName = 'EmptyState';

export default EmptyState;

/**
 * Example Usage:
 * 
 * import EmptyState from '@/components/common/EmptyState';
 * import Button from '@/components/common/Button';
 * import { 
 *   PackageOpen, 
 *   ShoppingCart, 
 *   Users, 
 *   Search,
 *   FileText,
 *   Receipt,
 *   Tag,
 *   AlertCircle
 * } from 'lucide-react';
 * 
 * // Basic usage
 * <EmptyState
 *   title="No items found"
 *   description="There are no items to display"
 * />
 * 
 * // With custom icon
 * <EmptyState
 *   icon={PackageOpen}
 *   title="No products available"
 *   description="Start by adding your first product to the inventory"
 * />
 * 
 * // With action button
 * <EmptyState
 *   icon={PackageOpen}
 *   title="No products found"
 *   description="Get started by adding your first product"
 *   action={
 *     <Button variant="primary" icon={Plus}>
 *       Add Product
 *     </Button>
 *   }
 * />
 * 
 * // Different sizes
 * <EmptyState
 *   size="sm"
 *   icon={Search}
 *   title="No results"
 *   description="Try adjusting your search"
 * />
 * 
 * <EmptyState
 *   size="md"
 *   icon={PackageOpen}
 *   title="No products"
 * />
 * 
 * <EmptyState
 *   size="lg"
 *   icon={ShoppingCart}
 *   title="Your cart is empty"
 *   description="Add some products to get started"
 * />
 * 
 * // Different variants
 * <EmptyState
 *   variant="primary"
 *   icon={Inbox}
 *   title="Welcome!"
 *   description="Let's get started with your first item"
 * />
 * 
 * <EmptyState
 *   variant="warning"
 *   icon={AlertCircle}
 *   title="No data available"
 *   description="Data sync is in progress"
 * />
 * 
 * <EmptyState
 *   variant="danger"
 *   icon={XCircle}
 *   title="Failed to load"
 *   description="Could not fetch data from server"
 * />
 * 
 * // With multiple actions
 * <EmptyState
 *   icon={PackageOpen}
 *   title="No products in inventory"
 *   description="You haven't added any products yet"
 *   action={
 *     <div className="flex gap-2">
 *       <Button variant="primary">Add Product</Button>
 *       <Button variant="outline">Import Products</Button>
 *     </div>
 *   }
 * />
 * 
 * // With custom content
 * <EmptyState
 *   icon={Search}
 *   title="No results found"
 *   description="We couldn't find any matches for your search"
 * >
 *   <div className="bg-gray-50 rounded-lg p-4 mb-2">
 *     <p className="text-sm text-gray-600">Try searching for:</p>
 *     <div className="flex gap-2 mt-2">
 *       <Badge variant="gray">Electronics</Badge>
 *       <Badge variant="gray">Clothing</Badge>
 *       <Badge variant="gray">Food</Badge>
 *     </div>
 *   </div>
 * </EmptyState>
 * 
 * // POS specific: Empty cart
 * <EmptyState
 *   icon={ShoppingCart}
 *   title="Cart is empty"
 *   description="Scan items or search for products to add them to the cart"
 *   action={
 *     <Button variant="primary" icon={Search}>
 *       Search Products
 *     </Button>
 *   }
 * />
 * 
 * // POS specific: No products
 * <EmptyState
 *   icon={PackageOpen}
 *   title="No products in inventory"
 *   description="Add products to start managing your inventory"
 *   action={
 *     <div className="flex gap-3">
 *       <Button variant="primary" icon={Plus}>
 *         Add Product
 *       </Button>
 *       <Button variant="outline" icon={Upload}>
 *         Import CSV
 *       </Button>
 *     </div>
 *   }
 * />
 * 
 * // POS specific: No transactions
 * <EmptyState
 *   icon={Receipt}
 *   title="No transactions yet"
 *   description="Completed transactions will appear here"
 *   size="lg"
 * />
 * 
 * // POS specific: No customers
 * <EmptyState
 *   icon={Users}
 *   title="No customers found"
 *   description="Start building your customer database"
 *   action={
 *     <Button variant="primary" icon={Plus}>
 *       Add Customer
 *     </Button>
 *   }
 * />
 * 
 * // POS specific: Search results
 * <EmptyState
 *   icon={Search}
 *   title="No products found"
 *   description={`No results for "${searchQuery}"`}
 *   action={
 *     <Button variant="outline" onClick={clearSearch}>
 *       Clear Search
 *     </Button>
 *   }
 *   size="sm"
 * />
 * 
 * // POS specific: Filtered results
 * <EmptyState
 *   icon={Filter}
 *   title="No items match your filters"
 *   description="Try adjusting your filter criteria"
 *   action={
 *     <Button variant="outline" onClick={clearFilters}>
 *       Clear Filters
 *     </Button>
 *   }
 * />
 * 
 * // POS specific: No sales today
 * <EmptyState
 *   icon={TrendingUp}
 *   title="No sales today"
 *   description="Sales data will appear here once you complete your first transaction"
 *   variant="primary"
 * />
 * 
 * // POS specific: Out of stock
 * <EmptyState
 *   icon={AlertTriangle}
 *   title="Product out of stock"
 *   description="This product is currently unavailable"
 *   variant="warning"
 *   action={
 *     <Button variant="warning">
 *       Notify When Available
 *     </Button>
 *   }
 * />
 * 
 * // POS specific: No reports
 * <EmptyState
 *   icon={FileText}
 *   title="No reports generated"
 *   description="Generate your first report to view analytics"
 *   action={
 *     <Button variant="primary" icon={Plus}>
 *       Generate Report
 *     </Button>
 *   }
 * />
 * 
 * // POS specific: No categories
 * <EmptyState
 *   icon={Tag}
 *   title="No categories created"
 *   description="Organize your products by creating categories"
 *   action={
 *     <Button variant="primary" icon={Plus}>
 *       Create Category
 *     </Button>
 *   }
 * />
 * 
 * // POS specific: Network error
 * <EmptyState
 *   icon={AlertCircle}
 *   title="Connection lost"
 *   description="Unable to connect to the server. Check your internet connection."
 *   variant="danger"
 *   action={
 *     <Button variant="primary" icon={RefreshCw}>
 *       Retry
 *     </Button>
 *   }
 * />
 * 
 * // In a table
 * const ProductTable = ({ products }) => {
 *   if (products.length === 0) {
 *     return (
 *       <div className="table-container">
 *         <EmptyState
 *           icon={PackageOpen}
 *           title="No products available"
 *           description="Add products to see them listed here"
 *           action={
 *             <Button variant="primary">Add Product</Button>
 *           }
 *         />
 *       </div>
 *     );
 *   }
 * 
 *   return (
 *     <table className="table-container">
 *       {/* Table content */
//  *     </table>
//  *   );
//  * };
//  * 
//  * // In a card
//  * <div className="card">
//  *   <EmptyState
//  *     icon={ShoppingCart}
//  *     title="No recent orders"
//  *     description="Recent orders will appear here"
//  *     size="sm"
//  *   />
//  * </div>
//  * 
//  * // Conditional rendering
//  * {products.length === 0 ? (
//  *   <EmptyState
//  *     icon={PackageOpen}
//  *     title="No products"
//  *     action={<Button>Add Product</Button>}
//  *   />
//  * ) : (
//  *   <ProductGrid products={products} />
//  * )}
//  * 
//  * // With loading state
//  * const ProductList = () => {
//  *   const [products, setProducts] = useState([]);
//  *   const [loading, setLoading] = useState(true);
//  * 
//  *   if (loading) {
//  *     return <Spinner size="lg" label="Loading products..." />;
//  *   }
//  * 
//  *   if (products.length === 0) {
//  *     return (
//  *       <EmptyState
//  *         icon={PackageOpen}
//  *         title="No products found"
//  *         action={<Button>Add Product</Button>}
//  *       />
//  *     );
//  *   }
//  * 
//  *   return <div>{/* Product list */}</div>;
//  * };
//  * 
//  * // Multiple empty states for different scenarios
//  * const Dashboard = ({ hasProducts, hasCustomers, hasSales }) => {
//  *   return (
//  *     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//  *       <div className="card">
//  *         {!hasProducts && (
//  *           <EmptyState
//  *             icon={PackageOpen}
//  *             title="No products"
//  *             size="sm"
//  *             action={<Button size="sm">Add</Button>}
//  *           />
//  *         )}
//  *       </div>
//  *       
//  *       <div className="card">
//  *         {!hasCustomers && (
//  *           <EmptyState
//  *             icon={Users}
//  *             title="No customers"
//  *             size="sm"
//  *             action={<Button size="sm">Add</Button>}
//  *           />
//  *         )}
//  *       </div>
//  *       
//  *       <div className="card">
//  *         {!hasSales && (
//  *           <EmptyState
//  *             icon={Receipt}
//  *             title="No sales"
//  *             size="sm"
//  *           />
//  *         )}
//  *       </div>
//  *     </div>
//  *   );
//  * };
//  * 
//  * // With custom styling
//  * <EmptyState
//  *   icon={PackageOpen}
//  *   title="Custom styled empty state"
//  *   className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300"
//  * />
//  */