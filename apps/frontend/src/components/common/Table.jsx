// src/components/common/Table.jsx
import { forwardRef } from 'react';
import clsx from 'clsx';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/**
 * Table Component
 * 
 * A reusable table component with sorting, selection, and custom rendering.
 * Uses Tailwind CSS and custom theme variables from index.css
 * 
 * @example
 * <Table
 *   columns={columns}
 *   data={data}
 *   onSort={handleSort}
 * />
 */

const Table = forwardRef(
  (
    {
      columns = [],
      data = [],
      sortable = false,
      sortColumn = null,
      sortDirection = 'asc',
      onSort,
      selectable = false,
      selectedRows = [],
      onSelectRow,
      onSelectAll,
      hover = true,
      striped = false,
      bordered = false,
      compact = false,
      loading = false,
      emptyMessage = 'No data available',
      className = '',
      onRowClick,
      ...props
    },
    ref
  ) => {
    const handleSort = (column) => {
      if (!sortable || !column.sortable || !onSort) return;
      
      const newDirection = 
        sortColumn === column.key && sortDirection === 'asc' ? 'desc' : 'asc';
      
      onSort(column.key, newDirection);
    };

    const handleSelectAll = (e) => {
      if (onSelectAll) {
        onSelectAll(e.target.checked);
      }
    };

    const handleSelectRow = (row) => {
      if (onSelectRow) {
        onSelectRow(row);
      }
    };

    const isAllSelected = 
      data.length > 0 && selectedRows.length === data.length;
    const isSomeSelected = 
      selectedRows.length > 0 && selectedRows.length < data.length;

    // Sort icon component
    const SortIcon = ({ column }) => {
      if (!column.sortable) return null;

      if (sortColumn === column.key) {
        return sortDirection === 'asc' ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        );
      }

      return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
    };

    return (
      <div className={clsx('table-container', className)} ref={ref} {...props}>
        <table className="min-w-full divide-y divide-gray-200">
          {/* Table Header */}
          <thead className="table-header">
            <tr>
              {selectable && (
                <th className="table-cell w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(input) => {
                      if (input) {
                        input.indeterminate = isSomeSelected;
                      }
                    }}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={clsx(
                    'table-cell',
                    {
                      'cursor-pointer select-none': column.sortable && sortable,
                      'text-left': column.align === 'left' || !column.align,
                      'text-center': column.align === 'center',
                      'text-right': column.align === 'right',
                      'py-2': compact,
                    }
                  )}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column)}
                >
                  <div className="flex items-center gap-2">
                    <span>{column.header}</span>
                    {sortable && <SortIcon column={column} />}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="table-cell text-center py-12"
                >
                  <div className="flex items-center justify-center gap-2">
                    <svg
                      className="animate-spin h-5 w-5 text-primary-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    <span className="text-gray-500">Loading...</span>
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="table-cell text-center py-12"
                >
                  <div className="text-gray-500">
                    <svg
                      className="mx-auto h-12 w-12 text-gray-400 mb-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                      />
                    </svg>
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => {
                const isSelected = selectedRows.some(
                  (selected) => selected.id === row.id
                );

                return (
                  <tr
                    key={row.id || rowIndex}
                    className={clsx(
                      'table-row',
                      {
                        'bg-gray-50': striped && rowIndex % 2 === 1,
                        'bg-primary-50': isSelected,
                        'cursor-pointer': onRowClick,
                        'py-2': compact,
                      }
                    )}
                    onClick={() => onRowClick && onRowClick(row)}
                  >
                    {selectable && (
                      <td className="table-cell w-12">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            handleSelectRow(row);
                          }}
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                      </td>
                    )}
                    {columns.map((column) => (
                      <td
                        key={column.key}
                        className={clsx(
                          'table-cell',
                          {
                            'text-left': column.align === 'left' || !column.align,
                            'text-center': column.align === 'center',
                            'text-right': column.align === 'right',
                            'py-2': compact,
                          }
                        )}
                      >
                        {column.render
                          ? column.render(row[column.key], row, rowIndex)
                          : row[column.key]}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    );
  }
);

