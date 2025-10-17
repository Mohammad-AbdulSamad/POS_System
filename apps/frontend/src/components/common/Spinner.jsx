// src/components/common/Spinner.jsx
import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Spinner Component
 * 
 * A reusable loading spinner component with multiple variants and sizes.
 * Uses Tailwind CSS for styling and animations.
 * 
 * @example
 * <Spinner size="md" variant="primary" />
 * <Spinner size="lg" variant="primary" label="Loading..." />
 */

const Spinner = forwardRef(
  (
    {
      size = 'md',
      variant = 'primary',
      label,
      overlay = false,
      fullScreen = false,
      className = '',
      ...props
    },
    ref
  ) => {
    // Size styles
    const sizeStyles = {
      xs: 'h-3 w-3 border-2',
      sm: 'h-4 w-4 border-2',
      md: 'h-8 w-8 border-2',
      lg: 'h-12 w-12 border-3',
      xl: 'h-16 w-16 border-4',
    };

    const labelSizeStyles = {
      xs: 'text-xs',
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
      xl: 'text-xl',
    };

    // Variant styles
    const variantStyles = {
      primary: 'border-primary-200 border-t-primary-600',
      secondary: 'border-secondary-200 border-t-secondary-600',
      success: 'border-success-200 border-t-success-600',
      warning: 'border-warning-200 border-t-warning-600',
      danger: 'border-danger-200 border-t-danger-600',
      white: 'border-gray-200 border-t-white',
      gray: 'border-gray-200 border-t-gray-600',
    };

    const labelColorStyles = {
      primary: 'text-primary-600',
      secondary: 'text-secondary-600',
      success: 'text-success-600',
      warning: 'text-warning-600',
      danger: 'text-danger-600',
      white: 'text-white',
      gray: 'text-gray-600',
    };

    const spinner = (
      <div
        ref={ref}
        className={clsx(
          'inline-flex flex-col items-center justify-center gap-3',
          className
        )}
        role="status"
        aria-live="polite"
        aria-label={label || 'Loading'}
        {...props}
      >
        {/* Spinner Circle */}
        <div
          className={clsx(
            'animate-spin rounded-full',
            sizeStyles[size],
            variantStyles[variant]
          )}
        />

        {/* Label */}
        {label && (
          <span
            className={clsx(
              'font-medium',
              labelSizeStyles[size],
              labelColorStyles[variant]
            )}
          >
            {label}
          </span>
        )}
      </div>
    );

    // Overlay wrapper
    if (overlay || fullScreen) {
      return (
        <div
          className={clsx(
            'flex items-center justify-center',
            'bg-white bg-opacity-90',
            {
              'fixed inset-0 z-50': fullScreen,
              'absolute inset-0 z-10': overlay && !fullScreen,
            }
          )}
        >
          {spinner}
        </div>
      );
    }

    return spinner;
  }
);

Spinner.displayName = 'Spinner';

export default Spinner;

/**
 * Dots Spinner Variant
 * Three bouncing dots animation
 */
export const DotsSpinner = forwardRef(
  (
    {
      size = 'md',
      variant = 'primary',
      className = '',
      ...props
    },
    ref
  ) => {
    const dotSizeStyles = {
      xs: 'h-1.5 w-1.5',
      sm: 'h-2 w-2',
      md: 'h-3 w-3',
      lg: 'h-4 w-4',
      xl: 'h-5 w-5',
    };

    const dotColorStyles = {
      primary: 'bg-primary-600',
      secondary: 'bg-secondary-600',
      success: 'bg-success-600',
      warning: 'bg-warning-600',
      danger: 'bg-danger-600',
      white: 'bg-white',
      gray: 'bg-gray-600',
    };

    return (
      <div
        ref={ref}
        className={clsx('inline-flex gap-1.5', className)}
        role="status"
        aria-label="Loading"
        {...props}
      >
        <div
          className={clsx(
            'rounded-full animate-bounce',
            dotSizeStyles[size],
            dotColorStyles[variant]
          )}
          style={{ animationDelay: '0ms' }}
        />
        <div
          className={clsx(
            'rounded-full animate-bounce',
            dotSizeStyles[size],
            dotColorStyles[variant]
          )}
          style={{ animationDelay: '150ms' }}
        />
        <div
          className={clsx(
            'rounded-full animate-bounce',
            dotSizeStyles[size],
            dotColorStyles[variant]
          )}
          style={{ animationDelay: '300ms' }}
        />
      </div>
    );
  }
);

