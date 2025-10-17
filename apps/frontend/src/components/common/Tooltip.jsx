// src/components/common/Tooltip.jsx
import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import clsx from 'clsx';

/**
 * Tooltip Component
 * 
 * A reusable tooltip component that displays contextual information on hover or focus.
 * Uses React Portal for proper positioning and z-index management.
 * 
 * @example
 * <Tooltip content="This is a helpful tip">
 *   <Button>Hover me</Button>
 * </Tooltip>
 */

const Tooltip = ({
  children,
  content,
  position = 'top',
  variant = 'dark',
  size = 'md',
  delay = 200,
  disabled = false,
  showArrow = true,
  maxWidth = 'max-w-xs',
  className = '',
  contentClassName = '',
  trigger = 'hover', // 'hover', 'click', 'focus'
  ...props
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const tooltipRef = useRef(null);
  const timeoutRef = useRef(null);

  // Position styles
  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  // Arrow styles
  const arrowStyles = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-l-transparent border-r-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-t-transparent border-b-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-t-transparent border-b-transparent border-l-transparent',
  };

  // Variant styles
  const variantStyles = {
    dark: 'bg-gray-900 text-white',
    light: 'bg-white text-gray-900 border border-gray-200 shadow-lg',
    primary: 'bg-primary-500 text-white',
    success: 'bg-success-500 text-white',
    warning: 'bg-warning-500 text-white',
    danger: 'bg-danger-500 text-white',
  };

  // Arrow variant styles
  const arrowVariantStyles = {
    dark: 'border-gray-900',
    light: 'border-white',
    primary: 'border-primary-500',
    success: 'border-success-500',
    warning: 'border-warning-500',
    danger: 'border-danger-500',
  };

  // Size styles
  const sizeStyles = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base',
  };

  // Calculate tooltip position
  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();

    let top = 0;
    let left = 0;

    switch (position) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - 8;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + 8;
        left = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        break;
      case 'left':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.left - tooltipRect.width - 8;
        break;
      case 'right':
        top = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        left = triggerRect.right + 8;
        break;
      default:
        break;
    }

    // Keep tooltip in viewport
    const padding = 8;
    if (left < padding) left = padding;
    if (left + tooltipRect.width > window.innerWidth - padding) {
      left = window.innerWidth - tooltipRect.width - padding;
    }
    if (top < padding) top = padding;

    setCoords({ top, left });
  };

  const show = () => {
    if (disabled) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hide = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const toggle = () => {
    if (isVisible) {
      hide();
    } else {
      show();
    }
  };

  useEffect(() => {
    if (isVisible) {
      updatePosition();
      window.addEventListener('scroll', updatePosition);
      window.addEventListener('resize', updatePosition);

      return () => {
        window.removeEventListener('scroll', updatePosition);
        window.removeEventListener('resize', updatePosition);
      };
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      clearTimeout(timeoutRef.current);
    };
  }, []);

  // Trigger handlers
  const triggerHandlers = {
    hover: {
      onMouseEnter: show,
      onMouseLeave: hide,
      onFocus: show,
      onBlur: hide,
    },
    click: {
      onClick: toggle,
    },
    focus: {
      onFocus: show,
      onBlur: hide,
    },
  };

  const tooltipContent = isVisible && content && (
    <div
      ref={tooltipRef}
      role="tooltip"
      className={clsx(
        'fixed z-50 rounded-lg pointer-events-none',
        'animate-fadeIn',
        variantStyles[variant],
        sizeStyles[size],
        maxWidth,
        contentClassName
      )}
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
      }}
      {...props}
    >
      {content}
      
      {/* Arrow */}
      {showArrow && (
        <div
          className={clsx(
            'absolute w-0 h-0 border-4',
            arrowStyles[position],
            arrowVariantStyles[variant]
          )}
        />
      )}
    </div>
  );

  return (
    <>
      <span
        ref={triggerRef}
        className={clsx('inline-block', className)}
        {...triggerHandlers[trigger]}
      >
        {children}
      </span>
      {tooltipContent && createPortal(tooltipContent, document.body)}
    </>
  );
};