Table.displayName = 'Table';

export default Table;

/**
 * Example Usage:
 * 
 * import Table from '@/components/common/Table';
 * import { useState } from 'react';
 * import Badge from '@/components/common/Badge';
 * 
 * // Define columns
 * const columns = [
 *   {
 *     key: 'id',
 *     header: 'ID',
 *     sortable: true,
 *     width: '80px',
 *   },
 *   {
 *     key: 'name',
 *     header: 'Product Name',
 *     sortable: true,
 *   },
 *   {
 *     key: 'sku',
 *     header: 'SKU',
 *     sortable: true,
 *   },
 *   {
 *     key: 'price',
 *     header: 'Price',
 *     sortable: true,
 *     align: 'right',
 *     render: (value) => `₪${value.toFixed(2)}`,
 *   },
 *   {
 *     key: 'stock',
 *     header: 'Stock',
 *     sortable: true,
 *     align: 'center',
 *     render: (value) => (
 *       <Badge variant={value > 10 ? 'success' : 'warning'}>
 *         {value}
 *       </Badge>
 *     ),
 *   },
 *   {
 *     key: 'status',
 *     header: 'Status',
 *     render: (value) => (
 *       <Badge variant={value ? 'success' : 'danger'}>
 *         {value ? 'Active' : 'Inactive'}
 *       </Badge>
 *     ),
 *   },
 *   {
 *     key: 'actions',
 *     header: 'Actions',
 *     align: 'center',
 *     render: (_, row) => (
 *       <div className="flex gap-2 justify-center">
 *         <Button size="sm" variant="ghost">Edit</Button>
 *         <Button size="sm" variant="ghost">Delete</Button>
 *       </div>
 *     ),
 *   },
 * ];
 * 
 * // Basic Table
 * const [products, setProducts] = useState([...]);
 * 
 * <Table
 *   columns={columns}
 *   data={products}
 * />
 * 
 * // Sortable Table
 * const [sortColumn, setSortColumn] = useState('name');
 * const [sortDirection, setSortDirection] = useState('asc');
 * 
 * const handleSort = (column, direction) => {
 *   setSortColumn(column);
 *   setSortDirection(direction);
 *   // Sort your data here
 * };
 * 
 * <Table
 *   columns={columns}
 *   data={products}
 *   sortable
 *   sortColumn={sortColumn}
 *   sortDirection={sortDirection}
 *   onSort={handleSort}
 * />
 * 
 * // Selectable Table
 * const [selectedRows, setSelectedRows] = useState([]);
 * 
 * const handleSelectRow = (row) => {
 *   setSelectedRows((prev) =>
 *     prev.some((r) => r.id === row.id)
 *       ? prev.filter((r) => r.id !== row.id)
 *       : [...prev, row]
 *   );
 * };
 * 
 * const handleSelectAll = (checked) => {
 *   setSelectedRows(checked ? products : []);
 * };
 * 
 * <Table
 *   columns={columns}
 *   data={products}
 *   selectable
 *   selectedRows={selectedRows}
 *   onSelectRow={handleSelectRow}
 *   onSelectAll={handleSelectAll}
 * />
 * 
 * // Clickable Rows
 * <Table
 *   columns={columns}
 *   data={products}
 *   onRowClick={(row) => navigate(`/products/${row.id}`)}
 * />
 * 
 * // Loading State
 * <Table
 *   columns={columns}
 *   data={products}
 *   loading={isLoading}
 * />
 * 
 * // Empty State
 * <Table
 *   columns={columns}
 *   data={[]}
 *   emptyMessage="No products found. Try adjusting your filters."
 * />
 * 
 * // Striped and Compact
 * <Table
 *   columns={columns}
 *   data={products}
 *   striped
 *   compact
 * />
 */