DotsSpinner.displayName = 'DotsSpinner';

/**
 * Pulse Spinner Variant
 * Pulsing circle animation
 */
export const PulseSpinner = forwardRef(
  (
    {
      size = 'md',
      variant = 'primary',
      className = '',
      ...props
    },
    ref
  ) => {
    const pulseSizeStyles = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-8 w-8',
      lg: 'h-12 w-12',
      xl: 'h-16 w-16',
    };

    const pulseColorStyles = {
      primary: 'bg-primary-600',
      secondary: 'bg-secondary-600',
      success: 'bg-success-600',
      warning: 'bg-warning-600',
      danger: 'bg-danger-600',
      white: 'bg-white',
      gray: 'bg-gray-600',
    };

    return (
      <div
        ref={ref}
        className={clsx(
          'rounded-full animate-pulse',
          pulseSizeStyles[size],
          pulseColorStyles[variant],
          className
        )}
        role="status"
        aria-label="Loading"
        {...props}
      />
    );
  }
);

PulseSpinner.displayName = 'PulseSpinner';

/**
 * Example Usage:
 * 
 * import Spinner, { DotsSpinner, PulseSpinner } from '@/components/common/Spinner';
 * 
 * // Basic usage
 * <Spinner />
 * 
 * // With label
 * <Spinner label="Loading..." />
 * 
 * // Different sizes
 * <Spinner size="xs" />
 * <Spinner size="sm" />
 * <Spinner size="md" />
 * <Spinner size="lg" />
 * <Spinner size="xl" />
 * 
 * // Different variants
 * <Spinner variant="primary" />
 * <Spinner variant="secondary" />
 * <Spinner variant="success" />
 * <Spinner variant="warning" />
 * <Spinner variant="danger" />
 * <Spinner variant="white" />
 * <Spinner variant="gray" />
 * 
 * // With overlay (covers parent container)
 * <div className="relative h-64">
 *   <Spinner overlay label="Loading data..." />
 * </div>
 * 
 * // Full screen overlay
 * <Spinner fullScreen label="Processing..." variant="primary" />
 * 
 * // Dots spinner variant
 * <DotsSpinner size="md" variant="primary" />
 * 
 * // Pulse spinner variant
 * <PulseSpinner size="lg" variant="success" />
 * 
 * // In a button (already built into Button component, but can be custom)
 * <Button disabled>
 *   <Spinner size="sm" variant="white" />
 *   <span>Loading...</span>
 * </Button>
 * 
 * // In a card
 * <div className="card">
 *   <div className="flex items-center justify-center p-8">
 *     <Spinner size="lg" label="Loading products..." />
 *   </div>
 * </div>
 * 
 * // Centered in page
 * <div className="flex items-center justify-center min-h-screen">
 *   <Spinner size="xl" label="Loading application..." variant="primary" />
 * </div>
 * 
 * // POS specific: Transaction processing
 * const [processing, setProcessing] = useState(false);
 * 
 * {processing && (
 *   <Spinner 
 *     fullScreen 
 *     size="xl" 
 *     label="Processing payment..." 
 *     variant="primary"
 *   />
 * )}
 * 
 * // POS specific: Loading products
 * const ProductList = () => {
 *   const [loading, setLoading] = useState(true);
 *   const [products, setProducts] = useState([]);
 * 
 *   useEffect(() => {
 *     fetchProducts().then(data => {
 *       setProducts(data);
 *       setLoading(false);
 *     });
 *   }, []);
 * 
 *   if (loading) {
 *     return (
 *       <div className="flex items-center justify-center h-96">
 *         <Spinner size="lg" label="Loading products..." />
 *       </div>
 *     );
 *   }
 * 
 *   return <div>{/* Product list */
 //</div>;
