// src/components/inventory/CategoryList.jsx
import Table from '../common/Table';
import Badge from '../common/Badge';
import Button from '../common/Button';
import { Edit, Trash2, Package } from 'lucide-react';

/**
 * CategoryList Component
 * 
 * Displays a table of product categories
 */

const CategoryList = ({
  categories = [],
  loading = false,
  onEdit,
  onDelete,
  sortColumn = null,
  sortDirection = 'asc',
  onSort,
}) => {
  const columns = [
    {
      key: 'name',
      header: 'Category Name',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-900">{value}</span>
      ),
    },
    {
      key: 'branch',
      header: 'Branch',
      sortable: true,
      render: (value) => (
        <span className="text-gray-600">{value?.name || 'N/A'}</span>
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
          {value?.products || 0} products
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      width: '180px',
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
      data={categories}
      loading={loading}
      sortable
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      onSort={onSort}
      hover
      emptyMessage="No categories found. Create your first category to organize products."
    />
  );
};

export default CategoryList;