// src/components/common/Toast.jsx
import { useState, useEffect, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Toast Context
 */
const ToastContext = createContext();

/**
 * Toast Provider Component
 * Wrap your app with this to enable toast notifications
 */
export const ToastProvider = ({ children, position = 'top-right', maxToasts = 5 }) => {
  const [toasts, setToasts] = useState([]);

  const addToast = (message, options = {}) => {
    const id = Date.now() + Math.random();
    const toast = {
      id,
      message,
      variant: options.variant || 'info',
      duration: options.duration ?? 5000,
      closable: options.closable ?? true,
      icon: options.icon,
      ...options,
    };

    setToasts((prev) => {
      const newToasts = [toast, ...prev];
      return newToasts.slice(0, maxToasts);
    });

    // Auto remove after duration
    if (toast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    }

    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const removeAll = () => {
    setToasts([]);
  };

  // Helper methods for different variants
  const toast = {
    success: (message, options) => addToast(message, { ...options, variant: 'success' }),
    error: (message, options) => addToast(message, { ...options, variant: 'danger' }),
    warning: (message, options) => addToast(message, { ...options, variant: 'warning' }),
    info: (message, options) => addToast(message, { ...options, variant: 'info' }),
    custom: addToast,
    remove: removeToast,
    removeAll,
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} position={position} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

/**
 * Hook to use toast notifications
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

/**
 * Toast Container Component
 */
const ToastContainer = ({ toasts, position, onRemove }) => {
  const positionStyles = {
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
  };

  const content = (
    <div
      className={clsx(
        'fixed z-50 flex flex-col gap-2 pointer-events-none',
        'w-full max-w-sm',
        positionStyles[position]
      )}
    >
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );

  return createPortal(content, document.body);
};

/**
 * Individual Toast Component
 */
const Toast = ({ toast, onRemove }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(toast.id);
    }, 300);
  };

  useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => {
      // Animation class already applied
    }, 10);
    return () => clearTimeout(timer);
  }, []);

  // Icon mapping
  const iconMap = {
    success: CheckCircle,
    danger: XCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const Icon = toast.icon || iconMap[toast.variant];

  // Variant styles
  const variantStyles = {
    success: 'bg-success-50 border-success-200 text-success-800',
    danger: 'bg-danger-50 border-danger-200 text-danger-800',
    warning: 'bg-warning-50 border-warning-200 text-warning-800',
    info: 'bg-primary-50 border-primary-200 text-primary-800',
  };

  const iconColorStyles = {
    success: 'text-success-500',
    danger: 'text-danger-500',
    warning: 'text-warning-500',
    info: 'text-primary-500',
  };

  return (
    <div
      className={clsx(
        'pointer-events-auto',
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg',
        'transition-all duration-300',
        variantStyles[toast.variant],
        {
          'animate-slideInRight': !isExiting,
          'animate-slideOutRight': isExiting,
        }
      )}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      {Icon && (
        <Icon className={clsx('h-5 w-5 flex-shrink-0 mt-0.5', iconColorStyles[toast.variant])} />
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <div className="font-semibold text-sm mb-1">{toast.title}</div>
        )}
        <div className="text-sm">{toast.message}</div>
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className="text-sm font-medium underline mt-2 hover:no-underline"
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* Close button */}
      {toast.closable && (
        <button
          onClick={handleClose}
          className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition-opacity"
          aria-label="Close notification"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};

Toast.displayName = 'Toast';
ToastProvider.displayName = 'ToastProvider';

export default Toast;

/**
 * Example Usage:
 * 
 * // 1. Wrap your app with ToastProvider in main App.jsx or index.jsx
 * import { ToastProvider } from '@/components/common/Toast';
 * 
 * function App() {
 *   return (
 *     <ToastProvider position="top-right" maxToasts={5}>
 *       <YourAppContent />
 *     </ToastProvider>
 *   );
 * }
 * 
 * // 2. Use the useToast hook in any component
 * import { useToast } from '@/components/common/Toast';
 * 
 * function MyComponent() {
 *   const toast = useToast();
 * 
 *   // Success notification
 *   const handleSuccess = () => {
 *     toast.success('Product added successfully!');
 *   };
 * 
 *   // Error notification
 *   const handleError = () => {
 *     toast.error('Failed to save product. Please try again.');
 *   };
 * 
 *   // Warning notification
 *   const handleWarning = () => {
 *     toast.warning('Stock is running low!');
 *   };
 * 
 *   // Info notification
 *   const handleInfo = () => {
 *     toast.info('New update available.');
 *   };
 * 
 *   return (
 *     <div>
 *       <Button onClick={handleSuccess}>Success</Button>
 *       <Button onClick={handleError}>Error</Button>
 *       <Button onClick={handleWarning}>Warning</Button>
 *       <Button onClick={handleInfo}>Info</Button>
 *     </div>
 *   );
 * }
 * 
 * // With custom duration
 * toast.success('This will disappear in 3 seconds', { duration: 3000 });
 * 
 * // Permanent toast (doesn't auto-close)
 * toast.error('Critical error', { duration: 0 });
 * 
 * // Without close button
 * toast.info('Processing...', { closable: false, duration: 0 });
 * 
 * // With title
 * toast.success('Success!', {
 *   title: 'Operation Complete',
 *   duration: 4000
 * });
 * 
 * // With action button
 * toast.info('Product deleted', {
 *   action: {
 *     label: 'Undo',
 *     onClick: () => {
 *       // Restore the product
 *       console.log('Undo delete');
 *     }
 *   },
 *   duration: 8000
 * });
 * 
 * // Custom icon
 * import { ShoppingCart } from 'lucide-react';
 * 
 * toast.custom('Item added to cart', {
 *   variant: 'success',
 *   icon: ShoppingCart
 * });
 * 
 * // Remove specific toast
 * const toastId = toast.success('Processing...');
 * // Later...
 * toast.remove(toastId);
 * 
 * // Remove all toasts
 * toast.removeAll();
 * 
 * // Different positions
 * <ToastProvider position="top-left">
 * <ToastProvider position="top-center">
 * <ToastProvider position="top-right">
 * <ToastProvider position="bottom-left">
 * <ToastProvider position="bottom-center">
 * <ToastProvider position="bottom-right">
 * 
 * // POS specific: Product operations
 * const ProductForm = () => {
 *   const toast = useToast();
 * 
 *   const handleSaveProduct = async () => {
 *     try {
 *       await saveProduct(productData);
 *       toast.success('Product saved successfully!');
 *     } catch (error) {
 *       toast.error('Failed to save product. Please try again.');
 *     }
 *   };
 * 
 *   const handleDeleteProduct = async () => {
 *     try {
 *       await deleteProduct(productId);
 *       toast.success('Product deleted', {
 *         action: {
 *           label: 'Undo',
 *           onClick: () => restoreProduct(productId)
 *         }
 *       });
 *     } catch (error) {
 *       toast.error('Failed to delete product');
 *     }
 *   };
 * 
 *   return (
 *     <form onSubmit={handleSaveProduct}>
 *       {/* Form fields */
//  *       <Button type="submit">Save</Button>
//  *     </form>
//  *   );
//  * };
//  * 
//  * // POS specific: Transaction notifications
//  * const Checkout = () => {
//  *   const toast = useToast();
//  * 
//  *   const processPayment = async () => {
//  *     const loadingToast = toast.info('Processing payment...', {
//  *       closable: false,
//  *       duration: 0
//  *     });
//  * 
//  *     try {
//  *       await processTransaction();
//  *       toast.remove(loadingToast);
//  *       toast.success('Payment processed successfully!', {
//  *         title: 'Transaction Complete',
//  *         action: {
//  *           label: 'Print Receipt',
//  *           onClick: () => printReceipt()
//  *         }
//  *       });
//  *     } catch (error) {
//  *       toast.remove(loadingToast);
//  *       toast.error('Payment failed. Please try again.');
//  *     }
//  *   };
//  * 
//  *   return <Button onClick={processPayment}>Complete Sale</Button>;
//  * };
//  * 
//  * // POS specific: Inventory warnings
//  * const InventoryCheck = () => {
//  *   const toast = useToast();
//  * 
//  *   useEffect(() => {
//  *     checkInventory().then((lowStockItems) => {
//  *       if (lowStockItems.length > 0) {
//  *         toast.warning(`${lowStockItems.length} items are low in stock`, {
//  *           title: 'Inventory Alert',
//  *           action: {
//  *             label: 'View Items',
//  *             onClick: () => navigate('/inventory')
//  *           },
//  *           duration: 10000
//  *         });
//  *       }
//  *     });
//  *   }, []);
//  * 
//  *   return null;
//  * };
//  * 
//  * // POS specific: Shift management
//  * const ShiftEnd = () => {
//  *   const toast = useToast();
//  * 
//  *   const handleEndShift = async () => {
//  *     try {
//  *       const summary = await endShift();
//  *       toast.success('Shift ended successfully', {
//  *         title: 'Shift Summary',
//  *         message: `Total Sales: $${summary.totalSales} | Transactions: ${summary.count}`,
//  *         duration: 8000
//  *       });
//  *     } catch (error) {
//  *       toast.error('Failed to end shift');
//  *     }
//  *   };
//  * 
//  *   return <Button onClick={handleEndShift}>End Shift</Button>;
//  * };
//  * 
//  * // POS specific: Sync status
//  * const DataSync = () => {
//  *   const toast = useToast();
//  * 
//  *   const syncData = async () => {
//  *     toast.info('Syncing data with server...', {
//  *       closable: false,
//  *       duration: 0
//  *     });
//  * 
//  *     try {
//  *       await syncWithServer();
//  *       toast.removeAll();
//  *       toast.success('Data synced successfully');
//  *     } catch (error) {
//  *       toast.removeAll();
//  *       toast.error('Sync failed. Working offline.');
//  *     }
//  *   };
//  * 
//  *   return <Button onClick={syncData}>Sync Now</Button>;
//  * };
//  * 
//  * // POS specific: Bulk operations
//  * const BulkActions = () => {
//  *   const toast = useToast();
//  * 
//  *   const handleBulkUpdate = async (selectedItems) => {
//  *     const progressToast = toast.info(`Updating ${selectedItems.length} items...`, {
//  *       closable: false,
//  *       duration: 0
//  *     });
//  * 
//  *     try {
//  *       await updateItems(selectedItems);
//  *       toast.remove(progressToast);
//  *       toast.success(`${selectedItems.length} items updated successfully`);
//  *     } catch (error) {
//  *       toast.remove(progressToast);
//  *       toast.error('Some items failed to update');
//  *     }
//  *   };
//  * 
//  *   return <Button onClick={handleBulkUpdate}>Update Selected</Button>;
//  * };
//  * 
//  * // POS specific: Customer actions
//  * const CustomerForm = () => {
//  *   const toast = useToast();
//  * 
//  *   const handleSaveCustomer = async () => {
//  *     try {
//  *       await saveCustomer(customerData);
//  *       toast.success('Customer profile saved', {
//  *         action: {
//  *           label: 'View Profile',
//  *           onClick: () => navigate(`/customers/${customerId}`)
//  *         }
//  *       });
//  *     } catch (error) {
//  *       toast.error('Failed to save customer profile');
//  *     }
//  *   };
//  * 
//  *   return <Button onClick={handleSaveCustomer}>Save Customer</Button>;
//  * };
//  */