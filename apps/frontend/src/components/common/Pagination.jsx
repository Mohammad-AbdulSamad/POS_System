// src/components/common/Pagination.jsx
import { forwardRef } from 'react';
import clsx from 'clsx';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

/**
 * Pagination Component
 * 
 * A reusable pagination component with page navigation and page size selector.
 * Uses Tailwind CSS and custom theme variables from index.css
 * 
 * @example
 * <Pagination
 *   currentPage={page}
 *   totalPages={totalPages}
 *   onPageChange={setPage}
 * />
 */

const Pagination = forwardRef(
  (
    {
      currentPage = 1,
      totalPages = 1,
      totalItems = 0,
      pageSize = 20,
      pageSizeOptions = [10, 20, 50, 100],
      onPageChange,
      onPageSizeChange,
      showPageSize = true,
      showTotal = true,
      showFirstLast = true,
      maxPages = 7,
      className = '',
      ...props
    },
    ref
  ) => {
    // Calculate pagination range
    const getPageRange = () => {
      const pages = [];
      const half = Math.floor(maxPages / 2);
      let start = Math.max(currentPage - half, 1);
      let end = Math.min(start + maxPages - 1, totalPages);

      if (end - start < maxPages - 1) {
        start = Math.max(end - maxPages + 1, 1);
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      return pages;
    };

    const pages = getPageRange();
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const handlePageChange = (page) => {
      if (page >= 1 && page <= totalPages && page !== currentPage) {
        onPageChange(page);
      }
    };

    const handlePageSizeChange = (e) => {
      const newSize = parseInt(e.target.value);
      if (onPageSizeChange) {
        onPageSizeChange(newSize);
      }
    };

    // Button component
    const PageButton = ({ 
      children, 
      active = false, 
      disabled = false, 
      onClick,
      ariaLabel 
    }) => (
      <button
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={clsx(
          'px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200',
          'border border-gray-300',
          'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
          {
            'bg-primary-500 text-white border-primary-500': active,
            'bg-white text-gray-700 hover:bg-gray-50': !active && !disabled,
            'bg-gray-100 text-gray-400 cursor-not-allowed': disabled,
          }
        )}
      >
        {children}
      </button>
    );

    return (
      <div
        ref={ref}
        className={clsx(
          'flex flex-col sm:flex-row items-center justify-between gap-4',
          className
        )}
        {...props}
      >
        {/* Left Side - Page Size Selector and Total */}
        <div className="flex items-center gap-4 order-2 sm:order-1">
          {showPageSize && onPageSizeChange && (
            <div className="flex items-center gap-2">
              <label htmlFor="page-size" className="text-sm text-gray-700">
                Show:
              </label>
              <select
                id="page-size"
                value={pageSize}
                onChange={handlePageSizeChange}
                className="input-field px-3 py-1.5 text-sm w-20"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
          )}

          {showTotal && totalItems > 0 && (
            <p className="text-sm text-gray-700">
              Showing <span className="font-medium">{startItem}</span> to{' '}
              <span className="font-medium">{endItem}</span> of{' '}
              <span className="font-medium">{totalItems}</span> results
            </p>
          )}
        </div>

        {/* Right Side - Page Navigation */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2 order-1 sm:order-2">
            {/* First Page */}
            {showFirstLast && (
              <PageButton
                onClick={() => handlePageChange(1)}
                disabled={currentPage === 1}
                ariaLabel="Go to first page"
              >
                <ChevronsLeft className="h-4 w-4" />
              </PageButton>
            )}

            {/* Previous Page */}
            <PageButton
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              ariaLabel="Go to previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </PageButton>

            {/* Page Numbers */}
            {pages.map((page) => (
              <PageButton
                key={page}
                active={page === currentPage}
                onClick={() => handlePageChange(page)}
                ariaLabel={`Go to page ${page}`}
              >
                {page}
              </PageButton>
            ))}

            {/* Next Page */}
            <PageButton
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              ariaLabel="Go to next page"
            >
              <ChevronRight className="h-4 w-4" />
            </PageButton>

            {/* Last Page */}
            {showFirstLast && (
              <PageButton
                onClick={() => handlePageChange(totalPages)}
                disabled={currentPage === totalPages}
                ariaLabel="Go to last page"
              >
                <ChevronsRight className="h-4 w-4" />
              </PageButton>
            )}
          </div>
        )}
      </div>
    );
  }
);

