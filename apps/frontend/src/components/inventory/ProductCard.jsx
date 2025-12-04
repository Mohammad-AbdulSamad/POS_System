// src/components/inventory/ProductCard.jsx
import Card, { CardBody } from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { CURRENCY_SYMBOL } from '../../config/constants';
import { Package, Edit, Trash2, Eye, TrendingUp, AlertTriangle } from 'lucide-react';
import clsx from 'clsx';

/**
 * ProductCard Component
 * 
 * Grid card view for displaying products
 * Shows product image, details, stock status, and actions
 */

const ProductCard = ({
  product,
  onEdit,
  onDelete,
  onView,
  onSelect,
  selected = false,
  showActions = true,
  compact = false,
}) => {
  const {
    id,
    name,
    sku,
    barcode,
    priceGross,
    cost,
    stock,
    minStock = 0,
    unit = 'pcs',
    imageUrl,
    category,
    active,
  } = product;

  // Stock status
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= minStock;
  const stockStatus = isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success';

  // Calculate profit margin
  const profitMargin = priceGross && cost
    ? (((priceGross - cost) / priceGross) * 100).toFixed(1)
    : 0;

  const handleCardClick = () => {
    if (onView) {
      onView(product);
    }
  };

  return (
    <Card
      className={clsx(
        'relative transition-all duration-200',
        'hover:shadow-lg cursor-pointer',
        selected && 'ring-2 ring-primary-500',
        !active && 'opacity-60'
      )}
      onClick={handleCardClick}
    >
      {/* Selection Checkbox */}
      {onSelect && (
        <div className="absolute top-2 left-2 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => {
              e.stopPropagation();
              onSelect(product);
            }}
            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
        </div>
      )}

      {/* Status Badge */}
      {!active && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="gray" size="sm">Inactive</Badge>
        </div>
      )}

      <CardBody className={clsx('p-4', compact && 'p-3')}>
        {/* Product Image */}
        <div className={clsx(
          'bg-gray-100 rounded-lg flex items-center justify-center mb-3 overflow-hidden',
          compact ? 'h-32' : 'h-48'
        )}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package className={clsx(
              'text-gray-400',
              compact ? 'h-12 w-12' : 'h-16 w-16'
            )} />
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-2">
          {/* SKU */}
          <div className="text-xs font-mono text-gray-500 truncate">
            {sku}
          </div>

          {/* Product Name */}
          <h3 className={clsx(
            'font-semibold text-gray-900 line-clamp-2',
            compact ? 'text-sm' : 'text-base'
          )}>
            {name}
          </h3>

          {/* Category */}
          {category && (
            <div className="text-xs text-gray-600">
              {category.name}
            </div>
          )}

          {/* Price & Cost */}
          <div className="flex items-center justify-between">
            <div>
              <div className={clsx(
                'font-bold text-gray-900',
                compact ? 'text-base' : 'text-lg'
              )}>
                { `${CURRENCY_SYMBOL}${priceGross}` }
              </div>
              <div className="text-xs text-gray-500">
                Cost: { `${CURRENCY_SYMBOL}${cost}` }
              </div>
            </div>

            {/* Profit Margin Badge */}
            {profitMargin > 0 && (
              <div className="flex items-center gap-1 text-success-600">
                <TrendingUp className="h-4 w-4" />
                <span className="text-xs font-semibold">
                  {profitMargin}%
                </span>
              </div>
            )}
          </div>

          {/* Stock Status */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-200">
            <div className="text-sm text-gray-600">
              Stock
            </div>
            <Badge variant={stockStatus} size="sm">
              {stock} {unit}
            </Badge>
          </div>

          {/* Low Stock Warning */}
          {isLowStock && (
            <div className="flex items-center gap-1 text-warning-600 text-xs">
              <AlertTriangle className="h-3 w-3" />
              <span>Low stock</span>
            </div>
          )}

          {/* Out of Stock Warning */}
          {isOutOfStock && (
            <div className="flex items-center gap-1 text-danger-600 text-xs font-semibold">
              <AlertTriangle className="h-3 w-3" />
              <span>Out of stock</span>
            </div>
          )}

          {/* Barcode */}
          {barcode && (
            <div className="text-xs font-mono text-gray-400 truncate">
              {barcode}
            </div>
          )}
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-200">
            {onView && (
              <Button
                variant="outline"
                size="sm"
                icon={Eye}
                onClick={(e) => {
                  e.stopPropagation();
                  onView(product);
                }}
                className="flex-1"
              >
                View
              </Button>
            )}
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                icon={Edit}
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(product);
                }}
                className="flex-1"
              >
                Edit
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(product);
                }}
                className="text-danger-600 hover:text-danger-700"
              />
            )}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

export default ProductCard;