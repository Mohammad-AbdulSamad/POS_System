// src/components/common/ConfirmDialog.jsx
import { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import clsx from 'clsx';

/**
 * ConfirmDialog Component
 * 
 * A specialized modal for confirmation dialogs with customizable actions.
 * Built on top of the Modal component with preconfigured confirmation behavior.
 * 
 * @example
 * <ConfirmDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Product"
 *   description="Are you sure you want to delete this product?"
 *   confirmText="Delete"
 *   variant="danger"
 * />
 */

const ConfirmDialog = ({
  isOpen = false,
  onClose,
  onConfirm,
  onCancel,
  title = 'Confirm Action',
  description,
  children,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  icon: Icon = null,
  loading = false,
  disabled = false,
  size = 'sm',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  destructive = false,
  className = '',
  ...props
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  // Determine button variant based on destructive prop or variant
  const confirmVariant = destructive ? 'danger' : variant;

  // Determine icon color based on variant
  const iconColorClass = {
    primary: 'text-primary-500',
    secondary: 'text-secondary-500',
    success: 'text-success-500',
    warning: 'text-warning-500',
    danger: 'text-danger-500',
  }[variant];

  const handleConfirm = async () => {
    if (disabled || isProcessing) return;

    try {
      setIsProcessing(true);
      await onConfirm?.();
      onClose?.();
    } catch (error) {
      console.error('Confirmation action failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (isProcessing) return;
    onCancel?.();
    onClose?.();
  };

  const footer = (
    <>
      <Button
        variant="outline"
        onClick={handleCancel}
        disabled={isProcessing}
      >
        {cancelText}
      </Button>
      <Button
        variant={confirmVariant}
        onClick={handleConfirm}
        loading={isProcessing || loading}
        disabled={disabled}
      >
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={isProcessing ? undefined : onClose}
      title={title}
      size={size}
      footer={footer}
      showCloseButton={showCloseButton && !isProcessing}
      closeOnOverlayClick={closeOnOverlayClick && !isProcessing}
      closeOnEsc={closeOnEsc && !isProcessing}
      className={className}
      {...props}
    >
      <div className="flex items-start gap-4">
        {/* Icon */}
        {Icon && (
          <div
            className={clsx(
              'flex-shrink-0 rounded-full p-3',
              {
                'bg-primary-100': variant === 'primary',
                'bg-secondary-100': variant === 'secondary',
                'bg-success-100': variant === 'success',
                'bg-warning-100': variant === 'warning',
                'bg-danger-100': variant === 'danger' || destructive,
              }
            )}
          >
            <Icon className={clsx('h-6 w-6', iconColorClass)} />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {description && (
            <p className="text-sm text-gray-600 leading-relaxed">
              {description}
            </p>
          )}
          {children}
        </div>
      </div>
    </Modal>
  );
};

ConfirmDialog.displayName = 'ConfirmDialog';

export default ConfirmDialog;

/**
 * Example Usage:
 * 
 * import ConfirmDialog from '@/components/common/ConfirmDialog';
 * import { 
 *   Trash2, 
 *   AlertTriangle, 
 *   CheckCircle, 
 *   XCircle,
 *   LogOut,
 *   Archive,
 *   RefreshCw
 * } from 'lucide-react';
 * import { useState } from 'react';
 * 
 * // Basic usage
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * <Button onClick={() => setIsOpen(true)}>Delete</Button>
 * 
 * <ConfirmDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={() => {
 *     console.log('Confirmed!');
 *     // Perform delete action
 *   }}
 *   title="Delete Product"
 *   description="Are you sure you want to delete this product? This action cannot be undone."
 *   confirmText="Delete"
 *   variant="danger"
 *   icon={Trash2}
 * />
 * 
 * // Destructive action (uses danger variant automatically)
 * <ConfirmDialog
 *   isOpen={deleteOpen}
 *   onClose={() => setDeleteOpen(false)}
 *   onConfirm={handleDelete}
 *   title="Delete Item"
 *   description="This will permanently delete the item."
 *   destructive
 *   icon={Trash2}
 * />
 * 
 * // Warning dialog
 * <ConfirmDialog
 *   isOpen={warningOpen}
 *   onClose={() => setWarningOpen(false)}
 *   onConfirm={handleProceed}
 *   title="Low Stock Warning"
 *   description="This product has low stock. Do you want to proceed with the sale?"
 *   confirmText="Proceed"
 *   cancelText="Cancel"
 *   variant="warning"
 *   icon={AlertTriangle}
 * />
 * 
 * // Success confirmation
 * <ConfirmDialog
 *   isOpen={successOpen}
 *   onClose={() => setSuccessOpen(false)}
 *   onConfirm={handleComplete}
 *   title="Complete Order"
 *   description="Mark this order as completed and send confirmation to customer?"
 *   confirmText="Complete"
 *   variant="success"
 *   icon={CheckCircle}
 * />
 * 
 * // With async operation
 * const handleAsyncDelete = async () => {
 *   await deleteProduct(productId);
 *   // The dialog will show loading state automatically
 * };
 * 
 * <ConfirmDialog
 *   isOpen={asyncOpen}
 *   onClose={() => setAsyncOpen(false)}
 *   onConfirm={handleAsyncDelete}
 *   title="Delete Product"
 *   description="Deleting product from database..."
 *   confirmText="Delete"
 *   destructive
 *   icon={Trash2}
 * />
 * 
 * // With custom content (children)
 * <ConfirmDialog
 *   isOpen={customOpen}
 *   onClose={() => setCustomOpen(false)}
 *   onConfirm={handleBulkDelete}
 *   title="Delete Multiple Products"
 *   confirmText="Delete All"
 *   destructive
 *   icon={Trash2}
 * >
 *   <div className="mt-3">
 *     <p className="text-sm text-gray-600 mb-2">
 *       You are about to delete the following products:
 *     </p>
 *     <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
 *       <li>Product A</li>
 *       <li>Product B</li>
 *       <li>Product C</li>
 *     </ul>
 *     <p className="text-sm text-danger-600 font-medium mt-3">
 *       This action cannot be undone!
 *     </p>
 *   </div>
 * </ConfirmDialog>
 * 
 * // Logout confirmation
 * <ConfirmDialog
 *   isOpen={logoutOpen}
 *   onClose={() => setLogoutOpen(false)}
 *   onConfirm={handleLogout}
 *   title="Logout"
 *   description="Are you sure you want to logout from your account?"
 *   confirmText="Logout"
 *   variant="primary"
 *   icon={LogOut}
 * />
 * 
 * // Archive confirmation
 * <ConfirmDialog
 *   isOpen={archiveOpen}
 *   onClose={() => setArchiveOpen(false)}
 *   onConfirm={handleArchive}
 *   title="Archive Product"
 *   description="Archived products won't appear in your active inventory but can be restored later."
 *   confirmText="Archive"
 *   variant="secondary"
 *   icon={Archive}
 * />
 * 
 * // With onCancel handler
 * <ConfirmDialog
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onConfirm={handleSave}
 *   onCancel={() => {
 *     console.log('User cancelled');
 *     setIsOpen(false);
 *   }}
 *   title="Save Changes"
 *   description="Do you want to save your changes before leaving?"
 *   confirmText="Save"
 *   cancelText="Discard"
 * />
 * 
 * // POS specific: Cancel transaction
 * <ConfirmDialog
 *   isOpen={cancelTxOpen}
 *   onClose={() => setCancelTxOpen(false)}
 *   onConfirm={handleCancelTransaction}
 *   title="Cancel Transaction"
 *   description="Are you sure you want to cancel this transaction? All items will be removed from the cart."
 *   confirmText="Cancel Transaction"
 *   destructive
 *   icon={XCircle}
 * />
 * 
 * // POS specific: Process refund
 * <ConfirmDialog
 *   isOpen={refundOpen}
 *   onClose={() => setRefundOpen(false)}
 *   onConfirm={handleRefund}
 *   title="Process Refund"
 *   confirmText="Process Refund"
 *   variant="warning"
 *   icon={RefreshCw}
 * >
 *   <div className="space-y-2">
 *     <p className="text-sm text-gray-600">
 *       You are about to process a refund of <strong>$125.00</strong>
 *     </p>
 *     <div className="bg-warning-50 border border-warning-200 rounded-lg p-3 mt-3">
 *       <p className="text-sm text-warning-800">
 *         This will refund the payment to the customer's original payment method.
 *       </p>
 *     </div>
 *   </div>
 * </ConfirmDialog>
 * 
 * // POS specific: Void sale
 * <ConfirmDialog
 *   isOpen={voidOpen}
 *   onClose={() => setVoidOpen(false)}
 *   onConfirm={handleVoidSale}
 *   title="Void Sale"
 *   description="This will void the sale and reverse the transaction. This action requires manager approval."
 *   confirmText="Void Sale"
 *   destructive
 *   icon={XCircle}
 * />
 * 
 * // POS specific: End shift
 * <ConfirmDialog
 *   isOpen={endShiftOpen}
 *   onClose={() => setEndShiftOpen(false)}
 *   onConfirm={handleEndShift}
 *   title="End Shift"
 *   confirmText="End Shift"
 *   variant="primary"
 *   icon={LogOut}
 * >
 *   <div className="space-y-3">
 *     <p className="text-sm text-gray-600">
 *       Are you sure you want to end your shift?
 *     </p>
 *     <div className="bg-gray-50 rounded-lg p-3 space-y-2">
 *       <div className="flex justify-between text-sm">
 *         <span className="text-gray-600">Total Sales:</span>
 *         <span className="font-semibold">$1,245.00</span>
 *       </div>
 *       <div className="flex justify-between text-sm">
 *         <span className="text-gray-600">Transactions:</span>
 *         <span className="font-semibold">28</span>
 *       </div>
 *       <div className="flex justify-between text-sm">
 *         <span className="text-gray-600">Shift Duration:</span>
 *         <span className="font-semibold">8h 15m</span>
 *       </div>
 *     </div>
 *   </div>
 * </ConfirmDialog>
 * 
 * // POS specific: Clear cart
 * <ConfirmDialog
 *   isOpen={clearCartOpen}
 *   onClose={() => setClearCartOpen(false)}
 *   onConfirm={handleClearCart}
 *   title="Clear Cart"
 *   description="Remove all items from the cart? This action cannot be undone."
 *   confirmText="Clear Cart"
 *   cancelText="Keep Items"
 *   variant="warning"
 *   icon={Trash2}
 * />
 * 
 * // Disabled confirm button (conditional)
 * <ConfirmDialog
 *   isOpen={conditionalOpen}
 *   onClose={() => setConditionalOpen(false)}
 *   onConfirm={handleConfirm}
 *   title="Complete Action"
 *   description="Please ensure all required fields are filled."
 *   disabled={!isFormValid}
 *   confirmText="Complete"
 * />
 * 
 * // No close on overlay click (important actions)
 * <ConfirmDialog
 *   isOpen={importantOpen}
 *   onClose={() => setImportantOpen(false)}
 *   onConfirm={handleImportantAction}
 *   title="Important Action"
 *   description="This is a critical action that requires your confirmation."
 *   closeOnOverlayClick={false}
 *   closeOnEsc={false}
 *   showCloseButton={false}
 *   destructive
 * />
 * 
 * // Complete implementation example
 * const ProductList = () => {
 *   const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
 *   const [selectedProduct, setSelectedProduct] = useState(null);
 * 
 *   const handleDeleteClick = (product) => {
 *     setSelectedProduct(product);
 *     setDeleteDialogOpen(true);
 *   };
 * 
 *   const handleDeleteConfirm = async () => {
 *     try {
 *       await deleteProduct(selectedProduct.id);
 *       toast.success('Product deleted successfully');
 *     } catch (error) {
 *       toast.error('Failed to delete product');
 *       throw error; // Re-throw to keep dialog open
 *     }
 *   };
 * 
 *   return (
 *     <>
 *       <table>
 *         {products.map(product => (
 *           <tr key={product.id}>
 *             <td>{product.name}</td>
 *             <td>
 *               <Button
 *                 variant="danger"
 *                 size="sm"
 *                 onClick={() => handleDeleteClick(product)}
 *               >
 *                 Delete
 *               </Button>
 *             </td>
 *           </tr>
 *         ))}
 *       </table>
 * 
 *       <ConfirmDialog
 *         isOpen={deleteDialogOpen}
 *         onClose={() => setDeleteDialogOpen(false)}
 *         onConfirm={handleDeleteConfirm}
 *         title="Delete Product"
 *         description={`Are you sure you want to delete "${selectedProduct?.name}"?`}
 *         destructive
 *         icon={Trash2}
 *       />
 *     </>
 *   );
 * };
 */