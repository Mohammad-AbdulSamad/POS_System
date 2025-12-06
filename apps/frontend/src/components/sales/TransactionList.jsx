// src/components/sales/TransactionList.jsx
import Table from '../common/Table';
import Badge from '../common/Badge';
import Button from '../common/Button';
import SearchBar from '../common/SearchBar';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { CURRENCY_SYMBOL } from '../../config/constants';
import { Eye, Receipt, RotateCcw, DollarSign } from 'lucide-react';

/**
 * TransactionList Component
 * 
 * Displays list of transactions in table format
 * Supports sorting, searching, and actions
 */

const TransactionList = ({
  transactions = [],
  loading = false,
  onView,
  onPrintReceipt,
  onReturn,
  sortColumn = null,
  sortDirection = 'asc',
  onSort,
  searchQuery = '',
  onSearchChange,
  onSearch,
  showActions = true,
}) => {
  // Define table columns
  const columns = [
    {
      key: 'receiptNumber',
      header: 'Receipt #',
      sortable: true,
      width: '150px',
      render: (value) => (
        <span className="font-mono text-sm font-semibold text-primary-600">
          {value}
        </span>
      ),
    },
    {
      key: 'timestamp',
      header: 'Date & Time',
      sortable: true,
      width: '180px',
      render: (value) => (
        <div className="text-sm">
          <div className="font-medium text-gray-900">
            {new Date(value).toLocaleDateString()}
          </div>
          <div className="text-gray-500">
            {new Date(value).toLocaleTimeString()}
          </div>
        </div>
      ),
    },
    {
      key: 'customer',
      header: 'Customer',
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          {value ? (
            <>
              <div className="font-medium text-gray-900">{value.name}</div>
              {value.phone && (
                <div className="text-gray-500">{value.phone}</div>
              )}
            </>
          ) : (
            <span className="text-gray-400 italic">Walk-in Customer</span>
          )}
        </div>
      ),
    },
    {
      key: 'cashier',
      header: 'Cashier',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-900">
          {value?.name || 'Unknown'}
        </span>
      ),
    },
    {
      key: 'items_count',
      header: 'Items',
      sortable: true,
      align: 'center',
      width: '80px',
      render: (value) => (
        <Badge variant="gray" size="sm">
          {value || 0}
        </Badge>
      ),
    },
    {
      key: 'payment',
      header: 'Payment',
      align: 'center',
      width: '100px',
      render: (value) => {
        const methodColors = {
          CASH: 'success',
          CARD: 'primary',
          MOBILE: 'warning',
        };
        return (
          <Badge variant={methodColors[value?.method] || 'gray'} size="sm">
            {value?.method || 'N/A'}
          </Badge>
        );
      },
    },
    {
      key: 'subtotal',
      header: 'Subtotal',
      sortable: true,
      align: 'right',
      width: '100px',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'discount',
      header: 'Discount',
      align: 'right',
      width: '100px',
      render: (value) => (
        <span className="text-sm text-warning-600">
          {value?.amount > 0 ? `-${formatCurrency(value.amount)}` : '-'}
        </span>
      ),
    },
    {
      key: 'tax',
      header: 'Tax',
      align: 'right',
      width: '100px',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {formatCurrency(value?.amount || 0)}
        </span>
      ),
    },
    {
      key: 'total',
      header: 'Total',
      sortable: true,
      align: 'right',
      width: '120px',
      render: (value) => (
        <span className="text-base font-bold text-gray-900">
          {formatCurrency(value)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      align: 'center',
      width: '100px',
      render: (value) => {
        const statusVariants = {
          COMPLETED: 'success',
          PENDING: 'warning',
          REFUNDED: 'danger',
          PARTIALLY_REFUNDED: 'warning',
        };
        return (
          <Badge variant={statusVariants[value] || 'gray'} size="sm">
          </Badge>
        );
      },
    },
  ];

  // Add actions column if needed
  if (showActions) {
    columns.push({
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: '180px',
      render: (_, row) => (
        <div className="flex gap-1 justify-center">
          {onView && (
            <Button
              variant="ghost"
              size="sm"
              icon={Eye}
              onClick={(e) => {
                e.stopPropagation();
                onView(row);
              }}
              title="View Details"
            />
          )}
          {onPrintReceipt && (
            <Button
              variant="ghost"
              size="sm"
              icon={Receipt}
              onClick={(e) => {
                e.stopPropagation();
                onPrintReceipt(row);
              }}
              title="Print Receipt"
            />
          )}
          {onReturn && row.status === 'COMPLETED' && (
            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              onClick={(e) => {
                e.stopPropagation();
                onReturn(row);
              }}
              title="Process Return"
              className="text-warning-600 hover:text-warning-700"
            />
          )}
        </div>
      ),
    });
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      {onSearch && (
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onDebouncedChange={onSearch}
              placeholder="Search by receipt number, customer name, or ID..."
              debounce={500}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <Table
        columns={columns}
        data={transactions}
        loading={loading}
        sortable
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={onSort}
        hover
        emptyMessage="No transactions found. Complete a sale to see it here."
        onRowClick={onView}
      />
    </div>
  );
};

export default TransactionList;