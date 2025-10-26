// src/pages/POSPage.jsx
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
import Card, { CardBody } from '../../components/common/Card';
import Alert from '../../components/common/Alert';
import { useToast } from '../../components/common/Toast';
import { 
  Barcode, 
  User, 
  Grid3x3, 
  ShoppingCart,
  Receipt as ReceiptIcon,
  AlertTriangle 
} from 'lucide-react';
import clsx from 'clsx';

/**
 * POSPage Component
 * 
 * Main POS/Checkout screen for processing sales.
 * Integrates product search, cart management, payments, and receipts.
 * 
 * Features:
 * - Product search (barcode scanner, manual search)
 * - Shopping cart display
 * - Item quantity adjustment
 * - Apply discounts
 * - Payment method selection
 * - Cash calculator
 * - Complete transaction
 * - Print receipt
 */

const POSPage = () => {
  const toast = useToast();

  // UI State
  const [scannerOpen, setScannerOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [discountOpen, setDiscountOpen] = useState(false);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [showQuickGrid, setShowQuickGrid] = useState(true);
  const [gridView, setGridView] = useState('grid');

  // Cart State
  const [cartItems, setCartItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [discount, setDiscount] = useState({ type: 'none', value: 0, amount: 0 });
  const [completedTransaction, setCompletedTransaction] = useState(null);

  // Data State (In production, these would come from hooks/API)
  const [products, setProducts] = useState([
    {
      id: 1,
      name: 'Laptop HP 15s',
      sku: 'LAP-HP-001',
      barcode: '1234567890123',
      price: 2500.00,
      stock: 15,
      image: null,
      categoryId: 1,
    },
    {
      id: 2,
      name: 'Wireless Mouse',
      sku: 'MSE-001',
      barcode: '1234567890124',
      price: 45.00,
      stock: 50,
      image: null,
      categoryId: 1,
    },
    {
      id: 3,
      name: 'USB-C Cable',
      sku: 'CBL-001',
      barcode: '1234567890125',
      price: 15.00,
      stock: 5,
      image: null,
      categoryId: 2,
    },
  ]);

  const [customers, setCustomers] = useState([
    {
      id: 1,
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+972-50-123-4567',
      loyaltyPoints: 150,
      isVip: false,
    },
    {
      id: 2,
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

  const taxRate = 17; // 17% VAT

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      // F2 - Open barcode scanner
      if (e.key === 'F2') {
        e.preventDefault();
        setScannerOpen(true);
      }
      // F3 - Toggle quick grid
      if (e.key === 'F3') {
        e.preventDefault();
        setShowQuickGrid(prev => !prev);
      }
      // F4 - Apply discount
      if (e.key === 'F4' && cartItems.length > 0) {
        e.preventDefault();
        setDiscountOpen(true);
      }
      // F12 - Checkout
      if (e.key === 'F12' && cartItems.length > 0) {
        e.preventDefault();
        handleCheckout();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [cartItems]);

  // Add product to cart
  const handleAddToCart = (product) => {
    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }

    const existingItem = cartItems.find(item => item.id === product.id);
    
    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        toast.warning('Cannot add more than available stock');
        return;
      }
      setCartItems(cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      toast.success('Quantity updated');
    } else {
      setCartItems([...cartItems, {
        id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        quantity: 1,
        stock: product.stock,
        image: product.image,
      }]);
      toast.success(`${product.name} added to cart`);
    }
  };

  // Update item quantity
  const handleUpdateQuantity = (itemId, newQuantity) => {
    const item = cartItems.find(i => i.id === itemId);
    
    if (newQuantity > item.stock) {
      toast.warning('Cannot exceed available stock');
      return;
    }

    setCartItems(cartItems.map(i =>
      i.id === itemId ? { ...i, quantity: newQuantity } : i
    ));
  };

  // Remove item from cart
  const handleRemoveItem = (itemId) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
    toast.info('Item removed from cart');
  };

  // Clear cart
  const handleClearCart = () => {
    if (window.confirm('Are you sure you want to clear the cart?')) {
      setCartItems([]);
      setSelectedCustomer(null);
      setDiscount({ type: 'none', value: 0, amount: 0 });
      toast.info('Cart cleared');
    }
  };

  // Apply discount
  const handleApplyDiscount = (discountData) => {
    if (discountData) {
      setDiscount({
        type: discountData.type,
        value: discountData.value,
        amount: discountData.amount,
        reason: discountData.reason,
      });
      toast.success('Discount applied');
    } else {
      setDiscount({ type: 'none', value: 0, amount: 0 });
      toast.info('Discount removed');
    }
  };

  // Barcode scan
  const handleBarcodeScan = (barcode) => {
    const product = products.find(p => p.barcode === barcode);
    
    if (product) {
      handleAddToCart(product);
      setScannerOpen(false);
    } else {
      throw new Error('Product not found');
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountAmount = discount.amount || 0;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (taxRate / 100);
    const total = afterDiscount + taxAmount;

    return {
      subtotal,
      discountAmount,
      taxAmount,
      total,
      itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    };
  };

  // Open checkout
  const handleCheckout = () => {
    if (cartItems.length === 0) {
      toast.warning('Cart is empty');
      return;
    }
    setPaymentOpen(true);
  };

  // Complete payment
  const handlePaymentComplete = async (payment) => {
    const totals = calculateTotals();
    
    const transaction = {
      id: `TXN-${Date.now()}`,
      items: cartItems,
      subtotal: totals.subtotal,
      discount: discount.amount > 0 ? discount : null,
      tax: {
        rate: taxRate,
        amount: totals.taxAmount,
      },
      total: totals.total,
      payment,
      customer: selectedCustomer,
      cashier: {
        id: 1,
        name: 'Current User', // Would come from auth context
      },
      timestamp: new Date().toISOString(),
    };

    // In production, save transaction to backend
    console.log('Transaction completed:', transaction);
    
    setCompletedTransaction(transaction);
    setPaymentOpen(false);
    
    // Show receipt preview
    setTimeout(() => {
      setReceiptOpen(true);
    }, 300);

    toast.success('Transaction completed successfully!');
  };

  // New transaction
  const handleNewTransaction = () => {
    setCartItems([]);
    setSelectedCustomer(null);
    setDiscount({ type: 'none', value: 0, amount: 0 });
    setCompletedTransaction(null);
    setReceiptOpen(false);
    toast.info('Ready for new transaction');
  };

  const totals = calculateTotals();

  return (
    <MainLayout
      currentPath="/pos"
      user={{ name: 'John Doe', role: 'Cashier', avatar: 'JD' }}
    >
      <div className="h-[calc(100vh-8rem)] flex gap-4">
        {/* Left Side - Products & Search */}
        <div className={clsx(
          'flex flex-col gap-4 transition-all duration-300',
          showQuickGrid ? 'flex-1' : 'w-full'
        )}>
          {/* Search Section */}
          <Card className="flex-shrink-0">
            <CardBody>
              <div className="space-y-4">
                {/* Product Search */}
                <ProductSearch
                  products={products}
                  onSelectProduct={handleAddToCart}
                  onScanBarcode={() => setScannerOpen(true)}
                  placeholder="Search or scan product..."
                />

                {/* Customer Search */}
                <CustomerSearch
                  customers={customers}
                  selectedCustomer={selectedCustomer}
                  onSelectCustomer={setSelectedCustomer}
                  onAddNew={() => toast.info('Add customer feature coming soon')}
                />

                {/* Quick Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Barcode}
                    onClick={() => setScannerOpen(true)}
                    fullWidth
                  >
                    Scan (F2)
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={Grid3x3}
                    onClick={() => setShowQuickGrid(!showQuickGrid)}
                    fullWidth
                  >
                    {showQuickGrid ? 'Hide' : 'Show'} Grid (F3)
                  </Button>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Quick Product Grid */}
          {showQuickGrid && (
            <Card className="flex-1 min-h-0">
              <CardBody className="h-full">
                <QuickProductGrid
                  products={products}
                  categories={categories}
                  onSelectProduct={handleAddToCart}
                  view={gridView}
                  onViewChange={setGridView}
                />
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right Side - Cart */}
        <div className="w-96 flex flex-col">
          <Card className="flex-1 flex flex-col min-h-0">
            <Cart
              items={cartItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearCart={handleClearCart}
              onApplyDiscount={() => setDiscountOpen(true)}
              onCheckout={handleCheckout}
              discount={discount}
              tax={{ rate: taxRate, amount: totals.taxAmount }}
            />
          </Card>
        </div>
      </div>

      {/* Modals */}
      <BarcodeScanner
        isOpen={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleBarcodeScan}
        onError={(err) => toast.error(err.message)}
      />

      <DiscountModal
        isOpen={discountOpen}
        onClose={() => setDiscountOpen(false)}
        subtotal={totals.subtotal}
        currentDiscount={discount.amount > 0 ? discount : null}
        onApply={handleApplyDiscount}
      />

      <PaymentModal
        isOpen={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={totals.total}
        items={cartItems}
        discount={discount.amount > 0 ? discount : null}
        tax={{ rate: taxRate, amount: totals.taxAmount }}
        onComplete={handlePaymentComplete}
        onError={(err) => toast.error(err.message)}
      />

      <ReceiptPreview
        isOpen={receiptOpen}
        onClose={handleNewTransaction}
        transaction={completedTransaction}
        store={storeInfo}
        onPrint={() => toast.success('Receipt sent to printer')}
      />
    </MainLayout>
  );
};

export default POSPage;