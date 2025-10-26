// src/components/dashboard/TopProducts.jsx
import { useState } from 'react';
import Card, { CardHeader, CardBody } from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';
import { Tabs, TabsList, TabsTrigger } from '../common/Tabs';
import { Package, TrendingUp, ExternalLink } from 'lucide-react';
import clsx from 'clsx';

/**
 * TopProducts Component
 * 
 * Displays top-selling or trending products with sales data and rankings.
 * Supports multiple sorting options and time periods.
 * 
 * @example
 * <TopProducts
 *   products={products}
 *   sortBy="sales"
 *   onProductClick={(product) => navigate(`/products/${product.id}`)}
 * />
 */

const TopProducts = ({
  products = [],
  loading = false,
  title = 'Top Products',
  maxItems = 10,
  showSortTabs = true,
  showViewAll = true,
  defaultSortBy = 'sales',
  onSortChange,
  onViewAll,
  onProductClick,
  currency = '₪',
  className = '',
}) => {
  const [sortBy, setSortBy] = useState(defaultSortBy);

  // Sort options
  const sortOptions = [
    { value: 'sales', label: 'Sales' },
    { value: 'revenue', label: 'Revenue' },
    { value: 'trending', label: 'Trending' },
  ];

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    onSortChange?.(newSort);
  };

  // Display limited products
  const displayedProducts = products.slice(0, maxItems);

  // Get medal emoji for top 3
  const getRankBadge = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  // Calculate percentage for progress bar
  const getProgressPercentage = (value, maxValue) => {
    return maxValue > 0 ? (value / maxValue) * 100 : 0;
  };

  const maxValue = Math.max(...products.map(p => 
    sortBy === 'revenue' ? p.revenue : p.sales
  ), 0);

  return (
    <Card className={clsx('h-full', className)}>
      <CardHeader
        title={title}
        subtitle={`${products.length} products`}
        icon={Package}
        action={
          showViewAll && products.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              icon={ExternalLink}
              onClick={onViewAll}
            >
              View All
            </Button>
          )
        }
      />

      <CardBody>
        {/* Sort Tabs */}
        {showSortTabs && (
          <div className="mb-6">
            <Tabs value={sortBy} onValueChange={handleSortChange}>
              <TabsList variant="enclosed" fullWidth>
                {sortOptions.map((option) => (
                  <TabsTrigger
                    key={option.value}
                    value={option.value}
                    className="flex-1"
                  >
                    {option.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        )}

        {/* Products List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" label="Loading products..." />
          </div>
        ) : products.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No products found"
            description="Product sales data will appear here"
            size="sm"
          />
        ) : (
          <div className="space-y-4">
            {displayedProducts.map((product, index) => {
              const value = sortBy === 'revenue' ? product.revenue : product.sales;
              const percentage = getProgressPercentage(value, maxValue);

              return (
                <div
                  key={product.id}
                  className={clsx(
                    'group transition-all duration-200',
                    onProductClick && 'cursor-pointer hover:scale-[1.02]'
                  )}
                  onClick={() => onProductClick?.(product)}
                >
                  {/* Product Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Rank Badge */}
                      <span className="text-lg font-bold text-gray-400 min-w-[2rem]">
                        {getRankBadge(index)}
                      </span>

                      {/* Product Image/Icon */}
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                      )}

                      {/* Product Name and Category */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate group-hover:text-primary-600 transition-colors">
                          {product.name}
                        </p>
                        {product.category && (
                          <p className="text-xs text-gray-500 truncate">
                            {product.category}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Value and Change */}
                    <div className="flex items-center gap-3 flex-shrink-0 ml-4">
                      {/* Change Badge */}
                      {product.change && (
                        <Badge
                          variant={product.change > 0 ? 'success' : 'danger'}
                          size="xs"
                          icon={TrendingUp}
                        >
                          {product.change > 0 ? '+' : ''}{product.change}%
                        </Badge>
                      )}

                      {/* Main Value */}
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {sortBy === 'revenue' 
                            ? `${currency}${value.toLocaleString()}`
                            : `${value.toLocaleString()} sold`
                          }
                        </p>
                        {sortBy === 'trending' && product.views && (
                          <p className="text-xs text-gray-500">
                            {product.views.toLocaleString()} views
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={clsx(
                        'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                        {
                          'bg-gradient-to-r from-yellow-400 to-yellow-500': index === 0,
                          'bg-gradient-to-r from-gray-300 to-gray-400': index === 1,
                          'bg-gradient-to-r from-orange-400 to-orange-500': index === 2,
                          'bg-primary-500': index > 2,
                        }
                      )}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

TopProducts.displayName = 'TopProducts';

export default TopProducts;

/**
 * Example Usage:
 * 
 * import TopProducts from '@/components/dashboard/TopProducts';
 * 
 * // Sample data
 * const products = [
 *   {
 *     id: '1',
 *     name: 'Wireless Mouse',
 *     category: 'Electronics',
 *     sales: 245,
 *     revenue: 12250,
 *     views: 1520,
 *     change: 15,
 *     image: '/products/mouse.jpg',
 *   },
 *   {
 *     id: '2',
 *     name: 'USB-C Cable',
 *     category: 'Accessories',
 *     sales: 189,
 *     revenue: 3780,
 *     views: 980,
 *     change: -5,
 *     image: '/products/cable.jpg',
 *   },
 *   {
 *     id: '3',
 *     name: 'Keyboard',
 *     category: 'Electronics',
 *     sales: 156,
 *     revenue: 15600,
 *     views: 750,
 *     change: 8,
 *   },
 * ];
 * 
 * // Basic usage
 * <TopProducts products={products} />
 * 
 * // With loading state
 * <TopProducts products={products} loading={isLoading} />
 * 
 * // With click handlers
 * <TopProducts
 *   products={products}
 *   onProductClick={(product) => navigate(`/products/${product.id}`)}
 *   onViewAll={() => navigate('/products')}
 *   onSortChange={(sort) => fetchProducts(sort)}
 * />
 * 
 * // Custom configuration
 * <TopProducts
 *   products={products}
 *   title="Best Sellers"
 *   maxItems={5}
 *   defaultSortBy="revenue"
 * />
 * 
 * // Complete dashboard implementation
 * const Dashboard = () => {
 *   const [products, setProducts] = useState([]);
 *   const [loading, setLoading] = useState(true);
 *   const [sortBy, setSortBy] = useState('sales');
 * 
 *   useEffect(() => {
 *     fetchTopProducts(sortBy);
 *   }, [sortBy]);
 * 
 *   const fetchTopProducts = async (sort) => {
 *     setLoading(true);
 *     const data = await api.getTopProducts({ sortBy: sort });
 *     setProducts(data);
 *     setLoading(false);
 *   };
 * 
 *   return (
 *     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 *       <TopProducts
 *         products={products}
 *         loading={loading}
 *         onSortChange={setSortBy}
 *         onProductClick={(product) => {
 *           navigate(`/products/${product.id}`);
 *         }}
 *       />
 *     </div>
 *   );
 * };
 * 
 * // With multiple sort options
 * <TopProducts
 *   products={products}
 *   showSortTabs
 *   defaultSortBy="sales"
 *   onSortChange={(sort) => {
 *     console.log('Sorting by:', sort);
 *     refetchProducts(sort);
 *   }}
 * />
 * 
 * // Dashboard layout with all components
 * const POSDashboard = () => {
 *   return (
 *     <div className="space-y-6">
//  *       {/* Stats Cards */
//  *       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//  *         <StatCard
//  *           title="Today's Sales"
//  *           value="₪12,345"
//  *           icon={DollarSign}
//  *           trend="up"
//  *           trendValue="+12%"
//  *           color="success"
//  *         />
//  *         <StatCard
//  *           title="Orders"
//  *           value="156"
//  *           icon={ShoppingCart}
//  *           trend="up"
//  *           trendValue="+8%"
//  *           color="primary"
//  *         />
//  *         <StatCard
//  *           title="Products"
//  *           value="1,234"
//  *           icon={Package}
//  *           color="gray"
//  *         />
//  *         <StatCard
//  *           title="Low Stock"
//  *           value="23"
//  *           icon={AlertTriangle}
//  *           color="warning"
//  *         />
//  *       </div>
//  * 
//  *       {/* Charts and Lists */}
//  *       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
//  *         {/* Sales Chart - Takes 2 columns */}
//  *         <div className="lg:col-span-2">
//  *           <SalesChart
//  *             data={salesData}
//  *             loading={loadingSales}
//  *             onPeriodChange={fetchSalesData}
//  *           />
//  *         </div>
//  * 
//  *         {/* Top Products - Takes 1 column */}
//  *         <TopProducts
//  *           products={topProducts}
//  *           loading={loadingProducts}
//  *           onProductClick={(p) => navigate(`/products/${p.id}`)}
//  *         />
//  *       </div>
//  * 
//  *       {/* Recent Transactions */}
//  *       <RecentTransactions
//  *         transactions={recentTransactions}
//  *         loading={loadingTransactions}
//  *         onViewDetails={(t) => navigate(`/transactions/${t.id}`)}
//  *       />
//  *     </div>
//  *   );
//  * };