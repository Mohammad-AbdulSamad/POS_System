// src/components/dashboard/LowStockWidget.jsx
import { useState } from 'react';
import Card, { CardHeader, CardBody } from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';
import Alert from '../common/Alert';
import { 
  AlertTriangle, 
  Package, 
  ExternalLink, 
  RefreshCw,
  CheckCircle,
  XCircle
} from 'lucide-react';
import clsx from 'clsx';

/**
 * LowStockWidget Component
 * 
 * Displays products with low or out-of-stock inventory with alerts and quick actions.
 * Helps manage inventory proactively with reorder suggestions.
 * 
 * @example
 * <LowStockWidget
 *   items={lowStockItems}
 *   onReorder={(item) => handleReorder(item)}
 *   onViewAll={() => navigate('/inventory?filter=low-stock')}
 * />
 */

const LowStockWidget = ({
  items = [],
  loading = false,
  title = 'Low Stock Alert',
  threshold = 10,
  maxItems = 5,
  showViewAll = true,
  showReorderButton = true,
  onReorder,
  onViewAll,
  onItemClick,
  onDismiss,
  className = '',
}) => {
  const [processingIds, setProcessingIds] = useState(new Set());
  const [dismissedIds, setDismissedIds] = useState(new Set());

  // Filter out dismissed items
  const visibleItems = items.filter(item => !dismissedIds.has(item.id));
  const displayedItems = visibleItems.slice(0, maxItems);

  // Count critical items (out of stock or very low)
  const criticalCount = visibleItems.filter(item => item.stock === 0 || item.stock <= 3).length;
  const warningCount = visibleItems.filter(item => item.stock > 3 && item.stock <= threshold).length;

  // Get stock level badge
  const getStockBadge = (stock) => {
    if (stock === 0) {
      return { variant: 'danger', label: 'Out of Stock', icon: XCircle };
    }
    if (stock <= 3) {
      return { variant: 'danger', label: `${stock} left`, icon: AlertTriangle };
    }
    if (stock <= threshold) {
      return { variant: 'warning', label: `${stock} left`, icon: AlertTriangle };
    }
    return { variant: 'success', label: 'In Stock', icon: CheckCircle };
  };

  // Handle reorder action
  const handleReorder = async (item) => {
    if (processingIds.has(item.id)) return;

    setProcessingIds(prev => new Set(prev).add(item.id));
    
    try {
      await onReorder?.(item);
    } finally {
      setProcessingIds(prev => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  // Handle dismiss action
  const handleDismiss = (item) => {
    setDismissedIds(prev => new Set(prev).add(item.id));
    onDismiss?.(item);
  };

  return (
    <Card className={clsx('h-full', className)}>
      <CardHeader
        title={title}
        subtitle={`${visibleItems.length} items need attention`}
        icon={AlertTriangle}
        action={
          showViewAll && visibleItems.length > 0 && (
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
        {/* Summary Alert */}
        {visibleItems.length > 0 && (
          <div className="mb-4">
            {criticalCount > 0 ? (
              <Alert
                variant="danger"
                size="sm"
                title={`${criticalCount} Critical Item${criticalCount !== 1 ? 's' : ''}`}
              >
                Immediate action required for out of stock or critically low items
              </Alert>
            ) : warningCount > 0 ? (
              <Alert
                variant="warning"
                size="sm"
                title={`${warningCount} Low Stock Item${warningCount !== 1 ? 's' : ''}`}
              >
                Consider reordering these items soon
              </Alert>
            ) : null}
          </div>
        )}

        {/* Items List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" label="Checking inventory..." />
          </div>
        ) : visibleItems.length === 0 ? (
          <EmptyState
            icon={CheckCircle}
            title="All stock levels healthy"
            description="No items need attention right now"
            size="sm"
            variant="success"
          />
        ) : (
          <div className="space-y-3">
            {displayedItems.map((item) => {
              const stockBadge = getStockBadge(item.stock);
              const isProcessing = processingIds.has(item.id);
              const StockIcon = stockBadge.icon;

              return (
                <div
                  key={item.id}
                  className={clsx(
                    'p-4 rounded-lg border-2 transition-all duration-200',
                    {
                      'border-danger-200 bg-danger-50': item.stock === 0,
                      'border-warning-200 bg-warning-50': item.stock > 0 && item.stock <= threshold,
                      'hover:shadow-md': onItemClick,
                      'cursor-pointer': onItemClick,
                    }
                  )}
                  onClick={() => onItemClick?.(item)}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Product Info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Product Image/Icon */}
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                          <Package className="h-6 w-6 text-gray-400" />
                        </div>
                      )}

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {item.name}
                          </p>
                          <Badge
                            variant={stockBadge.variant}
                            size="xs"
                            icon={StockIcon}
                          >
                            {stockBadge.label}
                          </Badge>
                        </div>

                        <p className="text-xs text-gray-600 mb-1">
                          SKU: {item.sku}
                          {item.category && ` • ${item.category}`}
                        </p>

                        {/* Reorder Info */}
                        {item.reorderPoint && (
                          <p className="text-xs text-gray-500">
                            Reorder at: {item.reorderPoint} units
                            {item.reorderQuantity && ` • Order: ${item.reorderQuantity} units`}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      {showReorderButton && onReorder && (
                        <Button
                          size="sm"
                          variant={item.stock === 0 ? 'danger' : 'warning'}
                          icon={RefreshCw}
                          loading={isProcessing}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleReorder(item);
                          }}
                          className="whitespace-nowrap"
                        >
                          Reorder
                        </Button>
                      )}

                      {onDismiss && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDismiss(item);
                          }}
                        >
                          Dismiss
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {item.reorderPoint && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Current Stock</span>
                        <span>{item.stock} / {item.reorderPoint}</span>
                      </div>
                      <div className="h-2 bg-white rounded-full overflow-hidden">
                        <div
                          className={clsx(
                            'h-full transition-all duration-500',
                            {
                              'bg-danger-500': item.stock === 0,
                              'bg-danger-400': item.stock > 0 && item.stock <= 3,
                              'bg-warning-400': item.stock > 3 && item.stock <= item.reorderPoint,
                              'bg-success-400': item.stock > item.reorderPoint,
                            }
                          )}
                          style={{ 
                            width: `${Math.min((item.stock / item.reorderPoint) * 100, 100)}%` 
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Show More Indicator */}
        {visibleItems.length > maxItems && (
          <div className="mt-4 text-center">
            <Button
              size="sm"
              variant="outline"
              onClick={onViewAll}
              fullWidth
            >
              View {visibleItems.length - maxItems} more item{visibleItems.length - maxItems !== 1 ? 's' : ''}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
};

LowStockWidget.displayName = 'LowStockWidget';

export default LowStockWidget;

/**
 * Example Usage:
 * 
 * import LowStockWidget from '@/components/dashboard/LowStockWidget';
 * 
 * // Sample data
 * const lowStockItems = [
 *   {
 *     id: '1',
 *     name: 'Wireless Mouse',
 *     sku: 'MOUSE-001',
 *     category: 'Electronics',
 *     stock: 0,
 *     reorderPoint: 10,
 *     reorderQuantity: 50,
 *     image: '/products/mouse.jpg',
 *   },
 *   {
 *     id: '2',
 *     name: 'USB Cable',
 *     sku: 'CABLE-002',
 *     category: 'Accessories',
 *     stock: 3,
 *     reorderPoint: 20,
 *     reorderQuantity: 100,
 *   },
 *   {
 *     id: '3',
 *     name: 'Keyboard',
 *     sku: 'KEY-003',
 *     category: 'Electronics',
 *     stock: 8,
 *     reorderPoint: 15,
 *     reorderQuantity: 30,
 *   },
 * ];
 * 
 * // Basic usage
 * <LowStockWidget items={lowStockItems} />
 * 
 * // With reorder handler
 * <LowStockWidget
 *   items={lowStockItems}
 *   onReorder={async (item) => {
 *     await api.createPurchaseOrder({
 *       productId: item.id,
 *       quantity: item.reorderQuantity,
 *     });
 *     toast.success(`Reorder placed for ${item.name}`);
 *   }}
 * />
 * 
 * // With all handlers
 * <LowStockWidget
 *   items={lowStockItems}
 *   loading={loading}
 *   onReorder={(item) => handleReorder(item)}
 *   onViewAll={() => navigate('/inventory?filter=low-stock')}
 *   onItemClick={(item) => navigate(`/products/${item.id}`)}
 *   onDismiss={(item) => markAsDismissed(item.id)}
 * />
 * 
 * // Dashboard implementation
 * const Dashboard = () => {
 *   const [lowStock, setLowStock] = useState([]);
 *   const [loading, setLoading] = useState(true);
 * 
 *   useEffect(() => {
 *     fetchLowStock();
 *   }, []);
 * 
 *   const fetchLowStock = async () => {
 *     setLoading(true);
 *     const data = await api.getLowStockItems();
 *     setLowStock(data);
 *     setLoading(false);
 *   };
 * 
 *   const handleReorder = async (item) => {
 *     await api.createPurchaseOrder({
 *       productId: item.id,
 *       quantity: item.reorderQuantity,
 *     });
 *     toast.success('Purchase order created');
 *     fetchLowStock();
 *   };
 * 
 *   return (
 *     <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
 *       <LowStockWidget
 *         items={lowStock}
 *         loading={loading}
 *         onReorder={handleReorder}
 *         onViewAll={() => navigate('/inventory')}
 *       />
 *     </div>
 *   );
 * };
 */