//  * };
//  * 
//  * // POS specific: Table loading
//  * <div className="relative">
//  *   <table className="table-container">
//  *     {/* Table content */}
//  *   </table>
//  *   {loading && (
//  *     <Spinner overlay label="Refreshing data..." variant="primary" />
//  *   )}
//  * </div>
//  * 
//  * // POS specific: Sync indicator
//  * const SyncStatus = () => {
//  *   const [syncing, setSyncing] = useState(false);
//  * 
//  *   return (
//  *     <div className="flex items-center gap-2">
//  *       {syncing ? (
//  *         <>
//  *           <DotsSpinner size="sm" variant="primary" />
//  *           <span className="text-sm text-gray-600">Syncing...</span>
//  *         </>
//  *       ) : (
//  *         <span className="text-sm text-success-600">Synced</span>
//  *       )}
//  *     </div>
//  *   );
//  * };
//  * 
//  * // POS specific: Print receipt loading
//  * <Button onClick={handlePrint} disabled={printing}>
//  *   {printing ? (
//  *     <>
//  *       <Spinner size="sm" variant="white" />
//  *       <span>Printing...</span>
//  *     </>
//  *   ) : (
//  *     <>
//  *       <Printer className="h-4 w-4" />
//  *       <span>Print Receipt</span>
//  *     </>
//  *   )}
//  * </Button>
//  * 
//  * // POS specific: Modal loading state
//  * <Modal isOpen={isOpen} onClose={onClose} title="Product Details">
//  *   {loadingDetails ? (
//  *     <div className="flex items-center justify-center py-12">
//  *       <Spinner size="lg" label="Loading details..." />
//  *     </div>
//  *   ) : (
//  *     <div>{/* Product details */}</div>
//  *   )}
//  * </Modal>
//  * 
//  * // POS specific: Initial app loading
//  * const App = () => {
//  *   const [initializing, setInitializing] = useState(true);
//  * 
//  *   useEffect(() => {
//  *     initializeApp().then(() => {
//  *       setInitializing(false);
//  *     });
//  *   }, []);
//  * 
//  *   if (initializing) {
//  *     return (
//  *       <div className="flex flex-col items-center justify-center min-h-screen">
//  *         <Spinner size="xl" variant="primary" />
//  *         <p className="mt-4 text-lg text-gray-600">Initializing POS System...</p>
//  *       </div>
//  *     );
//  *   }
//  * 
//  *   return <MainApp />;
//  * };
//  * 
//  * // POS specific: Inline loading in lists
//  * <div className="space-y-2">
//  *   {items.map(item => (
//  *     <div key={item.id} className="flex items-center justify-between p-3 border rounded">
//  *       <span>{item.name}</span>
//  *       {item.loading ? (
//  *         <DotsSpinner size="sm" variant="primary" />
//  *       ) : (
//  *         <span>${item.price}</span>
//  *       )}
//  *     </div>
//  *   ))}
//  * </div>
//  * 
//  * // POS specific: Empty state with loading
//  * const EmptyState = ({ loading }) => {
//  *   if (loading) {
//  *     return (
//  *       <div className="text-center py-12">
//  *         <Spinner size="lg" label="Loading..." variant="gray" />
//  *       </div>
//  *     );
//  *   }
//  * 
//  *   return (
//  *     <div className="text-center py-12">
//  *       <p className="text-gray-500">No items found</p>
//  *     </div>
//  *   );
//  * };
//  * 
//  * // POS specific: Step indicator with loading
//  * const CheckoutSteps = ({ currentStep, loading }) => {
//  *   return (
//  *     <div className="flex items-center gap-4">
//  *       <div>Step {currentStep} of 3</div>
//  *       {loading && <DotsSpinner size="sm" variant="primary" />}
//  *     </div>
//  *   );
//  * };
//  * 
//  * // POS specific: Different spinners for different states
//  * const DataDisplay = ({ state }) => {
//  *   if (state === 'loading') {
//  *     return <Spinner size="lg" label="Loading..." />;
//  *   }
//  *   
//  *   if (state === 'syncing') {
//  *     return <DotsSpinner size="md" variant="primary" />;
//  *   }
//  *   
//  *   if (state === 'processing') {
//  *     return <PulseSpinner size="lg" variant="success" />;
//  *   }
//  *   
//  *   return <div>{/* Normal content */}</div>;
//  * };
//  * 
//  * // With custom colors (using className)
//  * <Spinner 
//  *   size="lg" 
//  *   className="[&>div]:border-purple-200 [&>div]:border-t-purple-600"
//  * />
//  * 
//  * // Multiple spinners showing different operations
//  * <div className="grid grid-cols-3 gap-4">
//  *   <div className="text-center">
//  *     <Spinner size="md" variant="primary" />
//  *     <p className="mt-2 text-sm">Loading Products</p>
//  *   </div>
//  *   <div className="text-center">
//  *     <DotsSpinner size="md" variant="success" />
//  *     <p className="mt-2 text-sm">Syncing Data</p>
//  *   </div>
//  *   <div className="text-center">
//  *     <PulseSpinner size="md" variant="warning" />
//  *     <p className="mt-2 text-sm">Processing</p>
//  *   </div>
//  * </div>
//  */