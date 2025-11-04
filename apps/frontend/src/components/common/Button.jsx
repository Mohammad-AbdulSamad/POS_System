// src/components/common/Button.jsx
import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Button Component
 * 
 * A reusable button component with multiple variants, sizes, and states.
 * Uses Tailwind CSS and custom theme variables from index.css
 * 
 * @example
 * <Button variant="primary" size="md" onClick={handleClick}>
 *   Click Me
 * </Button>
 */

const Button = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      type = 'button',
      disabled = false,
      loading = false,
      fullWidth = false,
      icon: Icon = null,
      iconPosition = 'left',
      className = '',
      onClick,
      ...props
    },
    ref
  ) => {
    // Base button styles
    const baseStyles = clsx(
      'inline-flex items-center justify-center',
      'font-medium transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      {
        'cursor-wait': loading,
        'w-full': fullWidth,
      }
    );

    // Variant styles: use only CSS class names defined in index.css
    const variantStyles = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      success: 'btn-success',
      danger: 'btn-danger',
      warning: 'btn-warning',   // add .btn-warning in CSS
      outline: `btn-outline`,
      ghost: 'btn-ghost',       // add .btn-ghost in CSS
      link: 'btn-link'          // add .btn-link in CSS
    };

    // Size styles
    const sizeStyles = {
      xs: 'px-2.5 py-1.5 text-xs rounded-md',
      sm: 'px-3 py-2 text-sm rounded-md',
      md: 'px-4 py-2.5 text-sm rounded-lg',
      lg: 'px-6 py-3 text-base rounded-lg',
      xl: 'px-8 py-4 text-lg rounded-xl',
    };

    // Icon spacing based on size
    const iconSpacing = {
      xs: 'gap-1',
      sm: 'gap-1.5',
      md: 'gap-2',
      lg: 'gap-2.5',
      xl: 'gap-3',
    };

    // Loading spinner component
    const Spinner = () => (
      <svg
        className={clsx('animate-spin', {
          'h-3 w-3': size === 'xs',
          'h-4 w-4': size === 'sm' || size === 'md',
          'h-5 w-5': size === 'lg',
          'h-6 w-6': size === 'xl',
        })}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        onClick={onClick}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          Icon && iconSpacing[size],
          className
        )}
        {...props}
      >
        {loading && <Spinner />}
        
        {!loading && Icon && iconPosition === 'left' && (
          <Icon
            className={clsx({
              'h-3 w-3': size === 'xs',
              'h-4 w-4': size === 'sm' || size === 'md',
              'h-5 w-5': size === 'lg',
              'h-6 w-6': size === 'xl',
            })}
          />
        )}

        {children}

        {!loading && Icon && iconPosition === 'right' && (
          <Icon
            className={clsx({
              'h-3 w-3': size === 'xs',
              'h-4 w-4': size === 'sm' || size === 'md',
              'h-5 w-5': size === 'lg',
              'h-6 w-6': size === 'xl',
            })}
          />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;

/**
 * Example Usage:
 * 
 * import Button from '@/components/common/Button';
 * import { Plus, Trash2, Edit } from 'lucide-react';
 * 
 * // Basic usage
 * <Button variant="primary" onClick={handleSave}>Save</Button>
 * 
 * // With icon
 * <Button variant="success" icon={Plus} iconPosition="left">
 *   Add Product
 * </Button>
 * 
 * // Loading state
 * <Button variant="primary" loading={isLoading}>
 *   Submitting...
 * </Button>
 * 
 * // Disabled
 * <Button variant="danger" disabled>
 *   Delete
 * </Button>
 * 
 * // Different sizes
 * <Button size="xs">Extra Small</Button>
 * <Button size="sm">Small</Button>
 * <Button size="md">Medium</Button>
 * <Button size="lg">Large</Button>
 * <Button size="xl">Extra Large</Button>
 * 
 * // Full width
 * <Button fullWidth variant="primary">
 *   Full Width Button
 * </Button>
 * 
 * // With custom className
 * <Button className="shadow-lg" variant="primary">
 *   Custom Styled
 * </Button>
 */