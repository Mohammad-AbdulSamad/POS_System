// src/components/common/Checkbox.jsx
import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Checkbox Component
 * 
 * A reusable checkbox component with label, error handling, description, and custom styling.
 * Uses Tailwind CSS and custom theme variables from index.css
 * 
 * @example
 * <Checkbox
 *   label="Accept terms and conditions"
 *   checked={accepted}
 *   onChange={(e) => setAccepted(e.target.checked)}
 * />
 */

const Checkbox = forwardRef(
  (
    {
      label,
      description,
      checked = false,
      onChange,
      onBlur,
      onFocus,
      error,
      disabled = false,
      required = false,
      size = 'md',
      className = '',
      checkboxClassName = '',
      labelClassName = '',
      descriptionClassName = '',
      id,
      name,
      value,
      indeterminate = false,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const checkboxId = id || `checkbox-${name || Math.random().toString(36).substr(2, 9)}`;

    // Size styles
    const sizeStyles = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const labelSizeStyles = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    const descriptionSizeStyles = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    };

    // Base checkbox styles
    const baseCheckboxStyles = clsx(
      'rounded border-2 transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
      'cursor-pointer',
      'disabled:cursor-not-allowed disabled:opacity-50',
      sizeStyles[size]
    );

    // Checkbox state styles
    const checkboxStateStyles = clsx({
      'border-gray-300 text-primary-600 hover:border-primary-500': !error && !disabled,
      'border-danger-500 text-danger-600': error,
      'border-gray-300': disabled,
    });

    return (
      <div className={clsx('relative flex items-start', className)}>
        <div className="flex items-center h-6">
          <input
            ref={ref}
            id={checkboxId}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            disabled={disabled}
            required={required}
            value={value}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={error ? `${checkboxId}-error` : undefined}
            className={clsx(
              baseCheckboxStyles,
              checkboxStateStyles,
              checkboxClassName
            )}
            {...props}
          />
        </div>

        {/* Label and Description Container */}
        {(label || description) && (
          <div className="ml-3 flex-1">
            {label && (
              <label
                htmlFor={checkboxId}
                className={clsx(
                  'font-medium text-gray-700 cursor-pointer select-none',
                  {
                    'text-gray-400 cursor-not-allowed': disabled,
                    'text-danger-700': error,
                  },
                  labelSizeStyles[size],
                  labelClassName
                )}
              >
                {label}
                {required && <span className="text-danger-500 ml-1">*</span>}
              </label>
            )}

            {description && (
              <p
                className={clsx(
                  'text-gray-500 mt-0.5',
                  {
                    'text-gray-400': disabled,
                  },
                  descriptionSizeStyles[size],
                  descriptionClassName
                )}
              >
                {description}
              </p>
            )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p
            id={`${checkboxId}-error`}
            className="absolute -bottom-6 left-0 text-sm text-danger-600 flex items-start gap-1"
          >
            <svg
              className="h-4 w-4 mt-0.5 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span>{error}</span>
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;

/**
 * CheckboxGroup Component
 * 
 * A component for managing multiple related checkboxes
 */
export const CheckboxGroup = ({
  label,
  description,
  error,
  required = false,
  children,
  className = '',
  labelClassName = '',
}) => {
  return (
    <div className={clsx('space-y-2', className)}>
      {label && (
        <label
          className={clsx(
            'block text-sm font-medium text-gray-700 mb-2',
            labelClassName
          )}
        >
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}

      {description && (
        <p className="text-sm text-gray-500 mb-3">{description}</p>
      )}

      <div className="space-y-3">{children}</div>

      {error && (
        <p className="mt-2 text-sm text-danger-600 flex items-start gap-1">
          <svg
            className="h-4 w-4 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

CheckboxGroup.displayName = 'CheckboxGroup';

/**
 * Example Usage:
 * 
 * import Checkbox, { CheckboxGroup } from '@/components/common/Checkbox';
 * import { useState } from 'react';
 * 
 * // Basic usage
 * const [accepted, setAccepted] = useState(false);
 * 
 * <Checkbox
 *   label="I accept the terms and conditions"
 *   checked={accepted}
 *   onChange={(e) => setAccepted(e.target.checked)}
 * />
 * 
 * // With description
 * <Checkbox
 *   label="Send me promotional emails"
 *   description="Receive updates about new products and special offers"
 *   checked={newsletter}
 *   onChange={(e) => setNewsletter(e.target.checked)}
 * />
 * 
 * // With error
 * <Checkbox
 *   label="I agree to the privacy policy"
 *   checked={agreedToPrivacy}
 *   onChange={(e) => setAgreedToPrivacy(e.target.checked)}
 *   error="You must accept the privacy policy"
 *   required
 * />
 * 
 * // Disabled
 * <Checkbox
 *   label="This option is disabled"
 *   checked={false}
 *   disabled
 * />
 * 
 * // Different sizes
 * <Checkbox
 *   size="sm"
 *   label="Small checkbox"
 *   checked={small}
 *   onChange={(e) => setSmall(e.target.checked)}
 * />
 * 
 * <Checkbox
 *   size="md"
 *   label="Medium checkbox"
 *   checked={medium}
 *   onChange={(e) => setMedium(e.target.checked)}
 * />
 * 
 * <Checkbox
 *   size="lg"
 *   label="Large checkbox"
 *   checked={large}
 *   onChange={(e) => setLarge(e.target.checked)}
 * />
 * 
 * // CheckboxGroup usage
 * const [permissions, setPermissions] = useState({
 *   read: false,
 *   write: false,
 *   delete: false
 * });
 * 
 * <CheckboxGroup
 *   label="User Permissions"
 *   description="Select the permissions for this user"
 *   required
 * >
 *   <Checkbox
 *     label="Read Access"
 *     description="View products and sales data"
 *     checked={permissions.read}
 *     onChange={(e) => setPermissions({...permissions, read: e.target.checked})}
 *   />
 *   <Checkbox
 *     label="Write Access"
 *     description="Create and edit products"
 *     checked={permissions.write}
 *     onChange={(e) => setPermissions({...permissions, write: e.target.checked})}
 *   />
 *   <Checkbox
 *     label="Delete Access"
 *     description="Remove products from inventory"
 *     checked={permissions.delete}
 *     onChange={(e) => setPermissions({...permissions, delete: e.target.checked})}
 *   />
 * </CheckboxGroup>
 * 
 * // POS specific: Transaction options
 * const [transactionOptions, setTransactionOptions] = useState({
 *   printReceipt: true,
 *   sendEmail: false,
 *   applyDiscount: false
 * });
 * 
 * <div className="space-y-3">
 *   <Checkbox
 *     label="Print Receipt"
 *     description="Print a physical receipt for the customer"
 *     checked={transactionOptions.printReceipt}
 *     onChange={(e) => setTransactionOptions({
 *       ...transactionOptions,
 *       printReceipt: e.target.checked
 *     })}
 *   />
 *   <Checkbox
 *     label="Send Email Receipt"
 *     description="Email a digital copy to the customer"
 *     checked={transactionOptions.sendEmail}
 *     onChange={(e) => setTransactionOptions({
 *       ...transactionOptions,
 *       sendEmail: e.target.checked
 *     })}
 *   />
 *   <Checkbox
 *     label="Apply Member Discount"
 *     description="Automatically apply membership discount"
 *     checked={transactionOptions.applyDiscount}
 *     onChange={(e) => setTransactionOptions({
 *       ...transactionOptions,
 *       applyDiscount: e.target.checked
 *     })}
 *   />
 * </div>
 * 
 * // POS specific: Product features
 * const [features, setFeatures] = useState({
 *   taxable: true,
 *   trackInventory: true,
 *   allowBackorder: false,
 *   featured: false
 * });
 * 
 * <CheckboxGroup
 *   label="Product Settings"
 *   description="Configure product behavior"
 * >
 *   <Checkbox
 *     label="Taxable"
 *     description="Apply tax to this product"
 *     checked={features.taxable}
 *     onChange={(e) => setFeatures({...features, taxable: e.target.checked})}
 *   />
 *   <Checkbox
 *     label="Track Inventory"
 *     description="Monitor stock levels for this product"
 *     checked={features.trackInventory}
 *     onChange={(e) => setFeatures({...features, trackInventory: e.target.checked})}
 *   />
 *   <Checkbox
 *     label="Allow Backorder"
 *     description="Accept orders when out of stock"
 *     checked={features.allowBackorder}
 *     onChange={(e) => setFeatures({...features, allowBackorder: e.target.checked})}
 *   />
 *   <Checkbox
 *     label="Featured Product"
 *     description="Display prominently in store"
 *     checked={features.featured}
 *     onChange={(e) => setFeatures({...features, featured: e.target.checked})}
 *   />
 * </CheckboxGroup>
 * 
 * // Form with validation
 * const [formData, setFormData] = useState({
 *   agreeToTerms: false,
 *   subscribeNewsletter: false
 * });
 * 
 * const [errors, setErrors] = useState({});
 * 
 * const handleSubmit = (e) => {
 *   e.preventDefault();
 *   
 *   const newErrors = {};
 *   if (!formData.agreeToTerms) {
 *     newErrors.agreeToTerms = 'You must accept the terms and conditions';
 *   }
 *   
 *   setErrors(newErrors);
 *   
 *   if (Object.keys(newErrors).length === 0) {
 *     console.log('Form submitted:', formData);
 *   }
 * };
 * 
 * <form onSubmit={handleSubmit} className="space-y-4">
 *   <Checkbox
 *     label="I accept the terms and conditions"
 *     checked={formData.agreeToTerms}
 *     onChange={(e) => setFormData({...formData, agreeToTerms: e.target.checked})}
 *     error={errors.agreeToTerms}
 *     required
 *   />
 *   
 *   <Checkbox
 *     label="Subscribe to newsletter"
 *     description="Get weekly updates about new products"
 *     checked={formData.subscribeNewsletter}
 *     onChange={(e) => setFormData({...formData, subscribeNewsletter: e.target.checked})}
 *   />
 *   
 *   <Button type="submit" variant="primary">Submit</Button>
 * </form>
 * 
 * // Multiple selection list
 * const [selectedProducts, setSelectedProducts] = useState([]);
 * 
 * const products = [
 *   { id: 1, name: 'Product A' },
 *   { id: 2, name: 'Product B' },
 *   { id: 3, name: 'Product C' }
 * ];
 * 
 * const handleProductToggle = (productId) => {
 *   setSelectedProducts(prev =>
 *     prev.includes(productId)
 *       ? prev.filter(id => id !== productId)
 *       : [...prev, productId]
 *   );
 * };
 * 
 * <CheckboxGroup label="Select Products">
 *   {products.map(product => (
 *     <Checkbox
 *       key={product.id}
 *       label={product.name}
 *       checked={selectedProducts.includes(product.id)}
 *       onChange={() => handleProductToggle(product.id)}
 *     />
 *   ))}
 * </CheckboxGroup>
 */