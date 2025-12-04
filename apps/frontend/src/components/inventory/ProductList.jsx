// src/components/inventory/ProductList.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Table from '../common/Table';
import Badge from '../common/Badge';
import Button from '../common/Button';
import SearchBar from '../common/SearchBar';
import { CURRENCY_SYMBOL } from '../../config/constants';
import { Edit, Trash2, Eye, Package } from 'lucide-react';
import clsx from 'clsx';

const ProductList = ({
  products = [],
  loading = false,
  onEdit,
  onDelete,
  onView,
  onAdjustStock,
  sortColumn = null,
  sortDirection = 'asc',
  onSort,
  searchQuery = '',
  onSearchChange,  // NEW: for immediate updates
  onSearch,        // for debounced search
  selectedRows = [],
  onSelectRow,
  onSelectAll,
  showActions = true,
}) => {
  const navigate = useNavigate();
  const [localSearchQuery, setLocalSearchQuery] = useState(searchQuery);

  // Define table columns
  const columns = [
    {
      key: 'imageUrl',
      header: 'Image',
      width: '80px',
      render: (value, row) => (
        <div className="h-12 w-12 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {value ? (
            <img
              src={value}
              alt={row.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <Package className="h-6 w-6 text-gray-400" />
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
        <span className="font-mono text-sm text-gray-900">{value}</span>
      ),
    },
    {
      key: 'name',
      header: 'Product Name',
      sortable: true,
      render: (value, row) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          {row.barcode && (
            <div className="text-xs text-gray-500 font-mono">{row.barcode}</div>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value?.name || 'Uncategorized'}
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
        <span className="font-semibold text-gray-900">
          {CURRENCY_SYMBOL}{value}
        </span>
      ),
    },
    {
      key: 'cost',
      header: 'Cost',
      sortable: true,
      align: 'right',
      width: '100px',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {CURRENCY_SYMBOL}{value}
        </span>
      ),
    },
    {
      key: 'stock',
      header: 'Stock',
      sortable: true,
      align: 'center',
      width: '100px',
      render: (value, row) => {
        const isLowStock = value <= (row.minStock || 0);
        const isOutOfStock = value === 0;

        return (
          <Badge
            variant={isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success'}
            size="sm"
          >
            {value} {row.unit || 'pcs'}
          </Badge>
        );
      },
    },
    {
      key: 'active',
      header: 'Status',
      sortable: true,
      align: 'center',
      width: '100px',
      render: (value) => (
        <Badge variant={value ? 'success' : 'gray'} size="sm">
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
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
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              icon={Edit}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row);
              }}
              title="Edit Product"
            />
          )}
          {onAdjustStock && (
            <Button
              variant="ghost"
              size="sm"
              icon={Package}
              onClick={(e) => {
                e.stopPropagation();
                onAdjustStock(row);
              }}
              title="Adjust Stock"
            />
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              icon={Trash2}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(row);
              }}
              className="text-danger-600 hover:text-danger-700"
              title="Delete Product"
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
  onChange={(e) => onSearchChange(e.target.value)}// No-op, we don't need immediate updates here
  onDebouncedChange={onSearch}
  placeholder="Search products by name, SKU, or barcode..."
  debounce={500}
  autoFocus
/>
          </div>
        </div>
      )}

      {/* Products Table */}
      <Table
        columns={columns}
        data={products}
        loading={loading}
        sortable
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={onSort}
        selectable={!!onSelectRow}
        selectedRows={selectedRows}
        onSelectRow={onSelectRow}
        onSelectAll={onSelectAll}
        hover
        emptyMessage="No products found. Add your first product to get started."
        //onRowClick={onView}
      />
    </div>
  );
};

export default ProductList;