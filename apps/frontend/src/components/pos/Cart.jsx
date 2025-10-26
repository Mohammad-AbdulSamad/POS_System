// src/components/pos/Cart.jsx
import { useMemo } from 'react';
import CartItem from './CartItem';
import Button from '../common/Button';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import { ShoppingCart, Trash2, Tag, CreditCard } from 'lucide-react';
import clsx from 'clsx';

/**
 * Cart Component
 * 
 * Displays shopping cart with items, totals, and checkout actions.
 * 
 * @example
 * <Cart
 *   items={cartItems}
 *   onUpdateQuantity={handleUpdateQty}
 *   onRemoveItem={handleRemove}
 *   onCheckout={handleCheckout}
 * />
 */

const Cart = ({
  items = [],
  onUpdateQuantity,
  onRemoveItem,
  onApplyDiscount,
  onClearCart,
  onCheckout,
  discount = { type: 'none', value: 0 },
  tax = { rate: 0, amount: 0 },
  loading = false,
  readOnly = false,
  showActions = true,
  className = '',
}) => {
  // Calculate totals
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    let discountAmount = 0;
    if (discount.type === 'percentage') {
      discountAmount = subtotal * (discount.value / 100);
    } else if (discount.type === 'fixed') {
      discountAmount = discount.value;
    }

    const afterDiscount = subtotal - discountAmount;
    const taxAmount = tax.amount || (afterDiscount * (tax.rate / 100));
    const total = afterDiscount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
      itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }, [items, discount, tax]);

  const hasItems = items.length > 0;

  return (
    <div className={clsx('flex flex-col h-full bg-white', className)}>
      {/* Cart Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Cart</h2>
          {totals.itemCount > 0 && (
            <Badge variant="primary" size="sm">
              {totals.itemCount} {totals.itemCount === 1 ? 'item' : 'items'}
            </Badge>
          )}
        </div>

        {hasItems && showActions && !readOnly && (
          <Button
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={onClearCart}
            className="text-danger-600 hover:text-danger-700"
          >
            Clear
          </Button>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {hasItems ? (
          <div className="space-y-3">
            {items.map((item) => (
              <CartItem
                key={item.id}
                item={item}
                onUpdateQuantity={onUpdateQuantity}
                onRemove={onRemoveItem}
                readOnly={readOnly}
              />
            ))}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center">
            <EmptyState
              icon={ShoppingCart}
              title="Cart is empty"
              description="Add products to get started"
              size="md"
            />
          </div>
        )}
      </div>

      {/* Cart Footer - Totals & Actions */}
      {hasItems && (
        <div className="border-t border-gray-200 bg-gray-50">
          {/* Totals */}
          <div className="px-4 py-3 space-y-2">
            {/* Subtotal */}
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium text-gray-900">
                ₪{totals.subtotal.toFixed(2)}
              </span>
            </div>

            {/* Discount */}
            {totals.discountAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Discount</span>
                  {discount.type === 'percentage' && (
                    <Badge variant="success" size="xs">
                      {discount.value}%
                    </Badge>
                  )}
                </div>
                <span className="font-medium text-success-600">
                  -₪{totals.discountAmount.toFixed(2)}
                </span>
              </div>
            )}

            {/* Tax */}
            {totals.taxAmount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-600">Tax</span>
                  {tax.rate > 0 && (
                    <Badge variant="gray" size="xs">
                      {tax.rate}%
                    </Badge>
                  )}
                </div>
                <span className="font-medium text-gray-900">
                  ₪{totals.taxAmount.toFixed(2)}
                </span>
              </div>
            )}

            {/* Total */}
            <div className="pt-2 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-gray-900">
                  Total
                </span>
                <span className="text-2xl font-bold text-gray-900">
                  ₪{totals.total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          {showActions && !readOnly && (
            <div className="px-4 py-3 space-y-2 border-t border-gray-200">
              {/* Apply Discount */}
              {onApplyDiscount && (
                <Button
                  variant="outline"
                  icon={Tag}
                  onClick={onApplyDiscount}
                  fullWidth
                  disabled={loading}
                >
                  {totals.discountAmount > 0 ? 'Edit Discount' : 'Apply Discount'}
                </Button>
              )}

              {/* Checkout */}
              <Button
                variant="primary"
                size="lg"
                icon={CreditCard}
                onClick={() => onCheckout?.(totals)}
                fullWidth
                loading={loading}
                disabled={loading}
              >
                Checkout • ₪{totals.total.toFixed(2)}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

Cart.displayName = 'Cart';

export default Cart;