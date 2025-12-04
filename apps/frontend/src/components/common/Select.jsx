// src/components/common/Select.jsx
import { forwardRef, useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { X, ChevronDown } from 'lucide-react';

/**
 * Select Component
 * 
 * A reusable select dropdown component with label, error handling, icons, and custom styling.
 * Uses Tailwind CSS and custom theme variables from index.css
 * 
 * @example
 * <Select
 *   label="Category"
 *   options={[
 *     { value: '1', label: 'Electronics' },
 *     { value: '2', label: 'Clothing' }
 *   ]}
 *   value={selectedCategory}
 *   onChange={(e) => setSelectedCategory(e.target.value)}
 * />
 */

const Select = forwardRef(
  (
    {
      label,
      options = [],
      value,
      onChange,
      onBlur,
      onFocus,
      error,
      helperText,
      disabled = false,
      required = false,
      fullWidth = true,
      placeholder = 'Select an option...',
      leftIcon: LeftIcon = null,
      size = 'md',
      className = '',
      selectClassName = '',
      labelClassName = '',
      id,
      name,
      multiple = false,
      ...props
    },
    ref
  ) => {
    console.log('🟢 Select render:', { value, multiple, options: options.length });
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const selectId = id || `select-${name || Math.random().toString(36).substr(2, 9)}`;

    // Close dropdown when clicking outside
    useEffect(() => {
      const handleClickOutside = (e) => {
        if (containerRef.current && !containerRef.current.contains(e.target)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
      }
    }, [isOpen]);

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-5 py-3 text-base',
    };

    // For multiple select: convert value to array
    const selectedValues = multiple
      ? Array.isArray(value)
        ? value
        : value ? [value] : []
      : [];

    // Get selected labels
    const getSelectedLabels = () => {
      return selectedValues
        .map((v) => {
          const opt = options.find((o) => (typeof o === 'object' ? o.value : o) === v);
          return typeof opt === 'object' ? opt.label : opt;
        })
        .filter(Boolean);
    };

// Handle option click
const handleOptionClick = (optionValue) => {
  console.log('🔵 Click:', { optionValue, selectedValues, multiple });
  
  if (!multiple) {
    onChange?.({ target: { value: optionValue, name } });
    setIsOpen(false);
  } else {
    const isCurrentlySelected = selectedValues.some(v => String(v) === String(optionValue));
    console.log('🔵 isCurrentlySelected:', isCurrentlySelected);
    
    const newValues = isCurrentlySelected
      ? selectedValues.filter((v) => String(v) !== String(optionValue))
      : [...selectedValues, optionValue];
    
    console.log('🔵 newValues:', newValues);
    onChange?.({ target: { value: newValues, name } });
  }
};
    // Handle remove tag (multiple only)
    const handleRemoveTag = (e, optionValue) => {
      e.stopPropagation();
      // ✅ Remove by value, not index
      const newValues = selectedValues.filter((v) => String(v) === String(optionValue) ? false : true);
      onChange?.({ target: { value: newValues, name } });
    };

    // ✅ Fix selectedLabels mapping to match correct index
    const selectedLabels = getSelectedLabels();
    const selectedLabelMap = selectedValues.reduce((acc, val, idx) => {
      acc[val] = selectedLabels[idx];
      return acc;
    }, {});

    // ✅ Single select: use native select
    if (!multiple) {
      const baseSelectStyles = clsx(
        'block border rounded-lg transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-offset-0',
        'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
        'appearance-none bg-white',
        'cursor-pointer',
        {
          'w-full': fullWidth,
          'pl-10': LeftIcon,
          'pr-10': true,
        },
        sizeStyles[size]
      );

      const selectStateStyles = error
        ? 'input-error focus:ring-danger-500'
        : 'input-field focus:ring-primary-500';

      return (
        <div className={clsx('relative', { 'w-full': fullWidth }, className)}>
          {label && (
            <label htmlFor={selectId} className={clsx('block text-sm font-medium text-gray-700 mb-1.5', labelClassName)}>
              {label}
              {required && <span className="text-danger-500 ml-1">*</span>}
            </label>
          )}

          <div className="relative">
            {LeftIcon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                <LeftIcon className="h-5 w-5" />
              </div>
            )}

            <select
              ref={ref}
              id={selectId}
              name={name}
              value={value}
              onChange={onChange}
              onBlur={onBlur}
              onFocus={onFocus}
              disabled={disabled}
              required={required}
              aria-invalid={error ? 'true' : 'false'}
              className={clsx(baseSelectStyles, selectStateStyles, selectClassName)}
              {...props}
            >
              {placeholder && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((option, index) => {
                const optionValue = typeof option === 'object' ? option.value : option;
                const optionLabel = typeof option === 'object' ? option.label : option;
                const optionDisabled = typeof option === 'object' ? option.disabled : false;

                return (
                  <option key={`${optionValue}-${index}`} value={optionValue} disabled={optionDisabled}>
                    {optionLabel}
                  </option>
                );
              })}
            </select>

            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <ChevronDown className="h-5 w-5" />
            </div>
          </div>

          {error && (
            <p id={`${selectId}-error`} className="mt-1.5 text-sm text-danger-600 flex items-start gap-1">
              <span>{error}</span>
            </p>
          )}
          {helperText && !error && <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>}
        </div>
      );
    }

    // ✅ Multiple select: custom dropdown
    // const selectedLabels = getSelectedLabels();
    // const selectedLabelMap = selectedValues.reduce((acc, val, idx) => {
    //   acc[val] = selectedLabels[idx];
    //   return acc;
    // }, {});

    return (
      <div ref={containerRef} className={clsx('relative', { 'w-full': fullWidth }, className)}>
        {label && (
          <label className={clsx('block text-sm font-medium text-gray-700 mb-1.5', labelClassName)}>
            {label}
            {required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}

        {/* Multi-select trigger button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={disabled}
          className={clsx(
            'w-full text-left border rounded-lg transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-offset-0',
            'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
            'flex items-center justify-between gap-2',
            sizeStyles[size],
            error ? 'input-error focus:ring-danger-500' : 'input-field focus:ring-primary-500',
            selectClassName
          )}
        >
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {LeftIcon && <LeftIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />}
            {selectedLabels.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {selectedValues.map((val, i) => (
                  <span
                    key={`${val}-${i}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary-100 text-primary-700 rounded text-xs font-medium"
                  >
                    {selectedLabelMap[val] || val}
                    <button
                      type="button"
                      onClick={(e) => handleRemoveTag(e, val)}
                      className="hover:text-primary-900"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-500">{placeholder}</span>
            )}
          </div>
          <ChevronDown
            className={clsx('h-5 w-5 text-gray-400 flex-shrink-0 transition-transform', {
              'rotate-180': isOpen,
            })}
          />
        </button>

        {/* Dropdown menu */}
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
            <div className="max-h-64 overflow-y-auto">
              {options.map((option, index) => {
                const optionValue = typeof option === 'object' ? option.value : option;
                const optionLabel = typeof option === 'object' ? option.label : option;
                const optionDisabled = typeof option === 'object' ? option.disabled : false;
                // ✅ FIX: Add type-safe comparison in the isSelected check
                const isSelected = selectedValues.some(v => String(v) === String(optionValue));

                return (
                  <button
                    key={`${optionValue}-${index}`}
                    type="button"
                    onClick={() => handleOptionClick(optionValue)}
                    disabled={optionDisabled}
                    className={clsx(
                      'w-full text-left px-4 py-2.5 hover:bg-primary-50 transition-colors',
                      'flex items-center gap-3',
                      'disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-white',
                      {
                        'bg-primary-50 text-primary-700 font-medium': isSelected,
                      }
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                    />
                    <span>{optionLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {error && (
          <p id={`${selectId}-error`} className="mt-1.5 text-sm text-danger-600 flex items-start gap-1">
            <span>{error}</span>
          </p>
        )}
        {helperText && !error && <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;

/**
 * Example Usage:
 * 
 * import Select from '@/components/common/Select';
 * import { Package, Tag, Users } from 'lucide-react';
 * import { useState } from 'react';
 * 
 * // Basic usage with object options
 * const [category, setCategory] = useState('');
 * 
 * <Select
 *   label="Product Category"
 *   options={[
 *     { value: '1', label: 'Electronics' },
 *     { value: '2', label: 'Clothing' },
 *     { value: '3', label: 'Food & Beverages' },
 *     { value: '4', label: 'Home & Garden' }
 *   ]}
 *   value={category}
 *   onChange={(e) => setCategory(e.target.value)}
 *   placeholder="Choose a category"
 * />
 * 
 * // With error
 * <Select
 *   label="Payment Method"
 *   options={[
 *     { value: 'cash', label: 'Cash' },
 *     { value: 'card', label: 'Credit/Debit Card' },
 *     { value: 'mobile', label: 'Mobile Payment' }
 *   ]}
 *   value={paymentMethod}
 *   onChange={(e) => setPaymentMethod(e.target.value)}
 *   error="Payment method is required"
 *   required
 * />
 * 
 * // With left icon
 * <Select
 *   label="Product Type"
 *   leftIcon={Package}
 *   options={[
 *     { value: 'physical', label: 'Physical Product' },
 *     { value: 'digital', label: 'Digital Product' },
 *     { value: 'service', label: 'Service' }
 *   ]}
 *   value={productType}
 *   onChange={(e) => setProductType(e.target.value)}
 * />
 * 
 * // Simple string array options
 * <Select
 *   label="Size"
 *   options={['Small', 'Medium', 'Large', 'Extra Large']}
 *   value={size}
 *   onChange={(e) => setSize(e.target.value)}
 * />
 * 
 * // With helper text
 * <Select
 *   label="Tax Rate"
 *   options={[
 *     { value: '0', label: 'No Tax (0%)' },
 *     { value: '5', label: 'Standard (5%)' },
 *     { value: '10', label: 'Premium (10%)' },
 *     { value: '15', label: 'Luxury (15%)' }
 *   ]}
 *   value={taxRate}
 *   onChange={(e) => setTaxRate(e.target.value)}
 *   helperText="Select the applicable tax rate for this product"
 * />
 * 
 * // Disabled
 * <Select
 *   label="Store Location"
 *   options={[
 *     { value: '1', label: 'Main Store' }
 *   ]}
 *   value="1"
 *   disabled
 * />
 * 
 * // Different sizes
 * <Select
 *   size="sm"
 *   options={['Option 1', 'Option 2']}
 *   placeholder="Small select"
 * />
 * 
 * <Select
 *   size="md"
 *   options={['Option 1', 'Option 2']}
 *   placeholder="Medium select"
 * />
 * 
 * <Select
 *   size="lg"
 *   options={['Option 1', 'Option 2']}
 *   placeholder="Large select"
 * />
 * 
 * // Multiple select
 * <Select
 *   label="Tags"
 *   multiple
 *   options={[
 *     { value: 'new', label: 'New Arrival' },
 *     { value: 'sale', label: 'On Sale' },
 *     { value: 'featured', label: 'Featured' },
 *     { value: 'trending', label: 'Trending' }
 *   ]}
 *   value={selectedTags}
 *   onChange={(e) => {
 *     const values = Array.from(e.target.selectedOptions, option => option.value);
 *     setSelectedTags(values);
 *   }}
 * />
 * 
 * // With disabled options
 * <Select
 *   label="Supplier"
 *   options={[
 *     { value: '1', label: 'Supplier A' },
 *     { value: '2', label: 'Supplier B (Out of Stock)', disabled: true },
 *     { value: '3', label: 'Supplier C' },
 *     { value: '4', label: 'Supplier D (Unavailable)', disabled: true }
 *   ]}
 *   value={supplier}
 *   onChange={(e) => setSupplier(e.target.value)}
 * />
 * 
 * // POS specific: Payment method selector
 * <Select
 *   label="Payment Method"
 *   leftIcon={Tag}
 *   options={[
 *     { value: 'cash', label: 'Cash' },
 *     { value: 'credit_card', label: 'Credit Card' },
 *     { value: 'debit_card', label: 'Debit Card' },
 *     { value: 'mobile_payment', label: 'Mobile Payment' },
 *     { value: 'check', label: 'Check' }
 *   ]}
 *   value={paymentMethod}
 *   onChange={(e) => setPaymentMethod(e.target.value)}
 *   required
 * />
 * 
 * // POS specific: Customer selector
 * const customers = [
 *   { value: '1', label: 'Walk-in Customer' },
 *   { value: '2', label: 'John Doe' },
 *   { value: '3', label: 'Jane Smith' },
 *   { value: '4', label: 'Bob Johnson' }
 * ];
 * 
 * <Select
 *   label="Customer"
 *   leftIcon={Users}
 *   options={customers}
 *   value={selectedCustomer}
 *   onChange={(e) => setSelectedCustomer(e.target.value)}
 *   placeholder="Select a customer"
 * />
 * 
 * // POS specific: Discount type
 * <Select
 *   label="Discount Type"
 *   options={[
 *     { value: 'none', label: 'No Discount' },
 *     { value: 'percentage', label: 'Percentage (%)' },
 *     { value: 'fixed', label: 'Fixed Amount' }
 *   ]}
 *   value={discountType}
 *   onChange={(e) => setDiscountType(e.target.value)}
 * />
 * 
 * // Complete form example with validation
 * const [formData, setFormData] = useState({
 *   category: '',
 *   supplier: '',
 *   taxRate: '',
 *   status: ''
 * });
 * 
 * const [errors, setErrors] = useState({});
 * 
 * const handleSubmit = (e) => {
 *   e.preventDefault();
 *   
 *   const newErrors = {};
 *   if (!formData.category) newErrors.category = 'Category is required';
 *   if (!formData.supplier) newErrors.supplier = 'Supplier is required';
 *   
 *   setErrors(newErrors);
 *   
 *   if (Object.keys(newErrors).length === 0) {
 *     console.log('Form submitted:', formData);
 *   }
 * };
 * 
 * <form onSubmit={handleSubmit} className="space-y-4">
 *   <Select
 *     label="Category"
 *     options={categories}
 *     value={formData.category}
 *     onChange={(e) => setFormData({...formData, category: e.target.value})}
 *     error={errors.category}
 *     required
 *   />
 *   
 *   <Select
 *     label="Supplier"
 *     options={suppliers}
 *     value={formData.supplier}
 *     onChange={(e) => setFormData({...formData, supplier: e.target.value})}
 *     error={errors.supplier}
 *     required
 *   />
 *   
 *   <Select
 *     label="Status"
 *     options={[
 *       { value: 'active', label: 'Active' },
 *       { value: 'inactive', label: 'Inactive' },
 *       { value: 'out_of_stock', label: 'Out of Stock' }
 *     ]}
 *     value={formData.status}
 *     onChange={(e) => setFormData({...formData, status: e.target.value})}
 *   />
 *   
 *   <Button type="submit" variant="primary">Save Product</Button>
 * </form>
 */