Tooltip.displayName = 'Tooltip';

export default Tooltip;

/**
 * Example Usage:
 * 
 * import Tooltip from '@/components/common/Tooltip';
 * import Button from '@/components/common/Button';
 * import { HelpCircle, Info, AlertCircle } from 'lucide-react';
 * 
 * // Basic usage
 * <Tooltip content="This is a helpful tooltip">
 *   <Button>Hover me</Button>
 * </Tooltip>
 * 
 * // Different positions
 * <Tooltip content="Top tooltip" position="top">
 *   <Button>Top</Button>
 * </Tooltip>
 * 
 * <Tooltip content="Bottom tooltip" position="bottom">
 *   <Button>Bottom</Button>
 * </Tooltip>
 * 
 * <Tooltip content="Left tooltip" position="left">
 *   <Button>Left</Button>
 * </Tooltip>
 * 
 * <Tooltip content="Right tooltip" position="right">
 *   <Button>Right</Button>
 * </Tooltip>
 * 
 * // Different variants
 * <Tooltip content="Dark tooltip" variant="dark">
 *   <Button>Dark</Button>
 * </Tooltip>
 * 
 * <Tooltip content="Light tooltip" variant="light">
 *   <Button>Light</Button>
 * </Tooltip>
 * 
 * <Tooltip content="Primary tooltip" variant="primary">
 *   <Button>Primary</Button>
 * </Tooltip>
 * 
 * <Tooltip content="Success tooltip" variant="success">
 *   <Button>Success</Button>
 * </Tooltip>
 * 
 * <Tooltip content="Warning tooltip" variant="warning">
 *   <Button>Warning</Button>
 * </Tooltip>
 * 
 * <Tooltip content="Danger tooltip" variant="danger">
 *   <Button>Danger</Button>
 * </Tooltip>
 * 
 * // Different sizes
 * <Tooltip content="Small tooltip" size="sm">
 *   <Button>Small</Button>
 * </Tooltip>
 * 
 * <Tooltip content="Medium tooltip" size="md">
 *   <Button>Medium</Button>
 * </Tooltip>
 * 
 * <Tooltip content="Large tooltip" size="lg">
 *   <Button>Large</Button>
 * </Tooltip>
 * 
 * // With icon
 * <Tooltip content="Need help? Contact support">
 *   <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
 * </Tooltip>
 * 
 * // Without arrow
 * <Tooltip content="No arrow tooltip" showArrow={false}>
 *   <Button>No Arrow</Button>
 * </Tooltip>
 * 
 * // Custom delay
 * <Tooltip content="Shows after 500ms" delay={500}>
 *   <Button>Delayed</Button>
 * </Tooltip>
 * 
 * // Disabled tooltip
 * <Tooltip content="Won't show" disabled>
 *   <Button>Disabled Tooltip</Button>
 * </Tooltip>
 * 
 * // Click trigger
 * <Tooltip content="Click to toggle" trigger="click">
 *   <Button>Click Me</Button>
 * </Tooltip>
 * 
 * // Focus trigger
 * <Tooltip content="Focus to show" trigger="focus">
 *   <input type="text" placeholder="Focus me" className="input-field" />
 * </Tooltip>
 * 
 * // Long content with max width
 * <Tooltip 
 *   content="This is a longer tooltip with multiple lines of text that will wrap properly within the max width constraint."
 *   maxWidth="max-w-sm"
 * >
 *   <Button>Long Content</Button>
 * </Tooltip>
 * 
 * // POS specific: Product info
 * <Tooltip 
 *   content="Stock: 45 units | Last restocked: 2 days ago"
 *   variant="dark"
 *   position="top"
 * >
 *   <Info className="h-4 w-4 text-gray-400 cursor-help" />
 * </Tooltip>
 * 
 * // POS specific: Pricing info
 * <Tooltip 
 *   content="Price includes 10% tax"
 *   variant="light"
 *   size="sm"
 * >
 *   <span className="text-sm text-gray-500">$25.00</span>
 * </Tooltip>
 * 
 * // POS specific: Button with help
 * <div className="flex items-center gap-2">
 *   <Button variant="primary">Process Payment</Button>
 *   <Tooltip 
 *     content="Click to process the payment and complete the transaction"
 *     position="right"
 *   >
 *     <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
 *   </Tooltip>
 * </div>
 * 
 * // POS specific: Stock warning
 * <Tooltip 
 *   content="Low stock! Only 3 units remaining"
 *   variant="warning"
 *   position="top"
 * >
 *   <AlertCircle className="h-5 w-5 text-warning-500 cursor-help" />
 * </Tooltip>
 * 
 * // POS specific: Disabled action explanation
 * <Tooltip 
 *   content="This action is disabled because the order is already completed"
 *   variant="dark"
 * >
 *   <Button variant="primary" disabled>
 *     Refund
 *   </Button>
 * </Tooltip>
 * 
 * // POS specific: Transaction details
 * <Tooltip 
 *   content={
 *     <div className="space-y-1">
 *       <div>Transaction ID: #TXN-12345</div>
 *       <div>Date: Oct 18, 2025</div>
 *       <div>Cashier: John Doe</div>
 *     </div>
 *   }
 *   variant="light"
 *   maxWidth="max-w-md"
 * >
 *   <Info className="h-4 w-4 text-blue-500 cursor-help" />
 * </Tooltip>
 * 
 * // POS specific: Keyboard shortcut hint
 * <Tooltip 
 *   content={
 *     <div>
 *       <span className="font-semibold">Keyboard Shortcut:</span> Ctrl+P
 *     </div>
 *   }
 *   variant="dark"
 *   size="sm"
 * >
 *   <Button variant="outline">Print Receipt</Button>
 * </Tooltip>
 * 
 * // In a table header
 * <th className="table-cell">
 *   <div className="flex items-center gap-2">
 *     <span>Stock Level</span>
 *     <Tooltip 
 *       content="Current quantity available in inventory"
 *       variant="dark"
 *       size="sm"
 *     >
 *       <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
 *     </Tooltip>
 *   </div>
 * </th>
 * 
 * // With badge
 * <Tooltip content="You have 5 pending notifications">
 *   <div className="relative">
 *     <Bell className="h-5 w-5 text-gray-600 cursor-pointer" />
 *     <Badge 
 *       variant="danger" 
 *       size="xs"
 *       className="absolute -top-1 -right-1"
 *     >
 *       5
 *     </Badge>
 *   </div>
 * </Tooltip>
 * 
 * // Conditional tooltip
 * const isOutOfStock = product.stock === 0;
 * 
 * <Tooltip 
 *   content="This product is out of stock"
 *   variant="danger"
 *   disabled={!isOutOfStock}
 * >
 *   <Button 
 *     variant="primary" 
 *     disabled={isOutOfStock}
 *   >
 *     Add to Cart
 *   </Button>
 * </Tooltip>
 * 
 * // Complex content
 * <Tooltip 
 *   content={
 *     <div className="space-y-2">
 *       <div className="font-semibold">Product Details</div>
 *       <div className="text-xs space-y-1">
 *         <div>SKU: PROD-001</div>
 *         <div>Category: Electronics</div>
 *         <div>Supplier: Tech Corp</div>
 *         <div className="text-success-300">In Stock: 25 units</div>
 *       </div>
 *     </div>
 *   }
 *   variant="dark"
 *   maxWidth="max-w-xs"
 *   position="right"
 * >
 *   <Button variant="ghost" size="sm">
 *     <Info className="h-4 w-4" />
 *   </Button>
 * </Tooltip>
 * 
 * // Form field help
 * <div className="space-y-2">
 *   <div className="flex items-center gap-2">
 *     <label htmlFor="discount" className="text-sm font-medium">
 *       Discount Percentage
 *     </label>
 *     <Tooltip 
 *       content="Enter a discount between 0-100%. This will be applied to the total amount."
 *       variant="light"
 *       size="sm"
 *     >
 *       <HelpCircle className="h-3.5 w-3.5 text-gray-400 cursor-help" />
 *     </Tooltip>
 *   </div>
 *   <Input id="discount" type="number" min="0" max="100" />
 * </div>
 */