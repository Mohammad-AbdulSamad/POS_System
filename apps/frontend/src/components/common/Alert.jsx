// src/components/common/Alert.jsx
import { forwardRef } from 'react';
import clsx from 'clsx';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

/**
 * Alert Component
 * 
 * A reusable alert component for displaying important messages and notifications.
 * Uses Tailwind CSS and custom theme variables from index.css
 * 
 * @example
 * <Alert variant="success" title="Success!">
 *   Your changes have been saved successfully.
 * </Alert>
 */

const Alert = forwardRef(
  (
    {
      children,
      variant = 'info',
      title,
      icon: CustomIcon = null,
      closable = false,
      onClose,
      actions,
      size = 'md',
      className = '',
      ...props
    },
    ref
  ) => {
    // Icon mapping
    const iconMap = {
      success: CheckCircle,
      danger: XCircle,
      warning: AlertTriangle,
      info: Info,
    };

    const Icon = CustomIcon || iconMap[variant];

    // Variant styles - uses CSS classes from index.css
    const variantStyles = {
      success: 'alert-success',
      danger: 'alert-danger',
      warning: 'alert-warning',
      info: 'alert-info',
    };

    // Icon color styles
    const iconColorStyles = {
      success: 'text-success-500',
      danger: 'text-danger-500',
      warning: 'text-warning-500',
      info: 'text-primary-500',
    };

    // Size styles
    const sizeStyles = {
      sm: 'text-xs p-3',
      md: 'text-sm p-4',
      lg: 'text-base p-5',
    };

    return (
      <div
        ref={ref}
        role="alert"
        className={clsx(
          'alert',
          variantStyles[variant],
          sizeStyles[size],
          'flex items-start gap-3',
          className
        )}
        {...props}
      >
        {/* Icon */}
        {Icon && (
          <Icon className={clsx('flex-shrink-0 mt-0.5', iconColorStyles[variant], {
            'h-4 w-4': size === 'sm',
            'h-5 w-5': size === 'md',
            'h-6 w-6': size === 'lg',
          })} />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <div className={clsx('font-semibold mb-1', {
              'text-sm': size === 'sm',
              'text-base': size === 'md',
              'text-lg': size === 'lg',
            })}>
              {title}
            </div>
          )}
          <div className={clsx({
            'text-xs': size === 'sm',
            'text-sm': size === 'md',
            'text-base': size === 'lg',
          })}>
            {children}
          </div>

          {/* Actions */}
          {actions && (
            <div className="flex items-center gap-2 mt-3">
              {actions}
            </div>
          )}
        </div>

        {/* Close button */}
        {closable && (
          <button
            type="button"
            onClick={onClose}
            className="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
            aria-label="Close alert"
          >
            <X className={clsx({
              'h-4 w-4': size === 'sm',
              'h-5 w-5': size === 'md',
              'h-6 w-6': size === 'lg',
            })} />
          </button>
        )}
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert;

/**
 * Example Usage:
 * 
 * import Alert from '@/components/common/Alert';
 * import Button from '@/components/common/Button';
 * import { useState } from 'react';
 * 
 * // Basic usage
 * <Alert variant="success">
 *   Your changes have been saved successfully.
 * </Alert>
 * 
 * <Alert variant="danger">
 *   An error occurred. Please try again.
 * </Alert>
 * 
 * <Alert variant="warning">
 *   This action cannot be undone.
 * </Alert>
 * 
 * <Alert variant="info">
 *   New updates are available.
 * </Alert>
 * 
 * // With title
 * <Alert variant="success" title="Success!">
 *   Your product has been added to the inventory.
 * </Alert>
 * 
 * <Alert variant="danger" title="Error">
 *   Failed to process the transaction. Please contact support.
 * </Alert>
 * 
 * // Closable alert
 * const [showAlert, setShowAlert] = useState(true);
 * 
 * {showAlert && (
 *   <Alert 
 *     variant="info" 
 *     closable 
 *     onClose={() => setShowAlert(false)}
 *   >
 *     This is a dismissible alert.
 *   </Alert>
 * )}
 * 
 * // Without icon
 * <Alert variant="info" icon={null}>
 *   This alert has no icon.
 * </Alert>
 * 
 * // Custom icon
 * import { ShoppingCart, Package } from 'lucide-react';
 * 
 * <Alert variant="success" icon={ShoppingCart}>
 *   Item added to cart successfully.
 * </Alert>
 * 
 * // With action buttons
 * <Alert 
 *   variant="warning" 
 *   title="Low Stock"
 *   actions={
 *     <>
 *       <Button size="sm" variant="outline">
 *         Ignore
 *       </Button>
 *       <Button size="sm" variant="warning">
 *         Reorder Now
 *       </Button>
 *     </>
 *   }
 * >
 *   Some items are running low in stock.
 * </Alert>
 * 
 * // Different sizes
 * <Alert variant="info" size="sm">
 *   Small alert message
 * </Alert>
 * 
 * <Alert variant="info" size="md">
 *   Medium alert message
 * </Alert>
 * 
 * <Alert variant="info" size="lg">
 *   Large alert message
 * </Alert>
 * 
 * // POS specific: Transaction error
 * <Alert variant="danger" title="Transaction Failed">
 *   Payment could not be processed. Please check the card details and try again.
 * </Alert>
 * 
 * // POS specific: Low stock warning
 * <Alert 
 *   variant="warning" 
 *   title="Inventory Alert"
 *   actions={
 *     <Button size="sm" variant="warning">
 *       View Items
 *     </Button>
 *   }
 * >
 *   15 products are below minimum stock level.
 * </Alert>
 * 
 * // POS specific: Shift reminder
 * <Alert variant="info" title="Shift Ending Soon" closable>
 *   Your shift ends in 30 minutes. Please prepare for handover.
 * </Alert>
 * 
 * // POS specific: Sync status
 * <Alert variant="success" title="Data Synced">
 *   All data has been successfully synced with the server at 2:30 PM.
 * </Alert>
 * 
 * // POS specific: Price override warning
 * <Alert 
 *   variant="warning" 
 *   title="Price Override Required"
 *   actions={
 *     <>
 *       <Button size="sm" variant="outline">
 *         Cancel
 *       </Button>
 *       <Button size="sm" variant="warning">
 *         Request Approval
 *       </Button>
 *     </>
 *   }
 * >
 *   This action requires manager approval to override the product price.
 * </Alert>
 * 
 * // POS specific: Return policy
 * <Alert variant="info" title="Return Policy">
 *   Items can be returned within 30 days with original receipt. 
 *   Opened electronics are subject to a 15% restocking fee.
 * </Alert>
 * 
 * // POS specific: Payment method alert
 * <Alert variant="warning" title="Cash Drawer Low">
 *   Cash drawer has less than $100 in change. Consider getting more change from the safe.
 * </Alert>
 * 
 * // POS specific: Customer credit
 * <Alert 
 *   variant="success" 
 *   title="Store Credit Available"
 *   actions={
 *     <Button size="sm" variant="success">
 *       Apply Credit
 *     </Button>
 *   }
 * >
 *   Customer has $25.00 in store credit available.
 * </Alert>
 * 
 * // POS specific: Network status
 * <Alert variant="danger" title="Offline Mode">
 *   No internet connection. Transactions will be synced when connection is restored.
 * </Alert>
 * 
 * // POS specific: Promotion active
 * <Alert variant="info" title="Active Promotion" icon={Package}>
 *   Buy 2 Get 1 Free promotion is active on selected items.
 * </Alert>
 * 
 * // POS specific: Receipt printer
 * <Alert 
 *   variant="warning" 
 *   title="Printer Warning"
 *   closable
 *   actions={
 *     <Button size="sm" variant="outline">
 *       Check Printer
 *     </Button>
 *   }
 * >
 *   Receipt printer is running low on paper. Please replace soon.
 * </Alert>
 * 
 * // POS specific: Refund processed
 * <Alert variant="success" title="Refund Processed">
 *   Refund of $45.99 has been processed and will appear in the customer's account within 3-5 business days.
 * </Alert>
 * 
 * // POS specific: Age verification
 * <Alert 
 *   variant="warning" 
 *   title="Age Verification Required"
 *   actions={
 *     <>
 *       <Button size="sm" variant="outline">
 *         Cancel Sale
 *       </Button>
 *       <Button size="sm" variant="warning">
 *         Verify Age
 *       </Button>
 *     </>
 *   }
 * >
 *   This product requires age verification before sale can be completed.
 * </Alert>
 * 
 * // POS specific: Discount applied
 * <Alert variant="success" title="Discount Applied" closable>
 *   15% employee discount has been applied to this transaction.
 * </Alert>
 * 
 * // POS specific: System maintenance
 * <Alert variant="info" title="Scheduled Maintenance">
 *   System maintenance is scheduled for tonight at 11:00 PM. 
 *   Please complete all transactions by 10:45 PM.
 * </Alert>
 * 
 * // POS specific: Void transaction
 * <Alert 
 *   variant="danger" 
 *   title="Void Transaction"
 *   actions={
 *     <>
 *       <Button size="sm" variant="outline">
 *         Cancel
 *       </Button>
 *       <Button size="sm" variant="danger">
 *         Confirm Void
 *       </Button>
 *     </>
 *   }
 * >
 *   Are you sure you want to void this transaction? This action cannot be undone.
 * </Alert>
 * 
 * // Multiple alerts in a page
 * <div className="space-y-4">
 *   <Alert variant="success" title="Success" closable>
 *     Products imported successfully.
 *   </Alert>
 *   
 *   <Alert variant="warning" title="Warning">
 *     Some SKUs were duplicated and skipped.
 *   </Alert>
 *   
 *   <Alert variant="info" title="Info">
 *     Import completed: 150 products added, 5 skipped.
 *   </Alert>
 * </div>
 * 
 * // In a form
 * <form className="space-y-4">
 *   <Alert variant="info" size="sm">
 *     All fields marked with * are required.
 *   </Alert>
 *   
 *   <Input label="Product Name" required />
 *   <Input label="Price" required />
 *   
 *   <Button type="submit">Save</Button>
 * </form>
 * 
 * // Conditional alert
 * {errors.length > 0 && (
 *   <Alert 
 *     variant="danger" 
 *     title={`${errors.length} Error(s) Found`}
 *     closable
 *     onClose={() => setErrors([])}
 *   >
 *     <ul className="list-disc list-inside space-y-1">
 *       {errors.map((error, index) => (
 *         <li key={index}>{error}</li>
 *       ))}
 *     </ul>
 *   </Alert>
 * )}
 * 
 * // With custom styling
 * <Alert 
 *   variant="success" 
 *   className="shadow-lg border-2"
 * >
 *   Custom styled alert with enhanced shadow and border.
 * </Alert>
 * 
 * // Rich content
 * <Alert variant="warning" title="Important Notice">
 *   <div className="space-y-2">
 *     <p>Please review the following before proceeding:</p>
 *     <ul className="list-disc list-inside space-y-1 ml-2">
 *       <li>Verify customer information</li>
 *       <li>Check payment method</li>
 *       <li>Confirm delivery address</li>
 *     </ul>
 *   </div>
 * </Alert>
 */