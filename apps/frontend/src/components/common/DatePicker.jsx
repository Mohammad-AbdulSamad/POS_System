// src/components/common/DatePicker.jsx
import { forwardRef, useState } from 'react';
import clsx from 'clsx';
import { Calendar as CalendarIcon, X } from 'lucide-react';

/**
 * DatePicker Component
 * 
 * A reusable date picker input with label, error handling, icons, and optional clear button.
 * Uses native HTML date input for simplicity and cross-browser support.
 * Can be extended later with a custom calendar popover.
 * 
 * @example
 * <DatePicker
 *   label="Start Date"
 *   value={date}
 *   onChange={(e) => setDate(e.target.value)}
 * />
 */

const DatePicker = forwardRef(
  (
    {
      label,
      value,
      onChange,
      onBlur,
      onFocus,
      error,
      helperText,
      disabled = false,
      required = false,
      fullWidth = true,
      placeholder = '',
      clearable = false,
      size = 'md',
      variant = 'outline',
      min,
      max,
      name,
      id,
      className = '',
      inputClassName = '',
      labelClassName = '',
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    // Unique ID for label association
    const inputId = id || `date-picker-${name || Math.random().toString(36).substr(2, 9)}`;

    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2.5 text-sm rounded-lg',
      lg: 'px-5 py-3 text-base rounded-lg',
    };

    // Variant styles
    const variantStyles = {
      outline:
        'border border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:ring-2 focus:ring-primary-500',
      filled:
        'bg-gray-100 border border-transparent text-gray-900 hover:bg-gray-200 focus:ring-2 focus:ring-primary-500',
      ghost:
        'bg-transparent border-none text-gray-900 hover:bg-gray-100 focus:ring-2 focus:ring-primary-500',
    };

    const handleClear = () => {
      if (onChange) {
        const syntheticEvent = { target: { value: '' } };
        onChange(syntheticEvent);
      }
    };

    return (
      <div className={clsx('relative', { 'w-full': fullWidth }, className)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className={clsx(
              'block text-sm font-medium text-gray-700 mb-1.5',
              { 'text-gray-400': disabled },
              labelClassName
            )}
          >
            {label}
            {required && <span className="text-danger-500 ml-1">*</span>}
          </label>
        )}

        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
            <CalendarIcon className="h-5 w-5" />
          </div>

          {/* Date input field */}
          <input
            ref={ref}
            id={inputId}
            type="date"
            name={name}
            value={value || ''}
            onChange={onChange}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            min={min}
            max={max}
            disabled={disabled}
            required={required}
            placeholder={placeholder}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            className={clsx(
              'block w-full pl-10 pr-10 transition-all duration-200 focus:outline-none',
              'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
              sizeStyles[size],
              variantStyles[variant],
              {
                'ring-2 ring-primary-500 border-primary-500': isFocused && !error,
                'ring-2 ring-danger-500 border-danger-500': error,
              },
              inputClassName
            )}
            {...props}
          />

          {/* Clear button */}
          {clearable && value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear date"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="mt-1.5 text-sm text-danger-600 flex items-start gap-1"
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

        {/* Helper text */}
        {helperText && !error && (
          <p id={`${inputId}-helper`} className="mt-1.5 text-sm text-gray-500">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;

/**
 * Example Usage:
 * 
 * import DatePicker from '@/components/common/DatePicker';
 * import { useState } from 'react';
 * 
 * // Basic usage
 * const [date, setDate] = useState('');
 * 
 * <DatePicker
 *   label="Order Date"
 *   value={date}
 *   onChange={(e) => setDate(e.target.value)}
 * />
 * 
 * // With clear button
 * <DatePicker
 *   label="Delivery Date"
 *   value={deliveryDate}
 *   onChange={(e) => setDeliveryDate(e.target.value)}
 *   clearable
 * />
 * 
 * // With error
 * <DatePicker
 *   label="Invoice Date"
 *   value={invoiceDate}
 *   onChange={(e) => setInvoiceDate(e.target.value)}
 *   error="Date is required"
 * />
 * 
 * // Disabled
 * <DatePicker
 *   label="Date"
 *   value="2025-01-01"
 *   disabled
 * />
 * 
 * // With helper text
 * <DatePicker
 *   label="Start Date"
 *   helperText="Please select a valid date range."
 *   value={startDate}
 *   onChange={(e) => setStartDate(e.target.value)}
 * />
 * 
 * // Min/Max dates
 * <DatePicker
 *   label="Appointment Date"
 *   min="2025-01-01"
 *   max="2025-12-31"
 *   value={appointmentDate}
 *   onChange={(e) => setAppointmentDate(e.target.value)}
 * />
 * 
 * // Different sizes
 * <DatePicker size="sm" label="Small" value={date} onChange={(e) => setDate(e.target.value)} />
 * <DatePicker size="md" label="Medium" value={date} onChange={(e) => setDate(e.target.value)} />
 * <DatePicker size="lg" label="Large" value={date} onChange={(e) => setDate(e.target.value)} />
 * 
 * // POS specific: Filter orders by date
 * <Card>
 *   <CardHeader title="Filter Orders" />
 *   <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
 *     <DatePicker
 *       label="From"
 *       value={startDate}
 *       onChange={(e) => setStartDate(e.target.value)}
 *     />
 *     <DatePicker
 *       label="To"
 *       value={endDate}
 *       onChange={(e) => setEndDate(e.target.value)}
 *     />
 *   </CardBody>
 * </Card>
 */