Pagination.displayName = 'Pagination';

export default Pagination;

/**
 * Example Usage:
 * 
 * import Pagination from '@/components/common/Pagination';
 * import { useState } from 'react';
 * 
 * // Basic Pagination
 * const [currentPage, setCurrentPage] = useState(1);
 * const [pageSize, setPageSize] = useState(20);
 * const totalItems = 150;
 * const totalPages = Math.ceil(totalItems / pageSize);
 * 
 * <Pagination
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   totalItems={totalItems}
 *   pageSize={pageSize}
 *   onPageChange={setCurrentPage}
 *   onPageSizeChange={(newSize) => {
 *     setPageSize(newSize);
 *     setCurrentPage(1); // Reset to first page
 *   }}
 * />
 * 
 * // With React Query
 * import { useQuery } from '@tanstack/react-query';
 * 
 * const [page, setPage] = useState(1);
 * const [limit, setLimit] = useState(20);
 * 
 * const { data, isLoading } = useQuery({
 *   queryKey: ['products', page, limit],
 *   queryFn: () => fetchProducts({ page, limit }),
 * });
 * 
 * <Pagination
 *   currentPage={page}
 *   totalPages={data?.pagination.pages}
 *   totalItems={data?.pagination.total}
 *   pageSize={limit}
 *   onPageChange={setPage}
 *   onPageSizeChange={(newLimit) => {
 *     setLimit(newLimit);
 *     setPage(1);
 *   }}
 * />
 * 
 * // Simple Pagination (without page size)
 * <Pagination
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   onPageChange={setCurrentPage}
 *   showPageSize={false}
 * />
 * 
 * // Pagination without First/Last buttons
 * <Pagination
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   onPageChange={setCurrentPage}
 *   showFirstLast={false}
 * />
 * 
 * // Custom page size options
 * <Pagination
 *   currentPage={currentPage}
 *   totalPages={totalPages}
 *   pageSize={pageSize}
 *   pageSizeOptions={[5, 10, 25, 50]}
 *   onPageChange={setCurrentPage}
 *   onPageSizeChange={setPageSize}
 * />
 * 
 * // Full Example with Table
 * import Table from '@/components/common/Table';
 * 
 * const ProductsPage = () => {
 *   const [page, setPage] = useState(1);
 *   const [limit, setLimit] = useState(20);
 *   const [sortColumn, setSortColumn] = useState('name');
 *   const [sortDirection, setSortDirection] = useState('asc');
 * 
 *   const { data, isLoading } = useQuery({
 *     queryKey: ['products', page, limit, sortColumn, sortDirection],
 *     queryFn: () => fetchProducts({ 
 *       page, 
 *       limit, 
 *       sortBy: sortColumn, 
 *       sortOrder: sortDirection 
 *     }),
 *   });
 * 
 *   return (
 *     <div>
 *       <Table
 *         columns={columns}
 *         data={data?.products || []}
 *         loading={isLoading}
 *         sortable
 *         sortColumn={sortColumn}
 *         sortDirection={sortDirection}
 *         onSort={(column, direction) => {
 *           setSortColumn(column);
 *           setSortDirection(direction);
 *         }}
 *       />
 *       
 *       <div className="mt-6">
 *         <Pagination
 *           currentPage={page}
 *           totalPages={data?.pagination.pages || 1}
 *           totalItems={data?.pagination.total || 0}
 *           pageSize={limit}
 *           onPageChange={setPage}
 *           onPageSizeChange={(newLimit) => {
 *             setLimit(newLimit);
 *             setPage(1);
 *           }}
 *         />
 *       </div>
 *     </div>
 *   );
 * };
 * 
 * // Mobile Responsive Layout
 * <div className="space-y-4">
 *   <Table columns={columns} data={data} />
 *   
//  *   {/* Pagination automatically adjusts for mobile */
//  *   <Pagination
//  *     currentPage={page}
//  *     totalPages={totalPages}
//  *     totalItems={totalItems}
//  *     onPageChange={setPage}
//  *   />
//  * </div>
//  */ 
