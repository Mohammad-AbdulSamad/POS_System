// src/components/dashboard/QuickActions.jsx
import { useState } from 'react';
import Card, { CardHeader, CardBody } from '../common/Card';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Modal from '../common/Modal';
import Tooltip from '../common/Tooltip';
import { 
  Plus,
  ShoppingCart,
  Package,
  Users,
  Receipt,
  Printer,
  Download,
  Upload,
  BarChart,
  Settings,
  RefreshCw,
  FileText,
  DollarSign,
  TrendingUp,
  Zap
} from 'lucide-react';
import clsx from 'clsx';

/**
 * QuickActions Component
 * 
 * Provides quick access to common POS operations and tasks.
 * Customizable action buttons with icons, tooltips, and keyboard shortcuts.
 * 
 * @example
 * <QuickActions
 *   actions={customActions}
 *   layout="grid"
 *   onActionClick={(action) => handleAction(action)}
 * />
 */

const QuickActions = ({
  actions = null, // If null, uses default actions
  loading = false,
  title = 'Quick Actions',
  subtitle = 'Common tasks and operations',
  layout = 'grid', // 'grid' or 'list'
  columns = 3,
  showShortcuts = true,
  onActionClick,
  className = '',
}) => {
  const [processingAction, setProcessingAction] = useState(null);

  // Default POS actions
  const defaultActions = [
    {
      id: 'new-sale',
      label: 'New Sale',
      icon: ShoppingCart,
      color: 'primary',
      shortcut: 'Ctrl+N',
      description: 'Start a new transaction',
    },
    {
      id: 'add-product',
      label: 'Add Product',
      icon: Plus,
      color: 'success',
      shortcut: 'Ctrl+P',
      description: 'Add new product to inventory',
    },
    {
      id: 'add-customer',
      label: 'Add Customer',
      icon: Users,
      color: 'info',
      shortcut: 'Ctrl+U',
      description: 'Register new customer',
    },
    {
      id: 'view-reports',
      label: 'Reports',
      icon: BarChart,
      color: 'secondary',
      shortcut: 'Ctrl+R',
      description: 'View sales reports',
    },
    {
      id: 'print-receipt',
      label: 'Print Receipt',
      icon: Printer,
      color: 'gray',
      description: 'Reprint last receipt',
    },
    {
      id: 'end-shift',
      label: 'End Shift',
      icon: DollarSign,
      color: 'warning',
      description: 'Close current shift',
    },
  ];

  const actionList = actions || defaultActions;

  // Color mapping for buttons
  const colorVariants = {
    primary: 'btn-primary',
    success: 'btn-success',
    danger: 'btn-danger',
    warning: 'btn-warning',
    info: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'btn-secondary',
    gray: 'bg-gray-500 text-white hover:bg-gray-600',
  };

  // Handle action click
  const handleActionClick = async (action) => {
    if (processingAction === action.id || action.disabled) return;

    setProcessingAction(action.id);

    try {
      await onActionClick?.(action);
    } finally {
      setTimeout(() => {
        setProcessingAction(null);
      }, 500);
    }
  };

  // Render action button
  const ActionButton = ({ action }) => {
    const Icon = action.icon;
    const isProcessing = processingAction === action.id;

    const buttonContent = (
      <Button
        variant={action.variant || 'primary'}
        size="lg"
        fullWidth
        disabled={action.disabled || isProcessing}
        loading={isProcessing}
        onClick={() => handleActionClick(action)}
        className={clsx(
          'h-auto py-4 flex-col gap-2',
          layout === 'grid' && 'min-h-[120px]',
          !action.variant && colorVariants[action.color],
          action.className
        )}
      >
        {!isProcessing && Icon && (
          <Icon className="h-6 w-6" />
        )}
        <span className="font-semibold">{action.label}</span>
        {showShortcuts && action.shortcut && layout === 'grid' && (
          <span className="text-xs opacity-70 font-normal">
            {action.shortcut}
          </span>
        )}
        {action.badge && (
          <Badge
            variant={action.badgeVariant || 'danger'}
            size="xs"
            className="absolute top-2 right-2"
          >
            {action.badge}
          </Badge>
        )}
      </Button>
    );

    // Wrap with tooltip if description exists
    if (action.description && !action.disabled) {
      return (
        <Tooltip content={action.description} position="top">
          {buttonContent}
        </Tooltip>
      );
    }

    return buttonContent;
  };

  return (
    <Card className={clsx('h-full', className)}>
      <CardHeader
        title={title}
        subtitle={subtitle}
        icon={Zap}
      />

      <CardBody>
        {layout === 'grid' ? (
          <div
            className={clsx(
              'grid gap-4',
              {
                'grid-cols-2': columns === 2,
                'grid-cols-3': columns === 3,
                'grid-cols-4': columns === 4,
              }
            )}
          >
            {actionList.map((action) => (
              <div key={action.id} className="relative">
                <ActionButton action={action} />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {actionList.map((action) => (
              <div key={action.id} className="relative">
                <ActionButton action={action} />
              </div>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

QuickActions.displayName = 'QuickActions';

export default QuickActions;

/**
 * Example Usage:
 * 
 * import QuickActions from '@/components/dashboard/QuickActions';
 * 
 * // Basic usage with default actions
 * <QuickActions
 *   onActionClick={(action) => {
 *     console.log('Action clicked:', action.id);
 *   }}
 * />
 * 
 * // Custom actions
 * const customActions = [
 *   {
 *     id: 'new-sale',
 *     label: 'New Sale',
 *     icon: ShoppingCart,
 *     color: 'primary',
 *     shortcut: 'F1',
 *     description: 'Start new transaction',
 *   },
 *   {
 *     id: 'returns',
 *     label: 'Process Return',
 *     icon: RefreshCw,
 *     color: 'warning',
 *     shortcut: 'F2',
 *     description: 'Process customer return',
 *   },
 *   {
 *     id: 'void',
 *     label: 'Void Sale',
 *     icon: XCircle,
 *     color: 'danger',
 *     description: 'Void last transaction',
 *     disabled: true, // Can be conditionally disabled
 *   },
 *   {
 *     id: 'sync',
 *     label: 'Sync Data',
 *     icon: RefreshCw,
 *     color: 'info',
 *     badge: '3', // Show notification badge
 *     badgeVariant: 'warning',
 *   },
 * ];
 * 
 * <QuickActions
 *   actions={customActions}
 *   onActionClick={handleAction}
 * />
 * 
 * // Grid layout with different columns
 * <QuickActions
 *   layout="grid"
 *   columns={4}
 *   onActionClick={handleAction}
 * />
 * 
 * // List layout
 * <QuickActions
 *   layout="list"
 *   onActionClick={handleAction}
 * />
 * 
 * // Complete dashboard implementation
 * const Dashboard = () => {
 *   const navigate = useNavigate();
 *   const toast = useToast();
 * 
 *   const actions = [
 *     {
 *       id: 'new-sale',
 *       label: 'New Sale',
 *       icon: ShoppingCart,
 *       color: 'primary',
 *       shortcut: 'F1',
 *       description: 'Start a new sale transaction',
 *     },
 *     {
 *       id: 'add-product',
 *       label: 'Add Product',
 *       icon: Plus,
 *       color: 'success',
 *       shortcut: 'F2',
 *       description: 'Add new product to inventory',
 *     },
 *     {
 *       id: 'inventory',
 *       label: 'Inventory',
 *       icon: Package,
 *       color: 'info',
 *       shortcut: 'F3',
 *       badge: lowStockCount > 0 ? lowStockCount : null,
 *       badgeVariant: 'warning',
 *     },
 *     {
 *       id: 'customers',
 *       label: 'Customers',
 *       icon: Users,
 *       color: 'secondary',
 *       shortcut: 'F4',
 *     },
 *     {
 *       id: 'reports',
 *       label: 'Reports',
 *       icon: BarChart,
 *       color: 'gray',
 *       shortcut: 'F5',
 *     },
 *     {
 *       id: 'end-shift',
 *       label: 'End Shift',
 *       icon: DollarSign,
 *       color: 'warning',
 *       description: 'Close register and end shift',
 *     },
 *   ];
 * 
 *   const handleAction = async (action) => {
 *     switch (action.id) {
 *       case 'new-sale':
 *         navigate('/pos/sale');
 *         break;
 *       case 'add-product':
 *         navigate('/products/new');
 *         break;
 *       case 'inventory':
 *         navigate('/inventory');
 *         break;
 *       case 'customers':
 *         navigate('/customers');
 *         break;
 *       case 'reports':
 *         navigate('/reports');
 *         break;
 *       case 'end-shift':
 *         const confirmed = await confirmEndShift();
 *         if (confirmed) {
 *           await endShift();
 *           toast.success('Shift ended successfully');
 *         }
 *         break;
 *       default:
 *         toast.info(`${action.label} clicked`);
 *     }
 *   };
 * 
 *   // Setup keyboard shortcuts
 *   useEffect(() => {
 *     const handleKeyPress = (e) => {
 *       if (e.key === 'F1') {
 *         e.preventDefault();
 *         handleAction(actions[0]);
 *       }
 *       // Add more shortcuts...
 *     };
 * 
 *     window.addEventListener('keydown', handleKeyPress);
 *     return () => window.removeEventListener('keydown', handleKeyPress);
 *   }, []);
 * 
 *   return (
 *     <div className="space-y-6">
 *       <QuickActions
 *         actions={actions}
 *         onActionClick={handleAction}
 *         columns={3}
 *       />
 *     </div>
 *   );
 * };
 * 
 * // Compact sidebar version
 * <QuickActions
 *   title="Quick Access"
 *   layout="list"
 *   showShortcuts={false}
 *   actions={[
 *     { id: 'sale', label: 'New Sale', icon: ShoppingCart, color: 'primary' },
 *     { id: 'product', label: 'Add Product', icon: Plus, color: 'success' },
 *     { id: 'report', label: 'Reports', icon: BarChart, color: 'gray' },
 *   ]}
 * />
 * 
 * // With conditional actions based on user role
 * const getActionsForRole = (role) => {
 *   const baseActions = [
 *     { id: 'new-sale', label: 'New Sale', icon: ShoppingCart, color: 'primary' },
 *     { id: 'print', label: 'Print Receipt', icon: Printer, color: 'gray' },
 *   ];
 * 
 *   if (role === 'manager' || role === 'admin') {
 *     baseActions.push(
 *       { id: 'reports', label: 'Reports', icon: BarChart, color: 'info' },
 *       { id: 'end-shift', label: 'End Shift', icon: DollarSign, color: 'warning' }
 *     );
 *   }
 * 
 *   if (role === 'admin') {
 *     baseActions.push(
 *       { id: 'settings', label: 'Settings', icon: Settings, color: 'secondary' }
 *     );
 *   }
 * 
 *   return baseActions;
 * };
 * 
 * <QuickActions
 *   actions={getActionsForRole(currentUser.role)}
 *   onActionClick={handleAction}
 * />
 */