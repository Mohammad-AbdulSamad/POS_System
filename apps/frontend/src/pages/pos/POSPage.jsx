// src/pages/POSPage.jsx - REFACTORED with Common Table Component
import { useState, useEffect, useMemo } from 'react';
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
import Table from '../../components/common/Table';
import Badge from '../../components/common/Badge';
import { DEFAULT_TAX_RATE } from '../../config/constants';

// Hooks
import { usePOS } from '../../hooks/usePOS';
import { useTransactions } from '../../hooks/useTransactions';

import { 
  X, Plus, Barcode, User, Grid3x3, 
  ShoppingCart, History, Eye
} from 'lucide-react';
import clsx from 'clsx';

/**
 * POSPage Component - REFACTORED
 * Now uses custom hooks, context, and common Table component
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

  // ✅ Define table columns for recent transactions
  const transactionColumns = useMemo(() => [
    {
      key: 'receiptNumber',
      header: 'Receipt #',
      sortable: true,
      width: '300px',
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      )
    },
    {
      key: 'timestamp',
      header: 'Date & Time',
      sortable: true,
      width: '300px',
      render: (value) => (
        <span className="text-gray-600">{formatDateTime(value)}</span>
      )
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: false,
      render: (value) => (
        <span className="text-gray-900">
          {value?.name || 'Walk-in'}
        </span>
      )
    },
    {
      key: 'items_count',
      header: 'Items',
      sortable: true,
      align: 'right',
      // width: '80px',
      render: (value) => (
        <span className="text-gray-600">{value || 0}</span>
      )
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      align: 'right',
      // width: '120px',
      render: (value) => (
        <span className="font-semibold text-gray-900">
          {formatCurrency(value)}
        </span>
      )
    },
    {
      key: 'payment',
      header: 'Payment',
      sortable: false,
      // width: '100px',
      render: (value) => (
        <Badge 
          variant={value?.method === 'CASH' ? 'success' : 'info'}
          size="sm"
        >
          {value?.method || 'N/A'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      // width: '100px',
      render: (_, transaction) => (
        <Button
          variant="ghost"
          size="sm"
          icon={Eye}
          onClick={() => pos.viewTransaction(transaction)}
        >
          View
        </Button>
      )
    }
  ], [pos]);

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
              
              {/* ✅ REFACTORED: Recent Transactions using Table Component */}
              {leftTab === 'transactions' && (
                <div className="h-full flex flex-col">
                  {/* Header */}
                  <div className="flex-shrink-0 mb-4 flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {transactionsHook.transactions.length} transaction{transactionsHook.transactions.length !== 1 ? 's' : ''}
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

                  {/* ✅ Table Component */}
                  <div className="flex-1 min-h-0 overflow-hidden border border-gray-200 rounded-lg">
                    <Table
                      columns={transactionColumns}
                      data={transactionsHook.transactions}
                      loading={transactionsHook.isLoading}
                      emptyMessage="No transactions found. Complete a sale to see it here."
                      hover={true}
                      compact={false}
                      onRowClick={(transaction) => pos.viewTransaction(transaction)}
                      className="h-full"
                    />
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