
//////////////////////////////////////////////////////////////////////////////////////
// Second Man
// src/pages/POSPage.jsx - REFACTORED with Hooks & Context
import { useState, useEffect } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import ProductSearch from '../../components/pos/ProductSearch';
import BarcodeScanner from '../../components/pos/BarcodeScanner';
import Cart from '../../components/pos/Cart';
import PaymentModal from '../../components/pos/PaymentModal';
import DiscountModal from '../../components/pos/DiscountModal';
import CustomerSearch from '../../components/pos/CustomerSearch';
import QuickProductGrid from '../../components/pos/QuickProductGrid';
import ReceiptPreview from '../../components/pos/ReceiptPreview';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import {DEFAULT_TAX_RATE} from '../../config/constants';

// Hooks
import { usePOS } from '../../hooks/usePOS';
import { useTransactions } from '../../hooks/useTransactions';

import { 
  X, Plus, Barcode, User, Grid3x3, 
  ShoppingCart, History
} from 'lucide-react';
import clsx from 'clsx';

/**
 * POSPage Component - REFACTORED
 * Now uses custom hooks and context for business logic
 * UI layer is clean and focused on presentation
 */
const POSPage = () => {
  // UI State (only UI-specific state remains in component)
  const [gridView, setGridView] = useState('grid');
  const [leftTab, setLeftTab] = useState('quick');

  // Business logic via hooks
  const pos = usePOS({
    taxRate: DEFAULT_TAX_RATE,
    autoRefreshInterval: null, // Set to 30000 for 30s auto-refresh
  });

  const transactionsHook = useTransactions({
    autoFetch: true,
    initialLimit: 50,
  });

  // Mock data (will be replaced with API calls)
  const [customers] = useState([
    {
      id: 'cust-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+972-50-123-4567',
      loyaltyPoints: 150,
      isVip: false,
    },
    {
      id: 'cust-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      phone: '+972-50-987-6543',
      loyaltyPoints: 500,
      isVip: true,
    },
  ]);

  const categories = [
    { id: 1, name: 'Electronics' },
    { id: 2, name: 'Accessories' },
    { id: 3, name: 'Office' },
  ];

  const storeInfo = {
    name: 'My Store',
    address: '123 Main St, City',
    phone: '+972-50-000-0000',
    taxId: '123456789',
    returnPolicy: 'Returns accepted within 30 days',
    website: 'www.mystore.com',
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // F2 - Open barcode scanner
      if (e.key === 'F2') {
        e.preventDefault();
        pos.openModal('scanner');
      }
      // F3 - Switch left tabs
      if (e.key === 'F3') {
        e.preventDefault();
        setLeftTab(prev => {
          if (prev === 'quick') return 'search';
          if (prev === 'search') return 'transactions';
          return 'quick';
        });
      }
      // F4 - Apply discount
      if (e.key === 'F4' && !pos.cart.isEmpty) {
        e.preventDefault();
        pos.openModal('discount');
      }
      // F8 - New cart
      if (e.key === 'F8') {
        e.preventDefault();
        pos.cart.createCart();
      }
      // F12 - Checkout
      if (e.key === 'F12' && !pos.cart.isEmpty) {
        e.preventDefault();
        pos.handleCheckout();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [pos]);

  // Format helpers
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  return (
    <MainLayout
      currentPath="/pos"
      user={{ name: 'John Doe', role: 'Cashier', avatar: 'JD' }}
    >
      <div className="h-[calc(100vh-8rem)] flex gap-4">
        {/* Left Side - Tabbed Interface */}
        <div className="flex-1 flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            {/* Tabs Header */}
            <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center">
                <button
                  onClick={() => setLeftTab('quick')}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-r border-gray-200',
                    leftTab === 'quick'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Grid3x3 className="h-4 w-4" />
                  Quick Products
                </button>
                <button
                  onClick={() => setLeftTab('search')}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-r border-gray-200',
                    leftTab === 'search'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <User className="h-4 w-4" />
                  Search
                </button>
                <button
                  onClick={() => setLeftTab('transactions')}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-r border-gray-200',
                    leftTab === 'transactions'
                      ? 'bg-white text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <History className="h-4 w-4" />
                  Recent Transactions
                </button>
                
                <div className="ml-auto px-4">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Barcode}
                    onClick={() => pos.openModal('scanner')}
                  >
                    Scan (F2)
                  </Button>
                </div>
              </div>
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-y-auto p-6">
              {leftTab === 'quick' && (
                <QuickProductGrid
                  products={pos.products}
                  categories={categories}
                  onSelectProduct={pos.cart.addItem}
                  view={gridView}
                  onViewChange={setGridView}
                />
              )}
              
              {leftTab === 'search' && (
                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Products</h3>
                    <ProductSearch
                      products={pos.products}
                      onSelectProduct={pos.cart.addItem}
                      onScanBarcode={() => pos.openModal('scanner')}
                      placeholder="Search products..."
                      autoFocus={true}
                    />
                  </div>
                  
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Customers</h3>
                    <CustomerSearch
                      customers={customers}
                      selectedCustomer={pos.cart.activeCart.customer}
                      onSelectCustomer={pos.cart.setCustomer}
                      onAddNew={() => pos.openModal('customer')}
                      autoFocus={false}
                    />
                  </div>
                </div>
              )}
              
              {leftTab === 'transactions' && (
                <div className="h-full flex flex-col">
                  <div className="flex-shrink-0 mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {transactionsHook.transactions.length} transactions
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={transactionsHook.refresh}
                      disabled={transactionsHook.isLoading}
                    >
                      {transactionsHook.isLoading ? 'Loading...' : 'Refresh'}
                    </Button>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Receipt #
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Date & Time
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Customer
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Items
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Total
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Payment
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {transactionsHook.isLoading ? (
                          <tr>
                            <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                              Loading transactions...
                            </td>
                          </tr>
                        ) : transactionsHook.transactions.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                              No transactions found
                            </td>
                          </tr>
                        ) : (
                          transactionsHook.transactions.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm font-medium text-gray-900">
                                  {transaction.receiptNumber}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm text-gray-600">
                                  {formatDateTime(transaction.timestamp)}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className="text-sm text-gray-900">
                                  {transaction.customer?.name || 'Walk-in'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <span className="text-sm text-gray-600">
                                  {transaction.items?.length || 0}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <span className="text-sm font-semibold text-gray-900">
                                  {formatCurrency(transaction.total)}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span className={clsx(
                                  'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                                  transaction.payment?.method === 'CASH'
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-blue-100 text-blue-800'
                                )}>
                                  {transaction.payment?.method || 'N/A'}
                                </span>
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => pos.viewTransaction(transaction)}
                                >
                                  View
                                </Button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Right Side - Cart with Multiple Tabs */}
        <div className="w-full flex flex-col min-h-0">
          <Card className="flex-1 flex flex-col min-h-0">
            {/* Cart Tabs */}
            <div className="flex-shrink-0 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center overflow-x-auto">
                <div className="flex-1 flex items-center min-w-0">
                  {pos.cart.carts.map((cart) => (
                    <div
                      key={cart.id}
                      className={clsx(
                        'group relative flex items-center gap-2 px-3 py-2.5 text-sm font-medium cursor-pointer border-r border-gray-200 min-w-[120px]',
                        'hover:bg-gray-100 transition-colors',
                        pos.cart.activeCartId === cart.id
                          ? 'bg-white text-primary-600 shadow-sm'
                          : 'text-gray-600'
                      )}
                      onClick={() => pos.cart.switchCart(cart.id)}
                    >
                      <ShoppingCart className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{cart.name}</span>
                      {cart.items.length > 0 && (
                        <span className={clsx(
                          'text-xs px-1.5 py-0.5 rounded-full font-semibold',
                          pos.cart.activeCartId === cart.id
                            ? 'bg-primary-100 text-primary-700'
                            : 'bg-gray-200 text-gray-700'
                        )}>
                          {cart.items.length}
                        </span>
                      )}
                      
                      {pos.cart.carts.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            pos.cart.closeCart(cart.id);
                          }}
                          className="ml-auto opacity-0 group-hover:opacity-100 hover:text-danger-600 transition-all p-0.5 hover:bg-danger-50 rounded"
                          title="Close cart"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button
                  onClick={pos.cart.createCart}
                  className="flex-shrink-0 px-3 py-2.5 text-gray-600 hover:text-primary-600 hover:bg-gray-100 transition-colors"
                  title="New Cart (F8)"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Cart Content */}
            <div className="flex-1 min-h-0">
              <Cart
                items={pos.cart.activeCart.items}
                onUpdateQuantity={pos.cart.updateQuantity}
                onRemoveItem={pos.cart.removeItem}
                onClearCart={() => pos.cart.clearCart(false)}
                onApplyDiscount={() => pos.openModal('discount')}
                onCheckout={pos.handleCheckout}
                discount={pos.cart.activeCart.discount}
                tax={{ rate: pos.taxRate, amount: pos.totals.taxAmount }}
              />
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <BarcodeScanner
        isOpen={pos.modals.scanner}
        onClose={() => pos.closeModal('scanner')}
        onScan={pos.handleBarcodeScan}
        onError={(err) => console.error(err)}
      />

      <DiscountModal
        isOpen={pos.modals.discount}
        onClose={() => pos.closeModal('discount')}
        subtotal={pos.totals.subtotal}
        currentDiscount={pos.cart.activeCart.discount.amount > 0 ? pos.cart.activeCart.discount : null}
        onApply={pos.cart.applyDiscount}
      />

      <PaymentModal
        isOpen={pos.modals.payment}
        onClose={() => pos.closeModal('payment')}
        total={pos.totals.total}
        items={pos.cart.activeCart.items}
        discount={pos.cart.activeCart.discount.amount > 0 ? pos.cart.activeCart.discount : null}
        tax={{ rate: pos.taxRate, amount: pos.totals.taxAmount }}
        onComplete={pos.completeTransaction}
        onError={(err) => console.error(err)}
      />

      <ReceiptPreview
        isOpen={pos.modals.receipt}
        onClose={pos.newTransaction}
        transaction={pos.selectedTransaction}
        store={storeInfo}
        onPrint={() => console.log('Print receipt')}
      />
    </MainLayout>
  );
};

export default POSPage;