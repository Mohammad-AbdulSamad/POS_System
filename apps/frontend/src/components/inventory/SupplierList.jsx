// src/components/inventory/SupplierList.jsx
import Table from '../common/Table';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { formatPhoneNumber } from '../../utils/formatters';
import { Edit, Trash2, Package, Phone, MapPin } from 'lucide-react';

/**
 * SupplierList Component
 * 
 * Displays a table of suppliers
 */

const SupplierList = ({
  suppliers = [],
  loading = false,
  onEdit,
  onDelete,
  onView,
  sortColumn = null,
  sortDirection = 'asc',
  onSort,
}) => {
  const columns = [
    {
      key: 'name',
      header: 'Supplier Name',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
      width: '180px',
      render: (value) => value ? (
        <div className="flex items-center gap-2 text-gray-600">
          <Phone className="h-4 w-4" />
          <span className="text-sm">{formatPhoneNumber(value)}</span>
        </div>
      ) : (
        <span className="text-gray-400 text-sm">No phone</span>
      ),
    },
    {
      key: 'address',
      header: 'Address',
      render: (value) => value ? (
        <div className="flex items-center gap-2 text-gray-600">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm truncate">{value}</span>
        </div>
      ) : (
        <span className="text-gray-400 text-sm">No address</span>
      ),
    },
    {
      key: '_count',
      header: 'Products',
      sortable: true,
      align: 'center',
      width: '150px',
      render: (value) => (
        <Badge variant="primary" size="sm">
          <Package className="h-3 w-3 mr-1" />
          {value?.products || 0}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Added',
      sortable: true,
      width: '150px',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: '150px',
      render: (_, row) => (
        <div className="flex gap-1 justify-center">
          {onEdit && (
            <Button
              variant="ghost"
              size="sm"
              icon={Edit}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(row);
              }}
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
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      data={suppliers}
      loading={loading}
      sortable
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      hover
      onRowClick={onView}
      emptyMessage="No suppliers found. Add suppliers to track your product sources."
    />
  );
};

export default SupplierList;