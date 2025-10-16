
// src/components/common/Input.jsx
import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Input Component
 * 
 * A reusable input component with label, error handling, icons, and various types.
 * Uses Tailwind CSS and custom theme variables from index.css
 * 
 * @example
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   error="Invalid email"
 * />
 */

const Input = forwardRef(
  (
    {
      label,
      type = 'text',
      placeholder,
      value,
      onChange,
      onBlur,
      onFocus,
      error,
      helperText,
      disabled = false,
      required = false,
      fullWidth = true,
      leftIcon: LeftIcon = null,
      rightIcon: RightIcon = null,
      onRightIconClick,
      size = 'md',
      className = '',
      inputClassName = '',
      labelClassName = '',
      id,
      name,
      autoComplete,
      maxLength,
      min,
      max,
      step,
      pattern,
      readOnly = false,
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const inputId = id || `input-${name || Math.random().toString(36).substr(2, 9)}`;

    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-5 py-3 text-base',
    };

    // Base input styles
    const baseInputStyles = clsx(
      'block border rounded-lg transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
      'read-only:bg-gray-50 read-only:cursor-default',
      {
        'w-full': fullWidth,
        'pl-10': LeftIcon,
        'pr-10': RightIcon,
      },
      sizeStyles[size]
    );

    // Input state styles
    const inputStateStyles = error
      ? 'input-error focus:ring-danger-500'
      : 'input-field focus:ring-primary-500';

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

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {LeftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <LeftIcon className="h-5 w-5" />
            </div>
          )}

          {/* Input Field */}
          <input
            ref={ref}
            id={inputId}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            onFocus={onFocus}
            placeholder={placeholder}
            disabled={disabled}
            required={required}
            autoComplete={autoComplete}
            maxLength={maxLength}
            min={min}
            max={max}
            step={step}
            pattern={pattern}
            readOnly={readOnly}
            aria-invalid={error ? 'true' : 'false'}
            aria-describedby={
              error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined
            }
            className={clsx(
              baseInputStyles,
              inputStateStyles,
              inputClassName
            )}
            {...props}
          />

          {/* Right Icon */}
          {RightIcon && (
            <div
              className={clsx(
                'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400',
                {
                  'cursor-pointer hover:text-gray-600': onRightIconClick,
                  'pointer-events-none': !onRightIconClick,
                }
              )}
              onClick={onRightIconClick}
              role={onRightIconClick ? 'button' : undefined}
              tabIndex={onRightIconClick ? 0 : undefined}
            >
              <RightIcon className="h-5 w-5" />
            </div>
          )}
        </div>

        {/* Error Message */}
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

        {/* Helper Text */}
        {helperText && !error && (
          <p
            id={`${inputId}-helper`}
            className="mt-1.5 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

/**
 * Example Usage:
 * 
 * import Input from '@/components/common/Input';
 * import { Mail, Lock, Search, Eye, EyeOff } from 'lucide-react';
 * import { useState } from 'react';
 * 
 * // Basic usage
 * <Input
 *   label="Email"
 *   type="email"
 *   placeholder="Enter your email"
 *   value={email}
 *   onChange={(e) => setEmail(e.target.value)}
 * />
 * 
 * // With error
 * <Input
 *   label="Username"
 *   value={username}
 *   onChange={(e) => setUsername(e.target.value)}
 *   error="Username is required"
 *   required
 * />
 * 
 * // With left icon
 * <Input
 *   label="Search Products"
 *   placeholder="Search..."
 *   leftIcon={Search}
 * />
 * 
 * // Password with toggle visibility
 * const [showPassword, setShowPassword] = useState(false);
 * <Input
 *   label="Password"
 *   type={showPassword ? 'text' : 'password'}
 *   leftIcon={Lock}
 *   rightIcon={showPassword ? Eye : EyeOff}
 *   onRightIconClick={() => setShowPassword(!showPassword)}
 * />
 * 
 * // With helper text
 * <Input
 *   label="Phone Number"
 *   type="tel"
 *   helperText="Format: +972-50-123-4567"
 * />
 * 
 * // Disabled
 * <Input
 *   label="Account ID"
 *   value="12345"
 *   disabled
 * />
 * 
 * // Read only
 * <Input
 *   label="Generated Code"
 *   value="ABC-123-XYZ"
 *   readOnly
 * />
 * 
 * // Different sizes
 * <Input size="sm" placeholder="Small" />
 * <Input size="md" placeholder="Medium" />
 * <Input size="lg" placeholder="Large" />
 * 
 * // Number input with min/max
 * <Input
 *   label="Quantity"
 *   type="number"
 *   min="0"
 *   max="100"
 *   step="1"
 * />
 * 
 * // With maxLength
 * <Input
 *   label="SKU"
 *   maxLength={20}
 *   helperText="Maximum 20 characters"
 * />
 */