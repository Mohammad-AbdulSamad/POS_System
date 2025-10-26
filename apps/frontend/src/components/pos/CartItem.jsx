// src/components/pos/CartItem.jsx
import { useState } from 'react';
import Button from '../common/Button';
import { Minus, Plus, Trash2, Package } from 'lucide-react';
import clsx from 'clsx';

/**
 * CartItem Component
 * 
 * Individual cart item with quantity controls and remove action.
 * 
 * @example
 * <CartItem
 *   item={cartItem}
 *   onUpdateQuantity={(id, qty) => handleUpdate(id, qty)}
 *   onRemove={(id) => handleRemove(id)}
 * />
 */

const CartItem = ({
  item,
  onUpdateQuantity,
  onRemove,
  readOnly = false,
  showImage = true,
  className = '',
}) => {
  const [updating, setUpdating] = useState(false);

  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity < 1 || newQuantity > 9999) return;
    if (newQuantity === item.quantity) return;

    setUpdating(true);
    try {
      await onUpdateQuantity?.(item.id, newQuantity);
    } catch (error) {
      console.error('Failed to update quantity:', error);
    } finally {
      setUpdating(false);
    }
  };

  const handleIncrement = () => {
    handleQuantityChange(item.quantity + 1);
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      handleQuantityChange(item.quantity - 1);
    }
  };

  const handleRemove = async () => {
    setUpdating(true);
    try {
      await onRemove?.(item.id);
    } catch (error) {
      console.error('Failed to remove item:', error);
      setUpdating(false);
    }
  };

  const itemTotal = item.price * item.quantity;
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;

  return (
    <div
      className={clsx(
        'flex items-start gap-3 p-3 bg-white border border-gray-200 rounded-lg',
        'transition-all duration-200',
        {
          'opacity-50 pointer-events-none': updating,
        },
        className
      )}
    >
      {/* Product Image */}
      {showImage && (
        <div className="flex-shrink-0">
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="h-16 w-16 object-cover rounded-lg"
            />
          ) : (
            <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
      )}

      {/* Item Details */}
      <div className="flex-1 min-w-0">
        {/* Name & SKU */}
        <div className="mb-2">
          <h4 className="font-medium text-gray-900 truncate">
            {item.name}
          </h4>
          {item.sku && (
            <p className="text-xs text-gray-500 mt-0.5">
              SKU: {item.sku}
            </p>
          )}
        </div>

        {/* Price */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-gray-900">
            ₪{item.price.toFixed(2)}
          </span>
          {hasDiscount && (
            <>
              <span className="text-xs text-gray-400 line-through">
                ₪{item.originalPrice.toFixed(2)}
              </span>
              <span className="text-xs text-success-600 font-medium">
                {Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)}% off
              </span>
            </>
          )}
          <span className="text-xs text-gray-500">
            × {item.quantity}
          </span>
        </div>

        {/* Quantity Controls */}
        {!readOnly && (
          <div className="flex items-center gap-2">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={handleDecrement}
                disabled={updating || item.quantity <= 1}
                className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease quantity"
              >
                <Minus className="h-4 w-4" />
              </button>
              
              <input
                type="number"
                value={item.quantity}
                onChange={(e) => {
                  const val = parseInt(e.target.value) || 1;
                  handleQuantityChange(val);
                }}
                disabled={updating}
                className="w-12 text-center border-x border-gray-300 py-1 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                min="1"
                max="9999"
              />
              
              <button
                onClick={handleIncrement}
                disabled={updating}
                className="px-2 py-1 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase quantity"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Remove Button */}
            <button
              onClick={handleRemove}
              disabled={updating}
              className="p-1.5 text-danger-600 hover:bg-danger-50 rounded-lg transition-colors disabled:opacity-50"
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Stock Warning */}
        {item.stock !== undefined && item.quantity > item.stock && (
          <div className="mt-2 text-xs text-warning-600 font-medium">
            ⚠ Only {item.stock} units available
          </div>
        )}
      </div>

      {/* Item Total */}
      <div className="flex-shrink-0 text-right">
        <div className="text-lg font-bold text-gray-900">
          ₪{itemTotal.toFixed(2)}
        </div>
        {hasDiscount && (
          <div className="text-xs text-gray-400 line-through">
            ₪{(item.originalPrice * item.quantity).toFixed(2)}
          </div>
        )}
      </div>
    </div>
  );
};

CartItem.displayName = 'CartItem';

export default CartItem;