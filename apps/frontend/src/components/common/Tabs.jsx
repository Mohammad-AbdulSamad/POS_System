// src/components/common/Tabs.jsx
import { useState, createContext, useContext } from 'react';
import clsx from 'clsx';

/**
 * Tabs Context
 */
const TabsContext = createContext();

/**
 * Tabs Component
 * 
 * A reusable tabs component for organizing content into separate views.
 * Uses Tailwind CSS and custom theme variables from index.css
 * 
 * @example
 * <Tabs defaultValue="tab1">
 *   <TabsList>
 *     <TabsTrigger value="tab1">Products</TabsTrigger>
 *     <TabsTrigger value="tab2">Sales</TabsTrigger>
 *   </TabsList>
 *   <TabsContent value="tab1">Products content</TabsContent>
 *   <TabsContent value="tab2">Sales content</TabsContent>
 * </Tabs>
 */

export const Tabs = ({
  defaultValue,
  value: controlledValue,
  onValueChange,
  orientation = 'horizontal',
  className = '',
  children,
}) => {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const value = controlledValue !== undefined ? controlledValue : internalValue;

  const handleValueChange = (newValue) => {
    if (controlledValue === undefined) {
      setInternalValue(newValue);
    }
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ value, onValueChange: handleValueChange, orientation }}>
      <div className={clsx('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  );
};

/**
 * TabsList Component
 * Container for tab triggers
 */
export const TabsList = ({
  variant = 'line',
  size = 'md',
  fullWidth = false,
  className = '',
  children,
}) => {
  const { orientation } = useContext(TabsContext);

  const variantStyles = {
    line: clsx(
      'border-b border-gray-200',
      orientation === 'horizontal' ? 'flex' : 'flex flex-col border-b-0 border-r'
    ),
    enclosed: clsx(
      'bg-gray-100 rounded-lg p-1',
      orientation === 'horizontal' ? 'inline-flex' : 'inline-flex flex-col'
    ),
    pills: clsx(
      'gap-2',
      orientation === 'horizontal' ? 'flex' : 'flex flex-col'
    ),
  };

  return (
    <div
      role="tablist"
      aria-orientation={orientation}
      className={clsx(
        variantStyles[variant],
        { 'w-full': fullWidth && variant !== 'enclosed' },
        className
      )}
    >
      {children}
    </div>
  );
};

/**
 * TabsTrigger Component
 * Individual tab button
 */
export const TabsTrigger = ({
  value,
  disabled = false,
  icon: Icon = null,
  badge = null,
  className = '',
  children,
}) => {
  const { value: selectedValue, onValueChange, orientation } = useContext(TabsContext);
  const isActive = selectedValue === value;

  // Determine parent variant by checking className patterns
  const parentList = document.querySelector('[role="tablist"]');
  const parentClasses = parentList?.className || '';
  const variant = parentClasses.includes('bg-gray-100') 
    ? 'enclosed' 
    : parentClasses.includes('gap-2') 
    ? 'pills' 
    : 'line';

  const baseStyles = clsx(
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2',
    'whitespace-nowrap',
    {
      'cursor-pointer': !disabled,
      'cursor-not-allowed opacity-50': disabled,
    }
  );

  const variantStyles = {
    line: clsx(
      'px-4 py-3 text-sm border-b-2',
      orientation === 'horizontal' 
        ? '-mb-px border-b-2' 
        : '-mr-px border-r-2 border-b-0',
      {
        'text-primary-600 border-primary-600': isActive && !disabled,
        'text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300': !isActive && !disabled,
        'text-gray-400 border-transparent': disabled,
      }
    ),
    enclosed: clsx(
      'px-4 py-2 text-sm rounded-md',
      {
        'bg-white text-gray-900 shadow-sm': isActive && !disabled,
        'text-gray-600 hover:text-gray-900': !isActive && !disabled,
        'text-gray-400': disabled,
      }
    ),
    pills: clsx(
      'px-4 py-2 text-sm rounded-lg',
      {
        'bg-primary-500 text-white shadow-sm': isActive && !disabled,
        'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900': !isActive && !disabled,
        'bg-gray-100 text-gray-400': disabled,
      }
    ),
  };

  return (
    <button
      role="tab"
      type="button"
      aria-selected={isActive}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={() => !disabled && onValueChange(value)}
      className={clsx(baseStyles, variantStyles[variant], className)}
    >
      {Icon && <Icon className="h-4 w-4" />}
      {children}
      {badge && <span className="ml-1">{badge}</span>}
    </button>
  );
};

/**
 * TabsContent Component
 * Content panel for each tab
 */
export const TabsContent = ({
  value,
  className = '',
  children,
}) => {
  const { value: selectedValue } = useContext(TabsContext);
  const isActive = selectedValue === value;

  if (!isActive) return null;

  return (
    <div
      role="tabpanel"
      aria-hidden={!isActive}
      className={clsx(
        'mt-4 focus:outline-none',
        'animate-fadeIn',
        className
      )}
    >
      {children}
    </div>
  );
};

Tabs.displayName = 'Tabs';
TabsList.displayName = 'TabsList';
TabsTrigger.displayName = 'TabsTrigger';
TabsContent.displayName = 'TabsContent';

export default Tabs;

/**
 * Example Usage:
 * 
 * import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/common/Tabs';
 * import { Package, ShoppingCart, Users, BarChart, Settings } from 'lucide-react';
 * import Badge from '@/components/common/Badge';
 * 
 * // Basic usage (line variant - default)
 * <Tabs defaultValue="products">
 *   <TabsList>
 *     <TabsTrigger value="products">Products</TabsTrigger>
 *     <TabsTrigger value="sales">Sales</TabsTrigger>
 *     <TabsTrigger value="customers">Customers</TabsTrigger>
 *   </TabsList>
 *   
 *   <TabsContent value="products">
 *     <div className="p-4">
 *       <h3 className="text-lg font-semibold mb-2">Products Overview</h3>
 *       <p>Manage your product inventory here.</p>
 *     </div>
 *   </TabsContent>
 *   
 *   <TabsContent value="sales">
 *     <div className="p-4">
 *       <h3 className="text-lg font-semibold mb-2">Sales Dashboard</h3>
 *       <p>View your sales analytics and reports.</p>
 *     </div>
 *   </TabsContent>
 *   
 *   <TabsContent value="customers">
 *     <div className="p-4">
 *       <h3 className="text-lg font-semibold mb-2">Customer Management</h3>
 *       <p>Manage your customer database.</p>
 *     </div>
 *   </TabsContent>
 * </Tabs>
 * 
 * // With icons
 * <Tabs defaultValue="products">
 *   <TabsList>
 *     <TabsTrigger value="products" icon={Package}>
 *       Products
 *     </TabsTrigger>
 *     <TabsTrigger value="sales" icon={ShoppingCart}>
 *       Sales
 *     </TabsTrigger>
 *     <TabsTrigger value="customers" icon={Users}>
 *       Customers
 *     </TabsTrigger>
 *     <TabsTrigger value="analytics" icon={BarChart}>
 *       Analytics
 *     </TabsTrigger>
 *   </TabsList>
 *   
 *   <TabsContent value="products">Products content...</TabsContent>
 *   <TabsContent value="sales">Sales content...</TabsContent>
 *   <TabsContent value="customers">Customers content...</TabsContent>
 *   <TabsContent value="analytics">Analytics content...</TabsContent>
 * </Tabs>
 * 
 * // With badges (notification counts)
 * <Tabs defaultValue="all">
 *   <TabsList>
 *     <TabsTrigger 
 *       value="all" 
 *       badge={<Badge variant="gray" size="xs">24</Badge>}
 *     >
 *       All Orders
 *     </TabsTrigger>
 *     <TabsTrigger 
 *       value="pending" 
 *       badge={<Badge variant="warning" size="xs">5</Badge>}
 *     >
 *       Pending
 *     </TabsTrigger>
 *     <TabsTrigger 
 *       value="completed" 
 *       badge={<Badge variant="success" size="xs">18</Badge>}
 *     >
 *       Completed
 *     </TabsTrigger>
 *     <TabsTrigger 
 *       value="cancelled" 
 *       badge={<Badge variant="danger" size="xs">1</Badge>}
 *     >
 *       Cancelled
 *     </TabsTrigger>
 *   </TabsList>
 *   
 *   <TabsContent value="all">All orders list...</TabsContent>
 *   <TabsContent value="pending">Pending orders...</TabsContent>
 *   <TabsContent value="completed">Completed orders...</TabsContent>
 *   <TabsContent value="cancelled">Cancelled orders...</TabsContent>
 * </Tabs>
 * 
 * // Enclosed variant (button-style tabs)
 * <Tabs defaultValue="overview">
 *   <TabsList variant="enclosed">
 *     <TabsTrigger value="overview">Overview</TabsTrigger>
 *     <TabsTrigger value="details">Details</TabsTrigger>
 *     <TabsTrigger value="history">History</TabsTrigger>
 *   </TabsList>
 *   
 *   <TabsContent value="overview">Overview content...</TabsContent>
 *   <TabsContent value="details">Details content...</TabsContent>
 *   <TabsContent value="history">History content...</TabsContent>
 * </Tabs>
 * 
 * // Pills variant (rounded pill-style tabs)
 * <Tabs defaultValue="active">
 *   <TabsList variant="pills">
 *     <TabsTrigger value="active" icon={Package}>Active</TabsTrigger>
 *     <TabsTrigger value="inactive">Inactive</TabsTrigger>
 *     <TabsTrigger value="archived">Archived</TabsTrigger>
 *   </TabsList>
 *   
 *   <TabsContent value="active">Active products...</TabsContent>
 *   <TabsContent value="inactive">Inactive products...</TabsContent>
 *   <TabsContent value="archived">Archived products...</TabsContent>
 * </Tabs>
 * 
 * // Controlled tabs
 * const [activeTab, setActiveTab] = useState('products');
 * 
 * <Tabs value={activeTab} onValueChange={setActiveTab}>
 *   <TabsList>
 *     <TabsTrigger value="products">Products</TabsTrigger>
 *     <TabsTrigger value="inventory">Inventory</TabsTrigger>
 *   </TabsList>
 *   
 *   <TabsContent value="products">Products content...</TabsContent>
 *   <TabsContent value="inventory">Inventory content...</TabsContent>
 * </Tabs>
 * 
 * <Button onClick={() => setActiveTab('inventory')}>
 *   Go to Inventory Tab
 * </Button>
 * 
 * // With disabled tab
 * <Tabs defaultValue="basic">
 *   <TabsList>
 *     <TabsTrigger value="basic">Basic Info</TabsTrigger>
 *     <TabsTrigger value="advanced">Advanced</TabsTrigger>
 *     <TabsTrigger value="settings" disabled>
 *       Settings (Coming Soon)
 *     </TabsTrigger>
 *   </TabsList>
 *   
 *   <TabsContent value="basic">Basic info...</TabsContent>
 *   <TabsContent value="advanced">Advanced settings...</TabsContent>
 * </Tabs>
 * 
 * // Full width tabs
 * <Tabs defaultValue="tab1">
 *   <TabsList fullWidth>
 *     <TabsTrigger value="tab1" className="flex-1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2" className="flex-1">Tab 2</TabsTrigger>
 *     <TabsTrigger value="tab3" className="flex-1">Tab 3</TabsTrigger>
 *   </TabsList>
 *   
 *   <TabsContent value="tab1">Content 1...</TabsContent>
 *   <TabsContent value="tab2">Content 2...</TabsContent>
 *   <TabsContent value="tab3">Content 3...</TabsContent>
 * </Tabs>
 * 
 * // POS specific: Product management sections
 * <Tabs defaultValue="inventory">
 *   <TabsList>
 *     <TabsTrigger value="inventory" icon={Package}>
 *       Inventory
 *     </TabsTrigger>
 *     <TabsTrigger value="categories" icon={Tag}>
 *       Categories
 *     </TabsTrigger>
 *     <TabsTrigger value="suppliers" icon={Truck}>
 *       Suppliers
 *     </TabsTrigger>
 *     <TabsTrigger value="pricing" icon={DollarSign}>
 *       Pricing
 *     </TabsTrigger>
 *   </TabsList>
 *   
 *   <TabsContent value="inventory">
 *     {/* Product inventory table */
//  *   </TabsContent>
//  *   <TabsContent value="categories">
//  *     {/* Category management */}
//  *   </TabsContent>
//  *   <TabsContent value="suppliers">
//  *     {/* Supplier list */}
//  *   </TabsContent>
//  *   <TabsContent value="pricing">
//  *     {/* Pricing rules */}
//  *   </TabsContent>
//  * </Tabs>
//  * 
//  * // POS specific: Transaction history filters
//  * <Tabs defaultValue="today">
//  *   <TabsList variant="pills">
//  *     <TabsTrigger value="today">Today</TabsTrigger>
//  *     <TabsTrigger value="week">This Week</TabsTrigger>
//  *     <TabsTrigger value="month">This Month</TabsTrigger>
//  *     <TabsTrigger value="year">This Year</TabsTrigger>
//  *     <TabsTrigger value="all">All Time</TabsTrigger>
//  *   </TabsList>
//  *   
//  *   <TabsContent value="today">
//  *     {/* Today's transactions */}
//  *   </TabsContent>
//  *   <TabsContent value="week">
//  *     {/* This week's transactions */}
//  *   </TabsContent>
//  *   {/* ... other contents */}
//  * </Tabs>
//  * 
//  * // POS specific: Reports dashboard
//  * <Tabs defaultValue="sales">
//  *   <TabsList>
//  *     <TabsTrigger value="sales" icon={TrendingUp}>
//  *       Sales Report
//  *     </TabsTrigger>
//  *     <TabsTrigger value="inventory" icon={Package}>
//  *       Inventory Report
//  *     </TabsTrigger>
//  *     <TabsTrigger value="customers" icon={Users}>
//  *       Customer Report
//  *     </TabsTrigger>
//  *     <TabsTrigger value="financial" icon={DollarSign}>
//  *       Financial Report
//  *     </TabsTrigger>
//  *   </TabsList>
//  *   
//  *   <TabsContent value="sales">
//  *     {/* Sales charts and statistics */}
//  *   </TabsContent>
//  *   <TabsContent value="inventory">
//  *     {/* Inventory analytics */}
//  *   </TabsContent>
//  *   <TabsContent value="customers">
//  *     {/* Customer insights */}
//  *   </TabsContent>
//  *   <TabsContent value="financial">
//  *     {/* Financial overview */}
//  *   </TabsContent>
//  * </Tabs>
//  */