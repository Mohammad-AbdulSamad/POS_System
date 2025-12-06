// src/components/users/UserList.jsx
import Table from '../common/Table';
import Badge from '../common/Badge';
import Button from '../common/Button';
import SearchBar from '../common/SearchBar';
import { formatDateTime } from '../../utils/formatters';
import { Eye, Edit, Trash2, KeyRound, User } from 'lucide-react';

/**
 * UserList Component
 * 
 * Displays list of users/employees in table format
 */

const UserList = ({
  users = [],
  loading = false,
  onView,
  onEdit,
  onDelete,
  onResetPassword,
  sortColumn = null,
  sortDirection = 'asc',
  onSort,
  searchQuery = '',
  onSearchChange,
  onSearch,
  showActions = true,
}) => {
  // Role color mapping
  const getRoleBadgeVariant = (role) => {
    switch (role) {
      case 'ADMIN':
        return 'danger';
      case 'MANAGER':
        return 'primary';
      case 'CASHIER':
        return 'success';
      case 'STOCK_MANAGER':
        return 'warning';
      default:
        return 'gray';
    }
  };

  // Define table columns
  const columns = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
            <User className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <div className="font-medium text-gray-900">{value || 'N/A'}</div>
            <div className="text-sm text-gray-500">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'Phone',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value || '-'}
        </span>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      align: 'center',
      width: '120px',
      render: (value) => (
        <Badge variant={getRoleBadgeVariant(value)} size="sm">
          {value?.replace(/_/g, ' ')}
        </Badge>
      ),
    },
    {
      key: 'branch',
      header: 'Branch',
      sortable: true,
      render: (value) => (
        <div className="text-sm">
          {value ? (
            <>
              <div className="font-medium text-gray-900">{value.name}</div>
              <div className="text-gray-500">{value.address}</div>
            </>
          ) : (
            <span className="text-gray-400 italic">No Branch</span>
          )}
        </div>
      ),
    },
    {
      key: '_count',
      header: 'Transactions',
      align: 'center',
      width: '120px',
      render: (value) => (
        <Badge variant="gray" size="sm">
          {value?.transactions || 0}
        </Badge>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      width: '150px',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {formatDateTime(value)}
        </span>
      ),
    },
  ];

  // Add actions column if needed
  if (showActions) {
    columns.push({
      key: 'actions',
      header: 'Actions',
      align: 'center',
      width: '200px',
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
              title="Edit User"
            />
          )}
          {onResetPassword && (
            <Button
              variant="ghost"
              size="sm"
              icon={KeyRound}
              onClick={(e) => {
                e.stopPropagation();
                onResetPassword(row);
              }}
              title="Reset Password"
              className="text-warning-600 hover:text-warning-700"
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
              title="Delete User"
              className="text-danger-600 hover:text-danger-700"
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
              placeholder="Search by name, email, or phone..."
              debounce={500}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Users Table */}
      <Table
        columns={columns}
        data={users}
        loading={loading}
        sortable
        sortColumn={sortColumn}
        sortDirection={sortDirection}
        onSort={onSort}
        hover
        emptyMessage="No users found. Add your first employee to get started."
        onRowClick={onView}
      />
    </div>
  );
};

export default UserList;