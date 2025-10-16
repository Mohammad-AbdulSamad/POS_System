// src/components/common/Card.jsx
import { forwardRef } from 'react';
import clsx from 'clsx';

/**
 * Card Component
 * 
 * A reusable card component with header, body, and footer sections.
 * Uses Tailwind CSS and custom theme variables from index.css
 * 
 * @example
 * <Card>
 *   <CardHeader title="Product Details" />
 *   <CardBody>Content here</CardBody>
 * </Card>
 */

const Card = forwardRef(
  (
    {
      children,
      variant = 'default',
      padding = true,
      hoverable = false,
      onClick,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = clsx(
      'bg-white rounded-xl border border-gray-200',
      {
        'card': variant === 'default' && !hoverable,
        'card-hover': hoverable || onClick,
        'p-0': !padding,
        'cursor-pointer': onClick,
      }
    );

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={clsx(baseStyles, className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

/**
 * CardHeader Component
 * 
 * Header section of the card with title, subtitle, and action buttons
 */
export const CardHeader = ({
  title,
  subtitle,
  icon: Icon,
  action,
  children,
  className = '',
}) => {
  return (
    <div
      className={clsx(
        'px-6 py-4 border-b border-gray-200',
        'flex items-center justify-between',
        className
      )}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {Icon && (
          <div className="flex-shrink-0 text-primary-600">
            <Icon className="h-5 w-5" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-500 truncate mt-0.5">
              {subtitle}
            </p>
          )}
          {children}
        </div>
      </div>
      {action && <div className="flex-shrink-0 ml-4">{action}</div>}
    </div>
  );
};

CardHeader.displayName = 'CardHeader';

/**
 * CardBody Component
 * 
 * Main content area of the card
 */
export const CardBody = ({
  children,
  padding = true,
  className = '',
}) => {
  return (
    <div
      className={clsx(
        {
          'px-6 py-4': padding,
        },
        className
      )}
    >
      {children}
    </div>
  );
};

CardBody.displayName = 'CardBody';

/**
 * CardFooter Component
 * 
 * Footer section of the card, typically for actions
 */
export const CardFooter = ({
  children,
  align = 'right',
  divided = false,
  className = '',
}) => {
  return (
    <div
      className={clsx(
        'px-6 py-4',
        {
          'border-t border-gray-200': divided,
          'flex justify-start': align === 'left',
          'flex justify-center': align === 'center',
          'flex justify-end': align === 'right',
          'flex justify-between': align === 'between',
        },
        'gap-3',
        className
      )}
    >
      {children}
    </div>
  );
};

CardFooter.displayName = 'CardFooter';

/**
 * CardSection Component
 * 
 * A section within the card body with optional title
 */
export const CardSection = ({
  title,
  children,
  divided = false,
  className = '',
}) => {
  return (
    <div
      className={clsx(
        {
          'border-t border-gray-200 pt-4 mt-4': divided,
        },
        className
      )}
    >
      {title && (
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          {title}
        </h4>
      )}
      {children}
    </div>
  );
};

CardSection.displayName = 'CardSection';

/**
 * StatCard Component
 * 
 * A specialized card for displaying statistics
 */
export const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  trendLabel,
  color = 'primary',
  onClick,
  className = '',
}) => {
  const colorStyles = {
    primary: 'bg-primary-50 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
    secondary: 'bg-secondary-50 text-secondary-600',
  };

  const trendColorStyles = {
    up: 'text-success-600',
    down: 'text-danger-600',
    neutral: 'text-gray-600',
  };

  return (
    <Card
      hoverable={!!onClick}
      onClick={onClick}
      className={className}
    >
      <CardBody>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 mb-2">
              {value}
            </p>
            {trend !== undefined && (
              <div className="flex items-center gap-1">
                {trend === 'up' && (
                  <svg className="h-4 w-4 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clipRule="evenodd" />
                  </svg>
                )}
                {trend === 'down' && (
                  <svg className="h-4 w-4 text-danger-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clipRule="evenodd" />
                  </svg>
                )}
                <span className={clsx('text-sm font-medium', trendColorStyles[trend])}>
                  {trendLabel}
                </span>
              </div>
            )}
          </div>
          {Icon && (
            <div className={clsx('p-3 rounded-lg', colorStyles[color])}>
              <Icon className="h-6 w-6" />
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};

StatCard.displayName = 'StatCard';

export default Card;

/**
 * Example Usage:
 * 
 * import Card, { CardHeader, CardBody, CardFooter, CardSection, StatCard } from '@/components/common/Card';
 * import Button from '@/components/common/Button';
 * import { Package, Edit, TrendingUp, DollarSign } from 'lucide-react';
 * 
 * // Basic Card
 * <Card>
 *   <CardHeader title="Product Information" />
 *   <CardBody>
 *     <p>This is the card content</p>
 *   </CardBody>
 * </Card>
 * 
 * // Card with Icon and Subtitle
 * <Card>
 *   <CardHeader
 *     title="Inventory Overview"
 *     subtitle="Current stock levels"
 *     icon={Package}
 *   />
 *   <CardBody>
 *     <p>Total products: 150</p>
 *   </CardBody>
 * </Card>
 * 
 * // Card with Action Button
 * <Card>
 *   <CardHeader
 *     title="Product Details"
 *     action={
 *       <Button size="sm" variant="outline" icon={Edit}>
 *         Edit
 *       </Button>
 *     }
 *   />
 *   <CardBody>
 *     <p>Product information here</p>
 *   </CardBody>
 * </Card>
 * 
 * // Card with Footer
 * <Card>
 *   <CardHeader title="Confirm Action" />
 *   <CardBody>
 *     <p>Are you sure you want to delete this item?</p>
 *   </CardBody>
 *   <CardFooter divided>
 *     <Button variant="ghost">Cancel</Button>
 *     <Button variant="danger">Delete</Button>
 *   </CardFooter>
 * </Card>
 * 
 * // Card with Multiple Sections
 * <Card>
 *   <CardHeader title="Product Management" />
 *   <CardBody>
 *     <CardSection title="Basic Information">
 *       <p>Name, SKU, Price</p>
 *     </CardSection>
 *     <CardSection title="Stock Information" divided>
 *       <p>Current stock, low stock alerts</p>
 *     </CardSection>
 *     <CardSection title="Supplier" divided>
 *       <p>Supplier details</p>
 *     </CardSection>
 *   </CardBody>
 * </Card>
 * 
 * // Hoverable Card (clickable)
 * <Card hoverable onClick={() => navigate('/product/123')}>
 *   <CardBody>
 *     <h3>Product Name</h3>
 *     <p>Click to view details</p>
 *   </CardBody>
 * </Card>
 * 
 * // Card without default padding
 * <Card padding={false}>
 *   <img src="product.jpg" alt="Product" className="w-full" />
 *   <CardBody>
 *     <p>Custom padding content</p>
 *   </CardBody>
 * </Card>
 * 
 * // StatCard - Dashboard Statistics
 * <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
 *   <StatCard
 *     title="Total Sales"
 *     value="₪12,345"
 *     icon={DollarSign}
 *     trend="up"
 *     trendLabel="+12% from last month"
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
 *     icon={TrendingUp}
 *     trend="down"
 *     trendLabel="-5 from yesterday"
 *     color="warning"
 *   />
 *   
 *   <StatCard
 *     title="Revenue"
 *     value="₪45,678"
 *     icon={DollarSign}
 *     trend="up"
 *     trendLabel="+8.5%"
 *     color="success"
 *     onClick={() => navigate('/reports/sales')}
 *   />
 * </div>
 * 
 * // Card Grid Layout
 * <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
 *   <Card hoverable>
 *     <CardHeader title="Product 1" />
 *     <CardBody>Content</CardBody>
 *   </Card>
 *   <Card hoverable>
 *     <CardHeader title="Product 2" />
 *     <CardBody>Content</CardBody>
 *   </Card>
 * </div>
 */