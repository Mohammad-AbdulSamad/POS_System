// src/pages/inventory/CategoriesPage.jsx - OPTIMIZED VERSION
import { useState, useCallback } from 'react';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import CategoryList from '../../components/inventory/CategoryList';
import CategoryForm from '../../components/inventory/CategoryForm';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import { useCategories } from '../../hooks/useCategories';
import { useBranches } from '../../hooks/useBranches';
import { useAuth } from '../../hooks/useAuth';
import { Plus, Tag } from 'lucide-react';

/** 
 * CategoriesPage - OPTIMIZED VERSION
 * 
 * Page for managing product categories
 * 
 * OPTIMIZATION CHANGES:
 * - Removed duplicate/conflicting useEffect calls
 * - Added pagination support
 * - Added search functionality with debouncing
 * - Fixed infinite loop issues
 * - Added proper callback memoization
 * 
 * API CALL STRATEGY:
 * - Mount: 1 call (from useCategories hook)
 * - Search: 1 call (debounced 500ms)
 * - Sort: 1 call (server-side)
 * - Pagination: 1 call per page change
 */

const CategoriesPage = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const {
    categories,
    loading,
    pagination,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchCategories,
  } = useCategories();

  // ✅ REMOVED: All duplicate useEffect calls - handled by useCategories hook


  const { user } = useAuth();
  // Mock branches - replace with actual hook/context
// ✅ NEW: Fetch branches (only for admin/manager)
  const { branches, loading: branchesLoading, canFetchBranches } = useBranches();

  
  // ✅ Determine available branches based on role
  const availableBranches = canFetchBranches 
    ? branches // Admin/Manager sees all branches
    : user?.branch ? [user.branch] : []; // Cashier sees only their branch


  /**
   * Handle debounced search
   * ✅ OPTIMIZED: Added search functionality
   */
  const handleDebouncedSearch = useCallback((debouncedQuery) => {
    console.log('Debounced search for:', debouncedQuery);
    setCurrentPage(1); // Reset to first page on search
    fetchCategories({ 
      search: debouncedQuery, 
      page: 1, 
      limit: pageSize,
      sortBy: sortColumn,
      sortOrder: sortDirection
    });
  }, [fetchCategories, pageSize, sortColumn, sortDirection]);

  /**
   * Handle sort - SERVER SIDE
   */
  const handleSort = useCallback((column, direction) => {
    setSortColumn(column);
    setSortDirection(direction);
    fetchCategories({ 
      sortBy: column, 
      sortOrder: direction,
      page: currentPage,
      limit: pageSize,
      search: searchQuery
    });
  }, [fetchCategories, currentPage, pageSize, searchQuery]);

  /**
   * Handle pagination - SERVER SIDE
   */
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    fetchCategories({ 
      page: newPage, 
      limit: pageSize,
      search: searchQuery,
      sortBy: sortColumn,
      sortOrder: sortDirection
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchCategories, pageSize, searchQuery, sortColumn, sortDirection]);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchCategories({ 
      page: 1, 
      limit: newSize,
      search: searchQuery,
      sortBy: sortColumn,
      sortOrder: sortDirection
    });
  }, [fetchCategories, searchQuery, sortColumn, sortDirection]);

  const handleAdd = useCallback(() => {
    setSelectedCategory(null);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((category) => {
    setSelectedCategory(category);
    setFormOpen(true);
  }, []);

  const handleDelete = useCallback((category) => {
    setSelectedCategory(category);
    setDeleteConfirmOpen(true);
  }, []);

  const handleFormSubmit = useCallback(async (data) => {
    try {
      if (selectedCategory) {
        await updateCategory(selectedCategory.id, data);
      } else {
        await createCategory(data);
      }
      setFormOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Form submission failed:', error);
    }
  }, [selectedCategory, updateCategory, createCategory]);

  const confirmDelete = useCallback(async () => {
    try {
      await deleteCategory(selectedCategory.id);
      setDeleteConfirmOpen(false);
      setSelectedCategory(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }, [deleteCategory, selectedCategory]);

  return (
    <MainLayout
      currentPath="/inventory/categories"
      user={{ name: 'John Doe', role: 'Manager', avatar: 'JD' }}
    >
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Inventory', href: '/inventory' },
            { label: 'Categories' },
          ]}
        />

        {/* Page Header */}
        <PageHeader
          title="Categories"
          description="Organize your products into categories"
          badge={pagination?.total ? `${pagination.total} categories` : `${categories.length} categories`}
          actions={
            <Button
              variant="primary"
              icon={Plus}
              onClick={handleAdd}
            >
              Add Category
            </Button>
          }
        />

        {/* Categories List */}
        <Card>
          <CardBody>
            {categories.length === 0 && !loading && !searchQuery ? (
              <div className="text-center py-12">
                <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No categories yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Create your first category to organize your products
                </p>
                <Button
                  variant="primary"
                  icon={Plus}
                  onClick={handleAdd}
                >
                  Add Category
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
                    placeholder="Search categories by name..."
                    debounce={500}
                  />
                </div>

                {/* Category List */}
                <CategoryList
                  categories={categories}
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

      {/* Category Form Modal */}
      <CategoryForm
        isOpen={formOpen}
        onClose={() => {
          setFormOpen(false);
          setSelectedCategory(null);
        }}
        initialData={selectedCategory}
        branches={availableBranches}
        onSubmit={handleFormSubmit}
        loading={loading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSelectedCategory(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${selectedCategory?.name}"? Products in this category will become uncategorized.`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={loading}
      />
    </MainLayout>
  );
};

export default CategoriesPage;