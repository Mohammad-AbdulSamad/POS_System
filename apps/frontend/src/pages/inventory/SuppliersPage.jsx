// src/pages/inventory/SuppliersPage.jsx - OPTIMIZED VERSION
import { useState, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import SupplierList from '../../components/inventory/SupplierList';
import SupplierForm from '../../components/inventory/SupplierForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import { useSuppliers } from '../../hooks/useSuppliers';
import { Plus, Truck } from 'lucide-react';

/**
 * SuppliersPage - OPTIMIZED VERSION
 * 
 * Page for managing suppliers
 * 
 * OPTIMIZATION CHANGES:
 * - Removed DUPLICATE useEffect calls (had 2 conflicting ones!)
 * - Added pagination support
 * - Added search functionality with debouncing
 * - Fixed infinite loop issues
 * - Added proper callback memoization
 * 
 * API CALL STRATEGY:
 * - Mount: 1 call (from useSuppliers hook)
 * - Search: 1 call (debounced 500ms)
 * - Sort: 1 call (server-side)
 * - Pagination: 1 call per page change
 */

const SuppliersPage = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const {
    suppliers,
    loading,
    pagination,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    fetchSuppliers,
  } = useSuppliers();

  // ✅ REMOVED: Both duplicate useEffect calls - handled by useSuppliers hook

  /**
   * Handle debounced search
   * ✅ OPTIMIZED: Added search functionality
   */
  const handleDebouncedSearch = useCallback((debouncedQuery) => {
    console.log('Debounced search for:', debouncedQuery);
    setCurrentPage(1); // Reset to first page on search
    fetchSuppliers({ 
      search: debouncedQuery, 
      page: 1, 
      limit: pageSize,
      sortBy: sortColumn,
      sortOrder: sortDirection
    });
  }, [fetchSuppliers, pageSize, sortColumn, sortDirection]);

  /**
   * Handle sort - SERVER SIDE
   */
  const handleSort = useCallback((column, direction) => {
    setSortColumn(column);
    setSortDirection(direction);
    fetchSuppliers({ 
      sortBy: column, 
      sortOrder: direction,
      page: currentPage,
      limit: pageSize,
      search: searchQuery
    });
  }, [fetchSuppliers, currentPage, pageSize, searchQuery]);

  /**
   * Handle pagination - SERVER SIDE
   */
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    fetchSuppliers({ 
      page: newPage, 
      limit: pageSize,
      search: searchQuery,
      sortBy: sortColumn,
      sortOrder: sortDirection
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchSuppliers, pageSize, searchQuery, sortColumn, sortDirection]);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchSuppliers({ 
      page: 1, 
      limit: newSize,
      search: searchQuery,
      sortBy: sortColumn,
      sortOrder: sortDirection
    });
  }, [fetchSuppliers, searchQuery, sortColumn, sortDirection]);

  const handleAdd = useCallback(() => {
    setSelectedSupplier(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((supplier) => {
    setSelectedSupplier(supplier);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((supplier) => {
    setSelectedSupplier(supplier);
    setDeleteConfirmOpen(true);
  }, []);

  const handleFormSubmit = useCallback(async (data) => {
    try {
      if (selectedSupplier) {
        await updateSupplier(selectedSupplier.id, data);
      } else {
        await createSupplier(data);
      }
      setFormOpen(false);
      setSelectedSupplier(null);
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  }, [selectedSupplier, updateSupplier, createSupplier]);

  const confirmDelete = useCallback(async () => {
    try {
      await deleteSupplier(selectedSupplier.id);
      setDeleteConfirmOpen(false);
      setSelectedSupplier(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }, [deleteSupplier, selectedSupplier]);

  return (
    <MainLayout
      currentPath="/inventory/suppliers"
      user={{ name: 'John Doe', role: 'Manager', avatar: 'JD' }}
    >
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Inventory', href: '/inventory' },
            { label: 'Suppliers' },
          ]}
        />

        {/* Page Header */}
        <PageHeader
          title="Suppliers"
          description="Manage your product suppliers and vendors"
          badge={pagination?.total ? `${pagination.total} suppliers` : `${suppliers.length} suppliers`}
          actions={
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleAdd}
            >
              Add Supplier
            </Button>
          }
        />

        {/* Suppliers List */}
        <Card>
          <CardBody>
            {suppliers.length === 0 && !loading && !searchQuery ? (
              <div className="text-center py-12">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No suppliers yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Add suppliers to track your product sources
                </p>
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={handleAdd}
                >
                  Add Supplier
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex items-center gap-4">
                  <SearchBar
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onDebouncedChange={handleDebouncedSearch}
                    placeholder="Search suppliers by name, phone, or address..."
                    debounce={500}
                  />
                </div>

                {/* Supplier List */}
                <SupplierList
                  suppliers={suppliers}
                  loading={loading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                />

                {/* Pagination */}
                {pagination && pagination.total > 0 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={currentPage}
                      totalPages={pagination.pages || 1}
                      totalItems={pagination.total || 0}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                      pageSizeOptions={[20, 50, 100, 200]}
                    />
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Supplier Form Modal */}
      <SupplierForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedSupplier(null);
        }}
        initialData={selectedSupplier}
        onSubmit={handleFormSubmit}
        loading={loading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSelectedSupplier(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Supplier"
        message={`Are you sure you want to delete "${selectedSupplier?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={loading}
      />
    </MainLayout>
  );
};

export default SuppliersPage;