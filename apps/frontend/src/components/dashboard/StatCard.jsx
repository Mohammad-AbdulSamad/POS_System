// src/components/common/StatCard.jsx
import { forwardRef } from 'react';
import clsx from 'clsx';
import Card, { CardBody } from '../common/Card';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';

/**
 * StatCard Component
 * 
 * A specialized card component for displaying statistics and metrics on dashboards.
 * Built on top of the Card component with additional features for trends, comparisons, and actions.
 * 
 * @example
 * <StatCard
 *   title="Total Sales"
 *   value="₪12,345"
 *   icon={DollarSign}
 *   trend="up"
 *   trendValue="+12%"
 *   trendLabel="from last month"
 *   color="success"
 * />
 */

const StatCard = forwardRef(
  (
    {
      title,
      value,
      subtitle,
      description,
      icon: Icon = null,
      trend = null, // 'up', 'down', 'neutral', null
      trendValue,
      trendLabel,
      color = 'primary',
      badge,
      loading = false,
      onClick,
      actions,
      footer,
      size = 'md',
      variant = 'default',
      hoverable = false,
      className = '',
      ...props
    },
    ref
  ) => {
    // Color styles for icon background
    const colorStyles = {
      primary: 'bg-primary-50 text-primary-600',
      secondary: 'bg-secondary-50 text-secondary-600',
      success: 'bg-success-50 text-success-600',
      warning: 'bg-warning-50 text-warning-600',
      danger: 'bg-danger-50 text-danger-600',
      info: 'bg-primary-50 text-primary-600',
      gray: 'bg-gray-50 text-gray-600',
    };

    // Trend color styles
    const trendColorStyles = {
      up: 'text-success-600',
      down: 'text-danger-600',
      neutral: 'text-gray-600',
    };

    // Size styles
    const sizeStyles = {
      sm: {
        padding: 'p-4',
        title: 'text-xs',
        value: 'text-xl',
        icon: 'h-4 w-4',
        iconContainer: 'p-2',
        trend: 'text-xs',
      },
      md: {
        padding: 'p-6',
        title: 'text-sm',
        value: 'text-2xl',
        icon: 'h-5 w-5',
        iconContainer: 'p-3',
        trend: 'text-sm',
      },
      lg: {
        padding: 'p-8',
        title: 'text-base',
        value: 'text-3xl',
        icon: 'h-6 w-6',
        iconContainer: 'p-4',
        trend: 'text-base',
      },
    };

    const currentSize = sizeStyles[size];

    // Variant styles
    const variantStyles = {
      default: 'bg-white',
      outlined: 'bg-white border-2',
      filled: clsx({
        'bg-primary-50': color === 'primary',
        'bg-secondary-50': color === 'secondary',
        'bg-success-50': color === 'success',
        'bg-warning-50': color === 'warning',
        'bg-danger-50': color === 'danger',
        'bg-gray-50': color === 'gray',
      }),
      gradient: clsx(
        'bg-gradient-to-br text-white',
        {
          'from-primary-500 to-primary-600': color === 'primary',
          'from-secondary-500 to-secondary-600': color === 'secondary',
          'from-success-500 to-success-600': color === 'success',
          'from-warning-500 to-warning-600': color === 'warning',
          'from-danger-500 to-danger-600': color === 'danger',
          'from-gray-500 to-gray-600': color === 'gray',
        }
      ),
    };

    // Trend icon
    const TrendIcon = ({ direction }) => {
      if (direction === 'up') {
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
              clipRule="evenodd"
            />
          </svg>
        );
      }
      if (direction === 'down') {
        return (
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
              clipRule="evenodd"
            />
          </svg>
        );
      }
      return (
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    };

    return (
      <Card
        ref={ref}
        hoverable={hoverable || !!onClick}
        onClick={onClick}
        className={clsx(variantStyles[variant], className)}
        padding={false}
        {...props}
      >
        <CardBody padding={false} className={currentSize.padding}>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" variant={color} />
            </div>
          ) : (
            <>
              {/* Header with Badge */}
              {badge && (
                <div className="mb-4">
                  {typeof badge === 'string' ? (
                    <Badge variant={color} size="sm">
                      {badge}
                    </Badge>
                  ) : (
                    badge
                  )}
                </div>
              )}

              <div className="flex items-start justify-between">
                {/* Left Content */}
                <div className="flex-1 min-w-0">
                  {/* Title */}
                  <p
                    className={clsx(
                      'font-medium mb-1',
                      currentSize.title,
                      variant === 'gradient' ? 'text-white/80' : 'text-gray-600'
                    )}
                  >
                    {title}
                  </p>

                  {/* Value */}
                  <p
                    className={clsx(
                      'font-bold mb-2',
                      currentSize.value,
                      variant === 'gradient' ? 'text-white' : 'text-gray-900'
                    )}
                  >
                    {value}
                  </p>

                  {/* Subtitle */}
                  {subtitle && (
                    <p
                      className={clsx(
                        'text-xs mb-2',
                        variant === 'gradient'
                          ? 'text-white/70'
                          : 'text-gray-500'
                      )}
                    >
                      {subtitle}
                    </p>
                  )}

                  {/* Trend */}
                  {trend && (trendValue || trendLabel) && (
                    <div
                      className={clsx(
                        'flex items-center gap-1',
                        currentSize.trend
                      )}
                    >
                      <div
                        className={clsx(
                          'flex items-center gap-0.5 font-medium',
                          variant === 'gradient'
                            ? 'text-white/90'
                            : trendColorStyles[trend]
                        )}
                      >
                        <TrendIcon direction={trend} />
                        {trendValue && <span>{trendValue}</span>}
                      </div>
                      {trendLabel && (
                        <span
                          className={clsx(
                            variant === 'gradient'
                              ? 'text-white/70'
                              : 'text-gray-500'
                          )}
                        >
                          {trendLabel}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Description */}
                  {description && (
                    <p
                      className={clsx(
                        'text-xs mt-2',
                        variant === 'gradient'
                          ? 'text-white/70'
                          : 'text-gray-500'
                      )}
                    >
                      {description}
                    </p>
                  )}
                </div>

                {/* Icon */}
                {Icon && (
                  <div
                    className={clsx(
                      'rounded-lg flex-shrink-0',
                      currentSize.iconContainer,
                      variant === 'gradient'
                        ? 'bg-white/20 text-white'
                        : colorStyles[color]
                    )}
                  >
                    <Icon className={currentSize.icon} />
                  </div>
                )}
              </div>

              {/* Actions */}
              {actions && (
                <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-200">
                  {actions}
                </div>
              )}

              {/* Footer */}
              {footer && (
                <div
                  className={clsx(
                    'mt-4 pt-4 border-t',
                    variant === 'gradient'
                      ? 'border-white/20'
                      : 'border-gray-200'
                  )}
                >
                  {footer}
                </div>
              )}
            </>
          )}
        </CardBody>
      </Card>
    );
  }
);

StatCard.displayName = 'StatCard';

export default StatCard;

/**
 * Example Usage:
 * 
 * import StatCard from '@/components/common/StatCard';
 * import Button from '@/components/common/Button';
 * import Badge from '@/components/common/Badge';
 * import { 
 *   DollarSign, 
 *   Package, 
 *   Users, 
 *   TrendingUp,
 *   ShoppingCart,
 *   AlertTriangle,
 *   CreditCard
 * } from 'lucide-react';
 * 
 * // Basic usage
 * <StatCard
 *   title="Total Sales"
 *   value="₪12,345"
 *   icon={DollarSign}
 *   color="success"
 * />
 * 
 * // With trend indicator
 * <StatCard
 *   title="Revenue"
 *   value="₪45,678"
 *   icon={TrendingUp}
 *   trend="up"
 *   trendValue="+12%"
 *   trendLabel="from last month"
 *   color="success"
 * />
 * 
 * // Negative trend
 * <StatCard
 *   title="Returns"
 *   value="23"
 *   icon={Package}
 *   trend="down"
 *   trendValue="-5"
 *   trendLabel="from yesterday"
 *   color="danger"
 * />
 * 
 * // Neutral trend
 * <StatCard
 *   title="Active Users"
 *   value="150"
 *   icon={Users}
 *   trend="neutral"
 *   trendLabel="No change"
 *   color="gray"
 * />
 * 
 * // With subtitle and description
 * <StatCard
 *   title="Inventory Value"
 *   value="₪125,000"
 *   subtitle="Total stock value"
 *   description="Across all warehouses"
 *   icon={Package}
 *   color="primary"
 * />
 * 
 * // With badge
 * <StatCard
 *   title="Orders"
 *   value="1,234"
 *   icon={ShoppingCart}
 *   badge="This Month"
 *   color="primary"
 * />
 * 
 * // With custom badge component
 * <StatCard
 *   title="Pending Tasks"
 *   value="15"
 *   icon={AlertTriangle}
 *   badge={<Badge variant="warning" size="sm">Urgent</Badge>}
 *   color="warning"
 * />
 * 
 * // Clickable card
 * <StatCard
 *   title="Total Products"
 *   value="1,234"
 *   icon={Package}
 *   onClick={() => navigate('/products')}
 *   hoverable
 *   color="primary"
 * />
 * 
 * // With action buttons
 * <StatCard
 *   title="Low Stock Items"
 *   value="23"
 *   icon={AlertTriangle}
 *   trend="up"
 *   trendValue="+5"
 *   color="warning"
 *   actions={
 *     <>
 *       <Button size="sm" variant="outline">Ignore</Button>
 *       <Button size="sm" variant="warning">View Items</Button>
 *     </>
 *   }
 * />
 * 
 * // With footer content
 * <StatCard
 *   title="Total Revenue"
 *   value="₪52,340"
 *   icon={DollarSign}
 *   color="success"
 *   footer={
 *     <div className="flex items-center justify-between text-sm">
 *       <span className="text-gray-500">Goal: ₪60,000</span>
 *       <span className="text-success-600 font-medium">87%</span>
 *     </div>
 *   }
 * />
 * 
 * // Different sizes
 * <StatCard
 *   size="sm"
 *   title="Sales"
 *   value="₪5,678"
 *   icon={DollarSign}
 *   color="success"
 * />
 * 
 * <StatCard
 *   size="md"
 *   title="Sales"
 *   value="₪5,678"
 *   icon={DollarSign}
 *   color="success"
 * />
 * 
 * <StatCard
 *   size="lg"
 *   title="Sales"
 *   value="₪5,678"
 *   icon={DollarSign}
 *   color="success"
 * />
 * 
 * // Different variants
 * <StatCard
 *   variant="default"
 *   title="Default"
 *   value="100"
 *   icon={Package}
 * />
 * 
 * <StatCard
 *   variant="outlined"
 *   title="Outlined"
 *   value="200"
 *   icon={Package}
 * />
 * 
 * <StatCard
 *   variant="filled"
 *   title="Filled"
 *   value="300"
 *   icon={Package}
 *   color="primary"
 * />
 * 
 * <StatCard
 *   variant="gradient"
 *   title="Gradient"
 *   value="400"
 *   icon={Package}
 *   color="primary"
 * />
 * 
 * // Loading state
 * <StatCard
 *   title="Sales"
 *   value="Loading..."
 *   icon={DollarSign}
 *   loading
 * />
 * 
 * // Dashboard grid layout
 * <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
 *   <StatCard
 *     title="Total Sales"
 *     value="₪12,345"
 *     icon={DollarSign}
 *     trend="up"
 *     trendValue="+12%"
 *     trendLabel="from last month"
 *     color="success"
 *   />
 *   
 *   <StatCard
 *     title="Products"
 *     value="1,234"
 *     icon={Package}
 *     trend="neutral"
 *     trendLabel="No change"
 *     color="primary"
 *   />
 *   
 *   <StatCard
 *     title="Low Stock Items"
 *     value="23"
 *     icon={AlertTriangle}
 *     trend="down"
 *     trendValue="-5"
 *     trendLabel="from yesterday"
 *     color="warning"
 *   />
 *   
 *   <StatCard
 *     title="Total Customers"
 *     value="456"
 *     icon={Users}
 *     trend="up"
 *     trendValue="+8"
 *     trendLabel="new this week"
 *     color="info"
 *   />
 * </div>
 * 
 * // POS specific: Daily sales summary
 * <StatCard
 *   title="Today's Sales"
 *   value="₪2,450"
 *   subtitle="45 transactions"
 *   icon={ShoppingCart}
 *   trend="up"
 *   trendValue="+15%"
 *   trendLabel="vs yesterday"
 *   color="success"
 *   footer={
 *     <div className="grid grid-cols-2 gap-4 text-xs">
 *       <div>
 *         <span className="text-gray-500">Cash:</span>
 *         <span className="font-medium ml-1">₪1,200</span>
 *       </div>
 *       <div>
 *         <span className="text-gray-500">Card:</span>
 *         <span className="font-medium ml-1">₪1,250</span>
 *       </div>
 *     </div>
 *   }
 * />
 * 
 * // POS specific: Inventory alert
 * <StatCard
 *   title="Low Stock Alert"
 *   value="12"
 *   subtitle="Items need reordering"
 *   icon={AlertTriangle}
 *   color="warning"
 *   variant="filled"
 *   actions={
 *     <Button size="sm" variant="warning" fullWidth>
 *       View Items
 *     </Button>
 *   }
 * />
 * 
 * // POS specific: Payment methods breakdown
 * <StatCard
 *   title="Payment Methods"
 *   value="₪8,500"
 *   subtitle="Total collected today"
 *   icon={CreditCard}
 *   color="primary"
 *   footer={
 *     <div className="space-y-2">
 *       <div className="flex justify-between text-xs">
 *         <span className="text-gray-500">Credit Card</span>
 *         <span className="font-medium">₪4,500 (53%)</span>
 *       </div>
 *       <div className="flex justify-between text-xs">
 *         <span className="text-gray-500">Cash</span>
 *         <span className="font-medium">₪3,200 (38%)</span>
 *       </div>
 *       <div className="flex justify-between text-xs">
 *         <span className="text-gray-500">Mobile</span>
 *         <span className="font-medium">₪800 (9%)</span>
 *       </div>
 *     </div>
 *   }
 * />
 * 
 * // POS specific: Top selling product
 * <StatCard
 *   title="Top Selling Product"
 *   value="Wireless Mouse"
 *   subtitle="45 units sold"
 *   icon={TrendingUp}
 *   color="success"
 *   badge="Best Seller"
 *   onClick={() => navigate('/products/123')}
 *   hoverable
 * />
 * 
 * // Complete dashboard example
 * const Dashboard = () => {
 *   return (
 *     <div className="space-y-6">
//  *       {/* Main stats */
//  *       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//  *         <StatCard
//  *           title="Total Revenue"
//  *           value="₪45,231"
//  *           icon={DollarSign}
//  *           trend="up"
//  *           trendValue="+20.1%"
//  *           trendLabel="from last month"
//  *           color="success"
//  *           variant="gradient"
//  *         />
//  *         
//  *         <StatCard
//  *           title="Orders"
//  *           value="2,345"
//  *           icon={ShoppingCart}
//  *           trend="up"
//  *           trendValue="+180"
//  *           trendLabel="from last month"
//  *           color="primary"
//  *           onClick={() => navigate('/orders')}
//  *           hoverable
//  *         />
//  *         
//  *         <StatCard
//  *           title="Products"
//  *           value="1,234"
//  *           icon={Package}
//  *           trend="neutral"
//  *           trendLabel="No change"
//  *           color="gray"
//  *         />
//  *         
//  *         <StatCard
//  *           title="Customers"
//  *           value="543"
//  *           icon={Users}
//  *           trend="up"
//  *           trendValue="+19"
//  *           trendLabel="from last month"
//  *           color="info"
//  *         />
//  *       </div>
//  *       
//  *       {/* Alert cards */}
//  *       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//  *         <StatCard
//  *           title="Low Stock Items"
//  *           value="23"
//  *           subtitle="Require immediate attention"
//  *           icon={AlertTriangle}
//  *           color="warning"
//  *           variant="filled"
//  *           actions={
//  *             <>
//  *               <Button size="sm" variant="outline">Dismiss</Button>
//  *               <Button size="sm" variant="warning">View Items</Button>
//  *             </>
//  *           }
//  *         />
//  *         
//  *         <StatCard
//  *           title="Pending Orders"
//  *           value="12"
//  *           subtitle="Awaiting fulfillment"
//  *           icon={ShoppingCart}
//  *           color="primary"
//  *           onClick={() => navigate('/orders?status=pending')}
//  *           hoverable
//  *         />
//  *       </div>
//  *     </div>
//  *   );
//  * };
//  */