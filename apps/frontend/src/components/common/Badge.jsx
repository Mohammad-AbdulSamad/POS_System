// src/components/common/Badge.jsx
import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Badge Component
 * 
 * A reusable badge component for labels, status indicators, and tags.
 * Uses Tailwind CSS and custom theme variables from index.css
 * 
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning" icon={AlertTriangle}>Low Stock</Badge>
 */

const Badge = forwardRef(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      icon: Icon = null,
      iconPosition = 'left',
      rounded = true,
      dot = false,
      removable = false,
      onRemove,
      className = '',
      ...props
    },
    ref
  ) => {
    // Base badge styles
    const baseStyles = clsx(
      'inline-flex items-center justify-center',
      'font-medium transition-all duration-200',
      'whitespace-nowrap',
      {
        'rounded-full': rounded,
        'rounded-md': !rounded,
      }
    );

    // Variant styles - uses CSS classes from index.css
    const variantStyles = {
      primary: 'badge-primary',
      secondary: 'badge-secondary',
      success: 'badge-success',
      warning: 'badge-warning',
      danger: 'badge-danger',
      info: 'badge-info',
      gray: 'badge-gray',
      dark: 'badge-dark',
    };

    // Size styles
    const sizeStyles = {
      xs: 'px-2 py-0.5 text-xs',
      sm: 'px-2.5 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-3.5 py-1.5 text-sm',
      xl: 'px-4 py-2 text-base',
    };

    // Icon size based on badge size
    const iconSize = {
      xs: 'h-2.5 w-2.5',
      sm: 'h-3 w-3',
      md: 'h-3.5 w-3.5',
      lg: 'h-4 w-4',
      xl: 'h-5 w-5',
    };

    // Gap between elements
    const gapStyles = {
      xs: 'gap-1',
      sm: 'gap-1',
      md: 'gap-1.5',
      lg: 'gap-1.5',
      xl: 'gap-2',
    };

    // Dot indicator
    const DotIndicator = () => (
      <span
        className={clsx('rounded-full', {
          'h-1.5 w-1.5': size === 'xs' || size === 'sm',
          'h-2 w-2': size === 'md' || size === 'lg',
          'h-2.5 w-2.5': size === 'xl',
          'bg-current': true,
        })}
      />
    );

    // Remove button
    const RemoveButton = () => (
      <button
        type="button"
        onClick={onRemove}
        className="ml-0.5 hover:bg-black hover:bg-opacity-10 rounded-full p-0.5 transition-colors"
        aria-label="Remove"
      >
        <svg
          className={iconSize[size]}
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
    );

    return (
      <span
        ref={ref}
        className={clsx(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          (Icon || dot || removable) && gapStyles[size],
          className
        )}
        {...props}
      >
        {dot && iconPosition === 'left' && <DotIndicator />}
        
        {Icon && iconPosition === 'left' && (
          <Icon className={iconSize[size]} />
        )}

        {children}

        {Icon && iconPosition === 'right' && (
          <Icon className={iconSize[size]} />
        )}

        {dot && iconPosition === 'right' && <DotIndicator />}

        {removable && <RemoveButton />}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;

/**
 * Example Usage:
 * 
 * import Badge from '@/components/common/Badge';
 * import { 
 *   CheckCircle, 
 *   AlertTriangle, 
 *   XCircle, 
 *   Clock,
 *   Package,
 *   TrendingUp 
 * } from 'lucide-react';
 * 
 * // Basic usage
 * <Badge variant="success">Active</Badge>
 * <Badge variant="warning">Pending</Badge>
 * <Badge variant="danger">Out of Stock</Badge>
 * 
 * // With icons
 * <Badge variant="success" icon={CheckCircle}>
 *   Completed
 * </Badge>
 * 
 * <Badge variant="warning" icon={AlertTriangle}>
 *   Low Stock
 * </Badge>
 * 
 * <Badge variant="danger" icon={XCircle}>
 *   Failed
 * </Badge>
 * 
 * // Different sizes
 * <Badge size="xs" variant="primary">Extra Small</Badge>
 * <Badge size="sm" variant="primary">Small</Badge>
 * <Badge size="md" variant="primary">Medium</Badge>
 * <Badge size="lg" variant="primary">Large</Badge>
 * <Badge size="xl" variant="primary">Extra Large</Badge>
 * 
 * // With dot indicator
 * <Badge variant="success" dot>Online</Badge>
 * <Badge variant="warning" dot>Away</Badge>
 * <Badge variant="danger" dot>Offline</Badge>
 * 
 * // Icon on right
 * <Badge variant="info" icon={Clock} iconPosition="right">
 *   Scheduled
 * </Badge>
 * 
 * // Removable badges (for tags)
 * const [tags, setTags] = useState(['Electronics', 'New Arrival', 'Featured']);
 * 
 * {tags.map((tag, index) => (
 *   <Badge
 *     key={index}
 *     variant="primary"
 *     removable
 *     onRemove={() => setTags(tags.filter((_, i) => i !== index))}
 *   >
 *     {tag}
 *   </Badge>
 * ))}
 * 
 * // Not rounded (square corners)
 * <Badge variant="success" rounded={false}>
 *   Square Badge
 * </Badge>
 * 
 * // All variants showcase
 * <div className="flex flex-wrap gap-2">
 *   <Badge variant="primary">Primary</Badge>
 *   <Badge variant="secondary">Secondary</Badge>
 *   <Badge variant="success">Success</Badge>
 *   <Badge variant="warning">Warning</Badge>
 *   <Badge variant="danger">Danger</Badge>
 *   <Badge variant="info">Info</Badge>
 *   <Badge variant="gray">Gray</Badge>
 *   <Badge variant="dark">Dark</Badge>
 * </div>
 * 
 * // POS specific: Order status
 * <Badge variant="success" icon={CheckCircle}>
 *   Completed
 * </Badge>
 * 
 * <Badge variant="warning" icon={Clock}>
 *   Processing
 * </Badge>
 * 
 * <Badge variant="danger" icon={XCircle}>
 *   Cancelled
 * </Badge>
 * 
 * <Badge variant="info" icon={Package}>
 *   Shipped
 * </Badge>
 * 
 * // POS specific: Stock status
 * const getStockBadge = (quantity) => {
 *   if (quantity === 0) {
 *     return <Badge variant="danger" icon={XCircle}>Out of Stock</Badge>;
 *   } else if (quantity < 10) {
 *     return <Badge variant="warning" icon={AlertTriangle}>Low Stock</Badge>;
 *   } else {
 *     return <Badge variant="success" icon={CheckCircle}>In Stock</Badge>;
 *   }
 * };
 * 
 * // POS specific: Payment status
 * <Badge variant="success" dot>Paid</Badge>
 * <Badge variant="warning" dot>Partial</Badge>
 * <Badge variant="danger" dot>Unpaid</Badge>
 * <Badge variant="info" dot>Refunded</Badge>
 * 
 * // POS specific: Product categories as tags
 * const [selectedCategories, setSelectedCategories] = useState([
 *   'Electronics',
 *   'Accessories',
 *   'Featured'
 * ]);
 * 
 * <div className="flex flex-wrap gap-2">
 *   {selectedCategories.map((category, index) => (
 *     <Badge
 *       key={index}
 *       variant="primary"
 *       size="sm"
 *       removable
 *       onRemove={() => {
 *         setSelectedCategories(selectedCategories.filter((_, i) => i !== index));
 *       }}
 *     >
 *       {category}
 *     </Badge>
 *   ))}
 * </div>
 * 
 * // POS specific: User roles
 * <Badge variant="dark">Admin</Badge>
 * <Badge variant="primary">Manager</Badge>
 * <Badge variant="secondary">Cashier</Badge>
 * <Badge variant="gray">Guest</Badge>
 * 
 * // POS specific: Transaction type
 * <Badge variant="success" icon={TrendingUp}>Sale</Badge>
 * <Badge variant="danger" icon={TrendingDown}>Refund</Badge>
 * <Badge variant="warning" icon={RefreshCw}>Exchange</Badge>
 * 
 * // In a table
 * <table className="table-container">
 *   <thead className="table-header">
 *     <tr>
 *       <th className="table-cell">Product</th>
 *       <th className="table-cell">Status</th>
 *       <th className="table-cell">Stock</th>
 *     </tr>
 *   </thead>
 *   <tbody>
 *     <tr className="table-row">
 *       <td className="table-cell">Product A</td>
 *       <td className="table-cell">
 *         <Badge variant="success">Active</Badge>
 *       </td>
 *       <td className="table-cell">
 *         <Badge variant="warning" icon={AlertTriangle}>Low Stock</Badge>
 *       </td>
 *     </tr>
 *   </tbody>
 * </table>
 * 
 * // With counter (notification badge)
 * <div className="relative inline-block">
 *   <button className="btn-primary p-2">
 *     <ShoppingCart className="h-5 w-5" />
 *   </button>
 *   <Badge
 *     variant="danger"
 *     size="xs"
 *     className="absolute -top-1 -right-1"
 *   >
 *     5
 *   </Badge>
 * </div>
 * 
 * // Grouped badges
 * <div className="flex flex-wrap gap-2">
 *   <Badge variant="success" size="sm">New</Badge>
 *   <Badge variant="warning" size="sm">Sale</Badge>
 *   <Badge variant="info" size="sm">Featured</Badge>
 * </div>
 * 
 * // Custom styling
 * <Badge
 *   variant="primary"
 *   className="uppercase tracking-wider"
 * >
 *   Premium
 * </Badge>
 */