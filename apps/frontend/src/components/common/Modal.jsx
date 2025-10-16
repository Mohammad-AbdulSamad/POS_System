// src/components/common/Modal.jsx
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

/**
 * Modal Component
 * 
 * A reusable modal/dialog component with animations, accessibility, and flexible sizing.
 * Uses React Portal for proper rendering outside the DOM hierarchy.
 * 
 * @example
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="Delete Product"
 *   size="md"
 * >
 *   <p>Are you sure you want to delete this product?</p>
 * </Modal>
 */

const Modal = ({
  isOpen = false,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  className = '',
  overlayClassName = '',
  contentClassName = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  ...props
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Size styles
  const sizeStyles = {
    xs: 'max-w-xs',
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEsc, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save the currently focused element
      previousActiveElement.current = document.activeElement;
      
      // Lock body scroll
      document.body.style.overflow = 'hidden';
      
      // Focus the modal
      modalRef.current?.focus();
    } else {
      // Restore body scroll
      document.body.style.overflow = '';
      
      // Restore focus to the previously focused element
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  // Don't render if not open
  if (!isOpen) return null;

  const modalContent = (
    <div
      className={clsx(
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'animate-fadeIn',
        overlayClassName
      )}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm" />

      {/* Modal Content */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className={clsx(
          'relative bg-white rounded-lg shadow-xl',
          'w-full animate-slideUp',
          'focus:outline-none',
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className={clsx(
              'flex items-center justify-between px-6 py-4',
              'border-b border-gray-200',
              headerClassName
            )}
          >
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold text-gray-900"
              >
                {title}
              </h2>
            )}
            
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className={clsx(
                  'text-gray-400 hover:text-gray-600',
                  'rounded-lg p-1.5 transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500',
                  { 'ml-auto': !title }
                )}
                aria-label="Close modal"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div
          className={clsx(
            'px-6 py-4',
            'overflow-y-auto max-h-[calc(100vh-200px)]',
            contentClassName,
            bodyClassName
          )}
        >
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div
            className={clsx(
              'flex items-center justify-end gap-3 px-6 py-4',
              'border-t border-gray-200 bg-gray-50',
              footerClassName
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  // Render modal using Portal
  return createPortal(modalContent, document.body);
};

Modal.displayName = 'Modal';

export default Modal;

/**
 * Example Usage:
 * 
 * import Modal from '@/components/common/Modal';
 * import Button from '@/components/common/Button';
 * import { useState } from 'react';
 * import { Trash2, AlertTriangle } from 'lucide-react';
 * 
 * // Basic usage
 * const [isOpen, setIsOpen] = useState(false);
 * 
 * <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
 * 
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Modal Title"
 * >
 *   <p>This is the modal content.</p>
 * </Modal>
 * 
 * // With footer actions
 * <Modal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   title="Confirm Action"
 *   footer={
 *     <>
 *       <Button variant="outline" onClick={() => setIsOpen(false)}>
 *         Cancel
 *       </Button>
 *       <Button variant="primary" onClick={handleConfirm}>
 *         Confirm
 *       </Button>
 *     </>
 *   }
 * >
 *   <p>Are you sure you want to proceed?</p>
 * </Modal>
 * 
 * // Delete confirmation modal
 * <Modal
 *   isOpen={deleteModalOpen}
 *   onClose={() => setDeleteModalOpen(false)}
 *   title="Delete Product"
 *   size="sm"
 *   footer={
 *     <>
 *       <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>
 *         Cancel
 *       </Button>
 *       <Button variant="danger" icon={Trash2} onClick={handleDelete}>
 *         Delete
 *       </Button>
 *     </>
 *   }
 * >
 *   <div className="flex items-start gap-3">
 *     <AlertTriangle className="h-6 w-6 text-danger-500 flex-shrink-0" />
 *     <div>
 *       <p className="text-gray-700">
 *         Are you sure you want to delete this product? This action cannot be undone.
 *       </p>
 *     </div>
 *   </div>
 * </Modal>
 * 
 * // Form modal
 * <Modal
 *   isOpen={formModalOpen}
 *   onClose={() => setFormModalOpen(false)}
 *   title="Add New Product"
 *   size="lg"
 *   footer={
 *     <>
 *       <Button variant="outline" onClick={() => setFormModalOpen(false)}>
 *         Cancel
 *       </Button>
 *       <Button variant="primary" onClick={handleSubmit}>
 *         Save Product
 *       </Button>
 *     </>
 *   }
 * >
 *   <form className="space-y-4">
 *     <Input label="Product Name" placeholder="Enter product name" />
 *     <Input label="Price" type="number" placeholder="0.00" />
 *     <Input label="SKU" placeholder="Enter SKU" />
 *   </form>
 * </Modal>
 * 
 * // Large content modal with scrolling
 * <Modal
 *   isOpen={detailsModalOpen}
 *   onClose={() => setDetailsModalOpen(false)}
 *   title="Product Details"
 *   size="2xl"
 * >
 *   <div className="space-y-4">
 *     <h3 className="font-semibold">Description</h3>
 *     <p className="text-gray-600">Long content that will scroll...</p>
 *     {/* More content */
//  *   </div>
//  * </Modal>
//  * 
//  * // Without close button and overlay click disabled
//  * <Modal
//  *   isOpen={loadingModalOpen}
//  *   onClose={() => {}}
//  *   title="Processing..."
//  *   showCloseButton={false}
//  *   closeOnOverlayClick={false}
//  *   closeOnEsc={false}
//  * >
//  *   <div className="flex items-center justify-center py-8">
//  *     <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
//  *   </div>
//  * </Modal>
//  * 
//  * // Custom styling
//  * <Modal
//  *   isOpen={customModalOpen}
//  *   onClose={() => setCustomModalOpen(false)}
//  *   title="Custom Styled Modal"
//  *   headerClassName="bg-primary-500 text-white"
//  *   bodyClassName="bg-gray-50"
//  *   footerClassName="bg-primary-50"
//  * >
//  *   <p>This modal has custom styling.</p>
//  * </Modal>
//  */