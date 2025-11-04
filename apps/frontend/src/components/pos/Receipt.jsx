// src/components/pos/Receipt.jsx
import { forwardRef, useEffect } from 'react';
import clsx from 'clsx';

/**
 * Receipt Component
 * 
 * Printable receipt template for transactions.
 * Designed for thermal printers (58mm or 80mm).
 * 
 * @example
 * <Receipt
 *   transaction={transactionData}
 *   store={storeInfo}
 * />
 */

const Receipt = forwardRef(({
  transaction,
  store = {},
  showLogo = true,
  showBarcode = true,
  className = '',
}, ref) => {
  const {
    id,
    items = [],
    subtotal = 0,
    discount = null,
    tax = null,
    total = 0,
    payment = {},
    customer = null,
    cashier = {},
    timestamp = new Date().toISOString(),
  } = transaction;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  useEffect(()=> {
    console.log('Hhhhhhhhhhhhhhhhhhhh')

  },[])

  return (
    <div
      ref={ref}
      className={clsx(
        'receipt-container bg-white p-6 font-mono text-sm',
        'max-w-sm mx-auto',
        className
      )}
      style={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
    >
      {/* Store Header */}
      <div className="text-center mb-4 pb-4 border-b-2 border-dashed border-gray-400">
        {showLogo && store.logo && (
          <img
            src={store.logo}
            alt={store.name}
            className="h-12 mx-auto mb-2"
          />
        )}
        <h1 className="text-lg font-bold mb-1">{store.name || 'POS System'}</h1>
        {store.address && (
          <p className="text-xs text-gray-600">{store.address}</p>
        )}
        {store.phone && (
          <p className="text-xs text-gray-600">Tel: {store.phone}</p>
        )}
        {store.taxId && (
          <p className="text-xs text-gray-600">Tax ID: {store.taxId}</p>
        )}
      </div>

      {/* Transaction Info */}
      <div className="mb-4 pb-4 border-b border-dashed border-gray-400 text-xs">
        <div className="flex justify-between mb-1">
          <span className="text-gray-600">Receipt #:</span>
          <span className="font-semibold">{id}</span>
        </div>
        <div className="flex justify-between mb-1">
          <span className="text-gray-600">Date:</span>
          <span>{formatDate(timestamp)}</span>
        </div>
        {cashier?.name && (
          <div className="flex justify-between mb-1">
            <span className="text-gray-600">Cashier:</span>
            <span>{cashier.name}</span>
          </div>
        )}
        {customer && (
          <div className="flex justify-between">
            <span className="text-gray-600">Customer:</span>
            <span>{customer.name}</span>
          </div>
        )}
      </div>

      {/* Items */}
      <div className="mb-4 pb-4 border-b border-dashed border-gray-400">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-300">
              <th className="text-left py-1">Item</th>
              <th className="text-center py-1">Qty</th>
              <th className="text-right py-1">Price</th>
              <th className="text-right py-1">Total</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, index) => (
              <tr key={index} className="border-b border-gray-200">
                <td className="py-2">
                  <div className="font-medium">{item.name}</div>
                  {item.sku && (
                    <div className="text-gray-500 text-xs">SKU: {item.sku}</div>
                  )}
                </td>
                <td className="text-center py-2">{item.quantity}</td>
                <td className="text-right py-2">₪{item.price.toFixed(2)}</td>
                <td className="text-right py-2 font-semibold">
                  ₪{(item.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="mb-4 pb-4 border-b-2 border-dashed border-gray-400 text-sm space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>₪{subtotal.toFixed(2)}</span>
        </div>

        {discount && discount.amount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>
              Discount {discount.type === 'percentage' && `(${discount.value}%)`}:
            </span>
            <span>-₪{discount.amount.toFixed(2)}</span>
          </div>
        )}

        {tax && tax.amount > 0 && (
          <div className="flex justify-between">
            <span>Tax ({tax.rate}%):</span>
            <span>₪{tax.amount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-300">
          <span>TOTAL:</span>
          <span>₪{total.toFixed(2)}</span>
        </div>
      </div>

      {/* Payment Info */}
      <div className="mb-4 pb-4 border-b border-dashed border-gray-400 text-xs space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-600">Payment Method:</span>
          <span className="font-semibold uppercase">{payment.method || 'CASH'}</span>
        </div>
        {payment.method === 'cash' && (
          <>
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid:</span>
              <span>₪{(payment.receivedAmount || total).toFixed(2)}</span>
            </div>
            {payment.change > 0 && (
              <div className="flex justify-between font-semibold">
                <span className="text-gray-600">Change:</span>
                <span>₪{payment.change.toFixed(2)}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Barcode */}
      {showBarcode && (
        <div className="text-center mb-4 pb-4 border-b border-dashed border-gray-400">
          <svg
            className="mx-auto h-12"
            style={{ width: '200px' }}
          >
            {/* Simplified barcode representation */}
            <rect x="0" y="0" width="4" height="48" fill="black" />
            <rect x="8" y="0" width="2" height="48" fill="black" />
            <rect x="14" y="0" width="4" height="48" fill="black" />
            <rect x="22" y="0" width="2" height="48" fill="black" />
            <rect x="28" y="0" width="6" height="48" fill="black" />
            <rect x="38" y="0" width="2" height="48" fill="black" />
            <rect x="44" y="0" width="4" height="48" fill="black" />
            <rect x="52" y="0" width="2" height="48" fill="black" />
            <rect x="58" y="0" width="6" height="48" fill="black" />
            <rect x="68" y="0" width="4" height="48" fill="black" />
          </svg>
          <p className="text-xs mt-1">{id}</p>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs space-y-2">
        <p className="font-semibold">Thank you for your purchase!</p>
        {store.returnPolicy && (
          <p className="text-gray-600">{store.returnPolicy}</p>
        )}
        {store.website && (
          <p className="text-gray-600">{store.website}</p>
        )}
        <p className="text-gray-500 mt-4">
          Powered by POS System
        </p>
      </div>
    </div>
  );
});

Receipt.displayName = 'Receipt';

export default Receipt;