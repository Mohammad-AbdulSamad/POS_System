// src/components/dashboard/RecentTransactions.jsx
import { useState } from 'react';
import Card, { CardHeader, CardBody } from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';
import { Receipt, ExternalLink, CreditCard, Banknote, Smartphone } from 'lucide-react';
import clsx from 'clsx';

/**
 * RecentTransactions Component
 * 
 * Displays a list of recent transactions with payment method, status, and actions.
 * Includes filtering and quick actions for transaction management.
 * 
 * @example
 * <RecentTransactions
 *   transactions={transactions}
 *   onViewDetails={(transaction) => navigate(`/transactions/${transaction.id}`)}
 * />
 */

const RecentTransactions = ({
  transactions = [],
  loading = false,
  title = 'Recent Transactions',
  maxItems = 10,
  showViewAll = true,
  onViewAll,
  onViewDetails,
  currency = '₪',
  className = '',
}) => {
  // Payment method icons
  const paymentIcons = {
    cash: Banknote,
    card: CreditCard,
    mobile: Smartphone,
    credit_card: CreditCard,
    debit_card: CreditCard,
  };

  // Status badge variants
  const statusVariants = {
    completed: 'success',
    pending: 'warning',
    failed: 'danger',
    refunded: 'info',
    cancelled: 'gray',
  };

  // Format date/time
  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Display limited transactions
  const displayedTransactions = transactions.slice(0, maxItems);

  return (
    <Card className={clsx('h-full', className)}>
      <CardHeader
        title={title}
        subtitle={`${transactions.length} transactions`}
        icon={Receipt}
        action={
          showViewAll && transactions.length > 0 && (
            <Button
              size="sm"
              variant="ghost"
              icon={ExternalLink}
              onClick={onViewAll}
            >
              View All
            </Button>
          )
        }
      />

      <CardBody padding={false}>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="lg" label="Loading transactions..." />
          </div>
        ) : transactions.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title="No transactions yet"
            description="Completed transactions will appear here"
            size="sm"
          />
        ) : (
          <div className="divide-y divide-gray-200">
            {displayedTransactions.map((transaction) => {
              const PaymentIcon = paymentIcons[transaction.paymentMethod] || CreditCard;
              
              return (
                <div
                  key={transaction.id}
                  className={clsx(
                    'px-6 py-4 transition-colors',
                    onViewDetails && 'hover:bg-gray-50 cursor-pointer'
                  )}
                  onClick={() => onViewDetails?.(transaction)}
                >
                  <div className="flex items-center justify-between">
                    {/* Left: Icon, Customer, and Time */}
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {/* Payment Icon */}
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
                        <PaymentIcon className="h-5 w-5 text-primary-600" />
                      </div>

                      {/* Transaction Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {transaction.customer || 'Walk-in Customer'}
                          </p>
                          <Badge
                            variant={statusVariants[transaction.status]}
                            size="xs"
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {formatDateTime(transaction.date)} • ID: {transaction.id}
                        </p>
                      </div>
                    </div>

                    {/* Right: Amount */}
                    <div className="flex-shrink-0 text-right ml-4">
                      <p className="text-sm font-semibold text-gray-900">
                        {currency}{transaction.amount.toLocaleString()}
                      </p>
                      {transaction.items && (
                        <p className="text-xs text-gray-500">
                          {transaction.items} item{transaction.items !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardBody>
    </Card>
  );
};

RecentTransactions.displayName = 'RecentTransactions';

export default RecentTransactions;

/**
 * Example Usage:
 * 
 * import RecentTransactions from '@/components/dashboard/RecentTransactions';
 * 
 * // Sample data
 * const transactions = [
 *   {
 *     id: 'TXN-001',
 *     customer: 'John Doe',
 *     amount: 125.50,
 *     items: 3,
 *     paymentMethod: 'card',
 *     status: 'completed',
 *     date: '2025-10-21T10:30:00Z',
 *   },
 *   {
 *     id: 'TXN-002',
 *     customer: 'Jane Smith',
 *     amount: 89.99,
 *     items: 2,
 *     paymentMethod: 'cash',
 *     status: 'completed',
 *     date: '2025-10-21T09:15:00Z',
 *   },
 *   {
 *     id: 'TXN-003',
 *     customer: 'Walk-in Customer',
 *     amount: 45.00,
 *     items: 1,
 *     paymentMethod: 'mobile',
 *     status: 'pending',
 *     date: '2025-10-21T08:45:00Z',
 *   },
 * ];
 * 
 * // Basic usage
 * <RecentTransactions transactions={transactions} />
 * 
 * // With loading state
 * <RecentTransactions transactions={transactions} loading={isLoading} />
 * 
 * // With click handlers
 * <RecentTransactions
 *   transactions={transactions}
 *   onViewAll={() => navigate('/transactions')}
 *   onViewDetails={(transaction) => {
 *     navigate(`/transactions/${transaction.id}`);
 *   }}
 * />
 * 
 * // Custom max items
 * <RecentTransactions
 *   transactions={transactions}
 *   maxItems={5}
 * />
 * 
 * // Complete dashboard implementation
 * const Dashboard = () => {
 *   const [transactions, setTransactions] = useState([]);
 *   const [loading, setLoading] = useState(true);
 * 
 *   useEffect(() => {
 *     fetchTransactions();
 *   }, []);
 * 
 *   const fetchTransactions = async () => {
 *     setLoading(true);
 *     const data = await api.getRecentTransactions();
 *     setTransactions(data);
 *     setLoading(false);
 *   };
 * 
 *   return (
 *     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 *       <RecentTransactions
 *         transactions={transactions}
 *         loading={loading}
 *         onViewAll={() => navigate('/transactions')}
 *         onViewDetails={(txn) => navigate(`/transactions/${txn.id}`)}
 *       />
 *     </div>
 *   );
 * };
 */