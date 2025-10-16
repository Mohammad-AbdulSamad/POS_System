// src/components/common/Radio.jsx
import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Radio Component
 * 
 * A reusable radio button component with label, description, and group support.
 * Uses Tailwind CSS and custom theme variables from index.css
 * 
 * @example
 * <Radio
 *   label="Option 1"
 *   value="option1"
 *   checked={selected === 'option1'}
 *   onChange={(e) => setSelected(e.target.value)}
 * />
 */

const Radio = forwardRef(
  (
    {
      label,
      description,
      value,
      checked = false,
      onChange,
      disabled = false,
      required = false,
      name,
      id,
      size = 'md',
      className = '',
      labelClassName = '',
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const radioId = id || `radio-${name}-${value || Math.random().toString(36).substr(2, 9)}`;

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

    return (
      <div className={clsx('relative flex items-start', className)}>
        <div className="flex items-center h-6">
          <input
            ref={ref}
            id={radioId}
            name={name}
            type="radio"
            value={value}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            required={required}
            className={clsx(
              'border-gray-300 focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
              'text-primary-600 transition-colors duration-200',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'cursor-pointer',
              sizeStyles[size]
            )}
            {...props}
          />
        </div>
        {(label || description) && (
          <div className="ml-3 flex-1">
            {label && (
              <label
                htmlFor={radioId}
                className={clsx(
                  'font-medium text-gray-900 cursor-pointer',
                  {
                    'text-gray-400 cursor-not-allowed': disabled,
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
                  'text-gray-500',
                  {
                    'text-gray-400': disabled,
                    'mt-0.5': label,
                  },
                  descriptionSizeStyles[size]
                )}
              >
                {description}
              </p>
            )}
          </div>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

/**
 * RadioGroup Component
 * 
 * A wrapper component to manage a group of radio buttons
 * 
 * @example
 * <RadioGroup
 *   label="Select Payment Method"
 *   value={paymentMethod}
 *   onChange={setPaymentMethod}
 *   options={[
 *     { value: 'cash', label: 'Cash' },
 *     { value: 'card', label: 'Credit Card' }
 *   ]}
 * />
 */
export const RadioGroup = ({
  label,
  name,
  value,
  onChange,
  options = [],
  error,
  helperText,
  required = false,
  disabled = false,
  orientation = 'vertical',
  size = 'md',
  className = '',
  groupClassName = '',
}) => {
  const groupId = name || `radio-group-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <fieldset className={clsx('space-y-2', className)}>
      {label && (
        <legend className="block text-sm font-medium text-gray-900 mb-3">
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </legend>
      )}

      <div
        className={clsx(
          {
            'flex flex-col space-y-3': orientation === 'vertical',
            'flex flex-wrap gap-4': orientation === 'horizontal',
          },
          groupClassName
        )}
      >
        {options.map((option) => (
          <Radio
            key={option.value}
            name={groupId}
            value={option.value}
            label={option.label}
            description={option.description}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled || option.disabled}
            size={size}
          />
        ))}
      </div>

      {/* Error Message */}
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

      {/* Helper Text */}
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}
    </fieldset>
  );
};

RadioGroup.displayName = 'RadioGroup';

export default Radio;

/**
 * Example Usage:
 * 
 * import Radio, { RadioGroup } from '@/components/common/Radio';
 * import { useState } from 'react';
 * 
 * // Basic Radio Button
 * const [selected, setSelected] = useState('option1');
 * 
 * <Radio
 *   label="Option 1"
 *   value="option1"
 *   checked={selected === 'option1'}
 *   onChange={(e) => setSelected(e.target.value)}
 *   name="options"
 * />
 * <Radio
 *   label="Option 2"
 *   value="option2"
 *   checked={selected === 'option2'}
 *   onChange={(e) => setSelected(e.target.value)}
 *   name="options"
 * />
 * 
 * // Radio with Description
 * <Radio
 *   label="Premium Plan"
 *   description="Access to all features"
 *   value="premium"
 *   checked={plan === 'premium'}
 *   onChange={(e) => setPlan(e.target.value)}
 * />
 * 
 * // RadioGroup - Vertical (Payment Methods)
 * const [paymentMethod, setPaymentMethod] = useState('cash');
 * 
 * <RadioGroup
 *   label="Select Payment Method"
 *   name="payment"
 *   value={paymentMethod}
 *   onChange={setPaymentMethod}
 *   options={[
 *     { 
 *       value: 'cash', 
 *       label: 'Cash',
 *       description: 'Pay with physical money'
 *     },
 *     { 
 *       value: 'card', 
 *       label: 'Credit/Debit Card',
 *       description: 'Pay with card'
 *     },
 *     { 
 *       value: 'mobile', 
 *       label: 'Mobile Payment',
 *       description: 'Pay with mobile app'
 *     },
 *   ]}
 * />
 * 
 * // RadioGroup - Horizontal
 * const [size, setSize] = useState('medium');
 * 
 * <RadioGroup
 *   label="Product Size"
 *   name="size"
 *   value={size}
 *   onChange={setSize}
 *   orientation="horizontal"
 *   options={[
 *     { value: 'small', label: 'Small' },
 *     { value: 'medium', label: 'Medium' },
 *     { value: 'large', label: 'Large' },
 *   ]}
 * />
 * 
 * // RadioGroup with Error
 * <RadioGroup
 *   label="Shipping Method"
 *   value={shipping}
 *   onChange={setShipping}
 *   error="Please select a shipping method"
 *   required
 *   options={[
 *     { value: 'standard', label: 'Standard Delivery' },
 *     { value: 'express', label: 'Express Delivery' },
 *   ]}
 * />
 * 
 * // RadioGroup with Helper Text
 * <RadioGroup
 *   label="Stock Movement Reason"
 *   value={reason}
 *   onChange={setReason}
 *   helperText="Select the reason for stock adjustment"
 *   options={[
 *     { value: 'sale', label: 'Sale' },
 *     { value: 'damage', label: 'Damage/Spoilage' },
 *     { value: 'return', label: 'Customer Return' },
 *   ]}
 * />
 * 
 * // Different Sizes
 * <Radio label="Small" size="sm" />
 * <Radio label="Medium" size="md" />
 * <Radio label="Large" size="lg" />
 * 
 * // Disabled Radio
 * <Radio
 *   label="Unavailable Option"
 *   value="unavailable"
 *   disabled
 * />
 * 
 * // RadioGroup with some disabled options
 * <RadioGroup
 *   label="Loyalty Tier"
 *   value={tier}
 *   onChange={setTier}
 *   options={[
 *     { value: 'bronze', label: 'Bronze', description: 'Starting tier' },
 *     { value: 'silver', label: 'Silver', description: 'Requires 500 points' },
 *     { value: 'gold', label: 'Gold', description: 'Requires 1500 points', disabled: true },
 *     { value: 'platinum', label: 'Platinum', description: 'Requires 3000 points', disabled: true },
 *   ]}
 * />
 */