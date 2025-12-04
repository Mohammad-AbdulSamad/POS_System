// src/components/sales/TransactionDetails.jsx
import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../common/Tabs';
import Card, { CardBody } from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import Table from '../common/Table';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { CURRENCY_SYMBOL } from '../../config/constants';
import { 
  Receipt, 
  User, 
  CreditCard, 
  Package,
  Calendar,
  DollarSign,
  Gift,
  AlertCircle,
  CheckCircle,
  RotateCcw
} from 'lucide-react';

/**
 * TransactionDetails Component
 * 
 * Comprehensive transaction details view with tabs
 * Shows: Details, Items, Payment Info, Customer Info
 */

const TransactionDetails = ({
  transaction,
  loading = false,
  onPrintReceipt,
  onProcessReturn,
  onRefund,
}) => {
  const [activeTab, setActiveTab] = useState('details');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!transaction) {
    return (
      <div className="text-center py-12 text-gray-500">
        Transaction not found
      </div>
    );
  }

  const {
    receiptNumber,
    timestamp,
    items = [],
    customer,
    cashier,
    subtotal,
    discount,
    tax,
    total,
    payment,
    payments = [],
    status,
    branch,
    loyaltyPointsEarned,
    loyaltyPointsUsed,
    returns = [],
    refundedAmount,
  } = transaction;

  // Status badge variant
  const statusVariants = {
    COMPLETED: 'success',
    PENDING: 'warning',
    REFUNDED: 'danger',
    PARTIALLY_REFUNDED: 'warning',
  };

  // Items table columns
  const itemsColumns = [
    {
      key: 'name',
      header: 'Product',
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          {row.sku && (
            <div className="text-xs text-gray-500 font-mono">{row.sku}</div>
          )}
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty',
      align: 'center',
      width: '80px',
    },
    {
      key: 'price',
      header: 'Unit Price',
      align: 'right',
      width: '100px',
      render: (value) => formatCurrency(value),
    },
    {
      key: 'discount',
      header: 'Discount',
      align: 'right',
      width: '100px',
      render: (value) => value > 0 ? `-${formatCurrency(value)}` : '-',
    },
    {
      key: 'taxAmount',
      header: 'Tax',
      align: 'right',
      width: '100px',
      render: (value) => formatCurrency(value || 0),
    },
    {
      key: 'total',
      header: 'Total',
      align: 'right',
      width: '120px',
      render: (value) => (
        <span className="font-semibold">{formatCurrency(value)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="space-y-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {receiptNumber}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              {formatDateTime(timestamp)}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={statusVariants[status] || 'gray'} size="lg">
              {status?.replace(/_/g, ' ')}
            </Badge>
            {branch && (
              <Badge variant="primary">
                {branch.name}
              </Badge>
            )}
          </div>

          {refundedAmount > 0 && (
            <div className="flex items-center gap-2 text-warning-600 text-sm font-medium">
              <AlertCircle className="h-4 w-4" />
              <span>Refunded: {formatCurrency(refundedAmount)}</span>
            </div>
          )}
        </div>


      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Overview</TabsTrigger>
          <TabsTrigger value="items" badge={items.length}>Items</TabsTrigger>
          <TabsTrigger value="payment">Payment</TabsTrigger>
          {customer && <TabsTrigger value="customer">Customer</TabsTrigger>}
          {returns.length > 0 && (
            <TabsTrigger value="returns" badge={returns.length}>
              Returns
            </TabsTrigger>
          )}
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Transaction Summary */}
            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Transaction Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Receipt Number</span>
                    <span className="font-mono font-semibold text-primary-600">
                      {receiptNumber}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Date & Time</span>
                    <span className="text-sm text-gray-900">
                      {formatDateTime(timestamp)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Status</span>
                    <Badge variant={statusVariants[status] || 'gray'}>
                      {status?.replace(/_/g, ' ')}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Items Count</span>
                    <span className="text-gray-900 font-medium">
                      {items.length}
                    </span>
                  </div>
                  {branch && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Branch</span>
                      <span className="text-gray-900">{branch.name}</span>
                    </div>
                  )}
                  {cashier && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Cashier</span>
                      <span className="text-gray-900">{cashier.name}</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Financial Summary */}
            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Financial Summary
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="text-lg font-semibold text-gray-900">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                  
                  {discount && discount.amount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">
                        Discount {discount.type && `(${discount.type})`}
                      </span>
                      <span className="text-lg font-semibold text-warning-600">
                        -{formatCurrency(discount.amount)}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">
                      Tax ({tax?.rate || 17}%)
                    </span>
                    <span className="text-lg font-semibold text-gray-700">
                      {formatCurrency(tax?.amount || 0)}
                    </span>
                  </div>
                  
                  <div className="pt-3 border-t-2 border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-900">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-success-600">
                        {formatCurrency(total)}
                      </span>
                    </div>
                  </div>

                  {refundedAmount > 0 && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Refunded</span>
                      <span className="text-lg font-semibold text-danger-600">
                        -{formatCurrency(refundedAmount)}
                      </span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Loyalty Points */}
            {(loyaltyPointsEarned > 0 || loyaltyPointsUsed > 0) && (
              <Card className="md:col-span-2">
                <CardBody>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Loyalty Points
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    {loyaltyPointsEarned > 0 && (
                      <div className="bg-success-50 border border-success-200 rounded-lg p-4">
                        <div className="text-sm text-success-700 mb-1">
                          Points Earned
                        </div>
                        <div className="text-2xl font-bold text-success-900">
                          +{loyaltyPointsEarned}
                        </div>
                      </div>
                    )}
                    {loyaltyPointsUsed > 0 && (
                      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                        <div className="text-sm text-primary-700 mb-1">
                          Points Used
                        </div>
                        <div className="text-2xl font-bold text-primary-900">
                          -{loyaltyPointsUsed}
                        </div>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Items Tab */}
        <TabsContent value="items">
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Transaction Items
              </h3>
              <Table
                columns={itemsColumns}
                data={items}
                emptyMessage="No items in this transaction"
              />
            </CardBody>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment">
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Information
              </h3>
              <div className="space-y-4">
                {payment && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          Payment Method
                        </div>
                        <Badge variant="primary" size="lg">
                          {payment.method}
                        </Badge>
                      </div>
                      <div>
                        <div className="text-sm text-gray-600 mb-1">
                          Amount Paid
                        </div>
                        <div className="text-xl font-bold text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                      </div>
                      {payment.change > 0 && (
                        <div className="col-span-2">
                          <div className="text-sm text-gray-600 mb-1">
                            Change Given
                          </div>
                          <div className="text-xl font-bold text-success-600">
                            {formatCurrency(payment.change)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {payments.length > 1 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">
                      All Payments
                    </h4>
                    <div className="space-y-2">
                      {payments.map((p, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <Badge variant="gray">{p.method}</Badge>
                            <span className="text-sm text-gray-600">
                              {formatDateTime(p.createdAt)}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(p.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardBody>
          </Card>
        </TabsContent>

        {/* Customer Tab */}
        {customer && (
          <TabsContent value="customer">
            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Name</span>
                    <span className="text-gray-900 font-medium">
                      {customer.name}
                    </span>
                  </div>
                  {customer.phone && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Phone</span>
                      <span className="text-gray-900">{customer.phone}</span>
                    </div>
                  )}
                  {customer.email && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Email</span>
                      <span className="text-gray-900">{customer.email}</span>
                    </div>
                  )}
                  {customer.loyaltyNumber && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Loyalty Number</span>
                      <span className="font-mono text-gray-900">
                        {customer.loyaltyNumber}
                      </span>
                    </div>
                  )}
                  {customer.loyaltyPoints !== undefined && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Current Points</span>
                      <Badge variant="primary" size="lg">
                        {customer.loyaltyPoints} points
                      </Badge>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </TabsContent>
        )}

        {/* Returns Tab */}
        {returns.length > 0 && (
          <TabsContent value="returns">
            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Return History
                </h3>
                <div className="text-center py-8 text-gray-500">
                  Returns information will be displayed here
                </div>
              </CardBody>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default TransactionDetails;