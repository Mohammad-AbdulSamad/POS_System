// src/context/CartContext.jsx
import { createContext, useContext, useState, useCallback } from 'react';
import { useToast } from '../components/common/Toast';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const toast = useToast();

  // Multiple carts state
  const [carts, setCarts] = useState([
    {
      id: 1,
      name: 'Cart 1',
      items: [],
      customer: null,
      discount: { type: 'none', value: 0, amount: 0 },
      createdAt: new Date().toISOString(),
    }
  ]);
  const [activeCartId, setActiveCartId] = useState(1);
  const [nextCartId, setNextCartId] = useState(2);

  // Get active cart
  const activeCart = carts.find(cart => cart.id === activeCartId) || carts[0];

  // Update active cart helper
  const updateActiveCart = useCallback((updates) => {
    setCarts(prevCarts => 
      prevCarts.map(cart =>
        cart.id === activeCartId
          ? { ...cart, ...updates }
          : cart
      )
    );
  }, [activeCartId]);

  // Create new cart
  const createCart = useCallback(() => {
    const newCart = {
      id: nextCartId,
      name: `Cart ${nextCartId}`,
      items: [],
      customer: null,
      discount: { type: 'none', value: 0, amount: 0 },
      createdAt: new Date().toISOString(),
    };
    setCarts(prevCarts => [...prevCarts, newCart]);
    setActiveCartId(nextCartId);
    setNextCartId(prev => prev + 1);
    toast?.success('New cart created');
    return newCart;
  }, [nextCartId, toast]);

  // Switch to different cart
  const switchCart = useCallback((cartId) => {
    const cart = carts.find(c => c.id === cartId);
    if (cart) {
      setActiveCartId(cartId);
    }
  }, [carts]);

  // Close/remove cart
  const closeCart = useCallback((cartId) => {
    if (carts.length === 1) {
      toast?.warning('Cannot close the last cart');
      return false;
    }

    const cartToClose = carts.find(c => c.id === cartId);
    if (cartToClose?.items.length > 0) {
      if (!window.confirm('This cart has items. Are you sure you want to close it?')) {
        return false;
      }
    }

    const newCarts = carts.filter(c => c.id !== cartId);
    setCarts(newCarts);
    
    if (activeCartId === cartId) {
      setActiveCartId(newCarts[0].id);
    }
    
    toast?.info('Cart closed');
    return true;
  }, [carts, activeCartId, toast]);

  // Add product to cart
  const addItem = useCallback((product, quantity = 1) => {
    if (!product) {
      toast?.error('Invalid product');
      return false;
    }

    if (product.stock === 0) {
      toast?.error('Product is out of stock');
      return false;
    }

    const existingItem = activeCart.items.find(item => item.id === product.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      
      if (newQuantity > product.stock) {
        toast?.warning('Cannot add more than available stock');
        return false;
      }

      updateActiveCart({
        items: activeCart.items.map(item =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        )
      });
      toast?.success('Quantity updated');
    } else {
      if (quantity > product.stock) {
        toast?.warning('Cannot add more than available stock');
        return false;
      }

      updateActiveCart({
        items: [...activeCart.items, {
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.price,
          quantity: quantity,
          stock: product.stock,
          image: product.image,
          discount: 0,
          taxAmount: 0,
        }]
      });
      // toast?.success(`${product.name} added to cart`);
    }

    return true;
  }, [activeCart, updateActiveCart, toast]);

  // Update item quantity
  const updateQuantity = useCallback((itemId, newQuantity) => {
    const item = activeCart.items.find(i => i.id === itemId);
    
    if (!item) {
      toast?.error('Item not found in cart');
      return false;
    }

    if (newQuantity <= 0) {
      return removeItem(itemId);
    }

    if (newQuantity > item.stock) {
      toast?.warning('Cannot exceed available stock');
      return false;
    }

    updateActiveCart({
      items: activeCart.items.map(i =>
        i.id === itemId ? { ...i, quantity: newQuantity } : i
      )
    });

    return true;
  }, [activeCart, updateActiveCart, toast]);

  // Remove item from cart
  const removeItem = useCallback((itemId) => {
    updateActiveCart({
      items: activeCart.items.filter(item => item.id !== itemId)
    });
    // toast?.info('Item removed from cart');
    return true;
  }, [activeCart, updateActiveCart, toast]);

  // Clear entire cart
  const clearCart = useCallback((confirmed = false) => {
    if (!confirmed && activeCart.items.length > 0) {
      if (!window.confirm('Are you sure you want to clear the cart?')) {
        return false;
      }
    }

    updateActiveCart({
      items: [],
      customer: null,
      discount: { type: 'none', value: 0, amount: 0 }
    });
    // toast?.info('Cart cleared');
    return true;
  }, [activeCart, updateActiveCart, toast]);

  // Set customer for cart
  const setCustomer = useCallback((customer) => {
    updateActiveCart({ customer });
  }, [updateActiveCart]);

  // Remove customer from cart
  const removeCustomer = useCallback(() => {
    updateActiveCart({ customer: null });
    toast?.info('Customer removed');
  }, [updateActiveCart, toast]);

  // Apply discount to cart
  const applyDiscount = useCallback((discountData) => {
    if (discountData) {
      updateActiveCart({
        discount: {
          type: discountData.type,
          value: discountData.value,
          amount: discountData.amount,
          reason: discountData.reason,
        }
      });
      toast?.success('Discount applied');
    } else {
      updateActiveCart({
        discount: { type: 'none', value: 0, amount: 0 }
      });
      toast?.info('Discount removed');
    }
  }, [updateActiveCart, toast]);

  // Remove discount
  const removeDiscount = useCallback(() => {
    updateActiveCart({
      discount: { type: 'none', value: 0, amount: 0 }
    });
    toast?.info('Discount removed');
  }, [updateActiveCart, toast]);

  // Calculate cart totals
  const calculateTotals = useCallback((taxRate = 17) => {
    const subtotal = activeCart.items.reduce(
      (sum, item) => sum + (item.price * item.quantity),
      0
    );
    
    const discountAmount = activeCart.discount?.amount || 0;
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (taxRate / 100);
    const total = afterDiscount + taxAmount;

    return {
      subtotal,
      discountAmount,
      afterDiscount,
      taxAmount,
      total,
      itemCount: activeCart.items.reduce((sum, item) => sum + item.quantity, 0),
      uniqueItems: activeCart.items.length,
    };
  }, [activeCart]);

  // Check if cart is empty
  const isEmpty = activeCart.items.length === 0;

  // Get item count
  const itemCount = activeCart.items.reduce((sum, item) => sum + item.quantity, 0);

  const value = {
    // State
    carts,
    activeCart,
    activeCartId,
    isEmpty,
    itemCount,

    // Cart management
    createCart,
    switchCart,
    closeCart,

    // Item operations
    addItem,
    updateQuantity,
    removeItem,
    clearCart,

    // Customer operations
    setCustomer,
    removeCustomer,

    // Discount operations
    applyDiscount,
    removeDiscount,

    // Calculations
    calculateTotals,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};