import { useState } from 'react';
import { Minus, Plus, Trash2, Package } from 'lucide-react';
import clsx from 'clsx';

const CartItem = ({
  item,
  onUpdateQuantity,
  onRemove,
  readOnly = false,
  showImage = false,
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

  const handleIncrement = () => handleQuantityChange(item.quantity + 1);
  const handleDecrement = () => item.quantity > 1 && handleQuantityChange(item.quantity - 1);
  const handleRemove = async () => {
    setUpdating(true);
    try {
      await onRemove?.(item.id);
    } catch (error) {
      console.error('Failed to remove item:', error);
      setUpdating(false);
    }
  };

  const itemTotal = item.priceGross * item.quantity;
  const hasDiscount = item.originalPrice && item.originalPrice > item.price;

  return (
    <div
      className={clsx(
        'flex items-center justify-between gap-3 p-2 bg-white border border-gray-200 rounded-md',
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
              className="h-10 w-10 object-cover rounded-md"
            />
          ) : (
            <div className="h-10 w-10 bg-gray-100 rounded-md flex items-center justify-center">
              <Package className="h-5 w-5 text-gray-400" />
            </div>
          )}
        </div>
      )}

      {/* Item Info (inline layout) */}
      <div className="flex-1 flex items-center justify-between text-sm">
        <div className="flex flex-col min-w-0 mr-2">
          <span className="font-medium text-gray-900 truncate">{item.name}</span>
          {item.sku && (
            <span className="text-xs text-gray-500 truncate">SKU: {item.sku}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900">₪{item.price}</span>
          {hasDiscount && (
            <span className="text-xs text-gray-400 line-through">
              ₪{item.originalPrice}
            </span>
          )}
        </div>

        {/* Quantity Controls */}
        {!readOnly && (
          <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
            <button
              onClick={handleDecrement}
              disabled={updating || item.quantity <= 1}
              className="px-1.5 py-0.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>

            <input
              type="number"
              value={item.quantity}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1;
                handleQuantityChange(val);
              }}
              disabled={updating}
              className="w-10 text-center text-xs font-medium border-x border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500"
              min="1"
              max="9999"
            />

            <button
              onClick={handleIncrement}
              disabled={updating}
              className="px-1.5 py-0.5 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Total */}
        <div className="text-right min-w-[60px]">
          <div className="font-semibold text-gray-900 text-sm">
            ₪{itemTotal}
          </div>
          {hasDiscount && (
            <div className="text-[10px] text-gray-400 line-through">
              ₪{(item.originalPrice * item.quantity)}
            </div>
          )}
        </div>

        {/* Remove Button */}
        {!readOnly && (
          <button
            onClick={handleRemove}
            disabled={updating}
            className="ml-2 p-1 text-danger-600 hover:bg-danger-50 rounded-md transition-colors disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};

CartItem.displayName = 'CartItem';
export default CartItem;
