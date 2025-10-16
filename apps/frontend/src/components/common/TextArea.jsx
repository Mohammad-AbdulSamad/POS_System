// src/components/common/TextArea.jsx
import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * TextArea Component
 * 
 * A reusable textarea component with label, error handling, character count, and auto-resize.
 * Uses Tailwind CSS and custom theme variables from index.css
 * 
 * @example
 * <TextArea
 *   label="Description"
 *   placeholder="Enter product description"
 *   rows={4}
 *   maxLength={500}
 *   showCharCount
 * />
 */

const TextArea = forwardRef(
  (
    {
      label,
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
      rows = 4,
      size = 'md',
      className = '',
      textareaClassName = '',
      labelClassName = '',
      id,
      name,
      autoComplete,
      maxLength,
      minLength,
      readOnly = false,
      showCharCount = false,
      autoResize = false,
      resize = 'vertical', // 'none', 'vertical', 'horizontal', 'both'
      ...props
    },
    ref
  ) => {
    // Generate unique ID if not provided
    const textareaId = id || `textarea-${name || Math.random().toString(36).substr(2, 9)}`;

    // Calculate character count
    const charCount = value ? value.length : 0;
    const isOverLimit = maxLength && charCount > maxLength;

    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-sm',
      lg: 'px-5 py-3 text-base',
    };

    // Resize styles
    const resizeStyles = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    // Base textarea styles
    const baseTextareaStyles = clsx(
      'block border rounded-lg transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-0',
      'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
      'read-only:bg-gray-50 read-only:cursor-default',
      {
        'w-full': fullWidth,
        'resize-none': autoResize, // Disable manual resize if auto-resize is enabled
      },
      !autoResize && resizeStyles[resize],
      sizeStyles[size]
    );

    // Textarea state styles
    const textareaStateStyles = error
      ? 'input-error focus:ring-danger-500'
      : 'input-field focus:ring-primary-500';

    // Handle auto-resize
    const handleChange = (e) => {
      if (autoResize && ref?.current) {
        ref.current.style.height = 'auto';
        ref.current.style.height = `${ref.current.scrollHeight}px`;
      }
      onChange?.(e);
    };

    // Handle initial auto-resize on mount
    const handleRef = (element) => {
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref) {
        ref.current = element;
      }

      if (autoResize && element && value) {
        element.style.height = 'auto';
        element.style.height = `${element.scrollHeight}px`;
      }
    };

    return (
      <div className={clsx('relative', { 'w-full': fullWidth }, className)}>
        {/* Label */}
        {label && (
          <label
            htmlFor={textareaId}
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

        {/* TextArea Field */}
        <textarea
          ref={handleRef}
          id={textareaId}
          name={name}
          value={value}
          onChange={handleChange}
          onBlur={onBlur}
          onFocus={onFocus}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          maxLength={maxLength}
          minLength={minLength}
          rows={autoResize ? 1 : rows}
          readOnly={readOnly}
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={
            error ? `${textareaId}-error` : helperText ? `${textareaId}-helper` : undefined
          }
          className={clsx(
            baseTextareaStyles,
            textareaStateStyles,
            textareaClassName
          )}
          {...props}
        />

        {/* Character Count */}
        {showCharCount && maxLength && (
          <div
            className={clsx(
              'mt-1.5 text-xs text-right',
              {
                'text-danger-600': isOverLimit,
                'text-gray-500': !isOverLimit && charCount < maxLength * 0.9,
                'text-warning-600': !isOverLimit && charCount >= maxLength * 0.9,
              }
            )}
          >
            {charCount} / {maxLength}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <p
            id={`${textareaId}-error`}
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
            id={`${textareaId}-helper`}
            className="mt-1.5 text-sm text-gray-500"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

TextArea.displayName = 'TextArea';

export default TextArea;

/**
 * Example Usage:
 * 
 * import TextArea from '@/components/common/TextArea';
 * import { useState } from 'react';
 * 
 * // Basic usage
 * <TextArea
 *   label="Description"
 *   placeholder="Enter product description"
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 * />
 * 
 * // With error
 * <TextArea
 *   label="Notes"
 *   value={notes}
 *   onChange={(e) => setNotes(e.target.value)}
 *   error="Notes are required"
 *   required
 * />
 * 
 * // With character count and limit
 * <TextArea
 *   label="Product Description"
 *   placeholder="Describe your product..."
 *   value={description}
 *   onChange={(e) => setDescription(e.target.value)}
 *   maxLength={500}
 *   showCharCount
 *   helperText="Write a detailed description for your product"
 * />
 * 
 * // Auto-resize (grows with content)
 * <TextArea
 *   label="Comments"
 *   placeholder="Add your comments..."
 *   value={comments}
 *   onChange={(e) => setComments(e.target.value)}
 *   autoResize
 * />
 * 
 * // With helper text
 * <TextArea
 *   label="Special Instructions"
 *   helperText="Any special handling or storage instructions"
 *   rows={3}
 * />
 * 
 * // Disabled
 * <TextArea
 *   label="System Notes"
 *   value="This is auto-generated"
 *   disabled
 * />
 * 
 * // Read only
 * <TextArea
 *   label="Receipt Details"
 *   value={receiptText}
 *   readOnly
 *   rows={6}
 * />
 * 
 * // Different sizes
 * <TextArea size="sm" placeholder="Small textarea" />
 * <TextArea size="md" placeholder="Medium textarea" />
 * <TextArea size="lg" placeholder="Large textarea" />
 * 
 * // Custom rows
 * <TextArea
 *   label="Short Note"
 *   rows={2}
 *   placeholder="Quick note..."
 * />
 * 
 * <TextArea
 *   label="Long Description"
 *   rows={8}
 *   placeholder="Detailed description..."
 * />
 * 
 * // No resize (fixed size)
 * <TextArea
 *   label="Fixed Size"
 *   resize="none"
 *   rows={4}
 * />
 * 
 * // Horizontal resize only
 * <TextArea
 *   label="Horizontal Resize"
 *   resize="horizontal"
 *   rows={4}
 * />
 * 
 * // Both directions resize
 * <TextArea
 *   label="Free Resize"
 *   resize="both"
 *   rows={4}
 * />
 * 
 * // Full form example
 * const [formData, setFormData] = useState({
 *   name: '',
 *   description: '',
 *   notes: ''
 * });
 * 
 * const [errors, setErrors] = useState({});
 * 
 * <form className="space-y-4">
 *   <Input
 *     label="Product Name"
 *     value={formData.name}
 *     onChange={(e) => setFormData({...formData, name: e.target.value})}
 *     error={errors.name}
 *     required
 *   />
 *   
 *   <TextArea
 *     label="Description"
 *     value={formData.description}
 *     onChange={(e) => setFormData({...formData, description: e.target.value})}
 *     maxLength={1000}
 *     showCharCount
 *     error={errors.description}
 *     required
 *   />
 *   
 *   <TextArea
 *     label="Additional Notes"
 *     value={formData.notes}
 *     onChange={(e) => setFormData({...formData, notes: e.target.value})}
 *     rows={3}
 *     helperText="Optional additional information"
 *   />
 *   
 *   <Button variant="primary" type="submit">Save Product</Button>
 * </form>
 * 
 * // POS specific: Return/Refund reason
 * <TextArea
 *   label="Refund Reason"
 *   placeholder="Please explain why you're returning this item..."
 *   value={refundReason}
 *   onChange={(e) => setRefundReason(e.target.value)}
 *   maxLength={300}
 *   showCharCount
 *   required
 *   rows={3}
 * />
 * 
 * // POS specific: Customer feedback
 * <TextArea
 *   label="Customer Feedback"
 *   placeholder="How was your shopping experience?"
 *   value={feedback}
 *   onChange={(e) => setFeedback(e.target.value)}
 *   autoResize
 *   helperText="Your feedback helps us improve"
 * />
 */