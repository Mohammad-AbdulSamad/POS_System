// src/components/inventory/LowStockList.jsx
import Table from '../common/Table';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatCurrency } from '../../utils/formatters';
import { Package, AlertTriangle, Plus } from 'lucide-react';

/**
 * LowStockList Component
 * 
 * Displays products with low or out of stock
 * Prioritizes items that need attention
 */

const LowStockList = ({
  products = [],
  loading = false,
  onAdjustStock,
  onReorder,
  sortColumn = null,
  sortDirection = 'asc',
  onSort,
}) => {
  // Define columns
  const columns = [
    {
      key: 'priority',
      header: '',
      width: '50px',
      align: 'center',
      render: (_, row) => {
        const isOutOfStock = row.stock === 0;
        return isOutOfStock ? (
          <AlertTriangle className="h-5 w-5 text-danger-600" />
        ) : (
          <AlertTriangle className="h-5 w-5 text-warning-600" />
        );
      },
    },
    {
      key: 'imageUrl',
      header: 'Image',
      width: '70px',
      render: (value, row) => (
        <div className="h-12 w-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {value ? (
            <img
              src={value}
              alt={row.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package className="h-5 w-5 text-gray-400" />
          )}
        </div>
      ),
    },
    {
      key: 'sku',
      header: 'SKU',
      sortable: true,
      width: '120px',
      render: (value) => (
        <span className="font-mono text-sm">{value}</span>
      ),
    },
    {
      key: 'name',
      header: 'Product Name',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          {row.category && (
            <div className="text-xs text-gray-500">{row.category.name}</div>
          )}
        </div>
      ),
    },
    {
      key: 'stock',
      header: 'Current Stock',
      sortable: true,
      align: 'center',
      width: '120px',
      render: (value, row) => {
        const isOutOfStock = value === 0;
        return (
          <Badge variant={isOutOfStock ? 'danger' : 'warning'} size="sm">
            {value} {row.unit || 'pcs'}
          </Badge>
        );
      },
    },
    {
      key: 'minStock',
      header: 'Min Stock',
      sortable: true,
      align: 'center',
      width: '100px',
      render: (value, row) => (
        <span className="text-sm text-gray-600">
          {value || 0} {row.unit || 'pcs'}
        </span>
      ),
    },
    {
      key: 'reorderPoint',
      header: 'Reorder Point',
      sortable: true,
      align: 'center',
      width: '120px',
      render: (value, row) => (
        <span className="text-sm text-gray-600">
          {value || 0} {row.unit || 'pcs'}
        </span>
      ),
    },
    {
      key: 'priceGross',
      header: 'Price',
      sortable: true,
      align: 'right',
      width: '100px',
      render: (value) => (
        <span className="font-semibold">{formatCurrency(value)}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      width: '120px',
      render: (_, row) => {
        const isOutOfStock = row.stock === 0;
        const isCritical = row.stock <= (row.minStock || 0);

        return (
          <Badge variant={isOutOfStock ? 'danger' : isCritical ? 'warning' : 'gray'} size="sm">
            {isOutOfStock ? 'Out of Stock' : 'Low Stock'}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: '180px',
      render: (_, row) => (
        <div className="flex gap-1 justify-center">
          {onAdjustStock && (
            <Button
              variant="primary"
              size="sm"
              icon={Plus}
              onClick={(e) => {
                e.stopPropagation();
                onAdjustStock(row);
              }}
            >
              Add Stock
            </Button>
          )}
          {onReorder && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onReorder(row);
              }}
            >
              Reorder
            </Button>
          )}
        </div>
      ),
    },
  ];

  // Calculate statistics
  const outOfStockCount = products.filter(p => p.stock === 0).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= (p.minStock || 0)).length;

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-danger-600 rounded-lg p-3">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-danger-900">
                {outOfStockCount}
              </div>
              <div className="text-sm text-danger-700">Out of Stock</div>
            </div>
          </div>
        </div>

        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-warning-600 rounded-lg p-3">
              <AlertTriangle className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-warning-900">
                {lowStockCount}
              </div>
              <div className="text-sm text-warning-700">Low Stock</div>
            </div>
          </div>
        </div>

        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary-600 rounded-lg p-3">
              <Package className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-primary-900">
                {products.length}
              </div>
              <div className="text-sm text-primary-700">Total Items</div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <Table
        columns={columns}
        data={products}
        loading={loading}
        sortable
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={onSort}
        hover
        emptyMessage="No low stock products. All inventory levels are healthy!"
      />
    </div>
  );
};

export default LowStockList;