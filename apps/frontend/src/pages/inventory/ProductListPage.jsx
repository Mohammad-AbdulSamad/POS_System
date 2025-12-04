// src/pages/inventory/ProductsListPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import ProductList from '../../components/inventory/ProductList';
import ProductCard from '../../components/inventory/ProductCard';
import StockAdjustmentForm from '../../components/inventory/StockAdjustmentForm';
import BarcodeGenerator from '../../components/inventory/BarcodeGenerator';
import BulkImport from '../../components/inventory/BulkImport';
import Button from '../../components/common/Button';
import SearchBar from '../../components/common/SearchBar';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Pagination from '../../components/common/Pagination';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/common/Tabs';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useSuppliers } from '../../hooks/useSuppliers';
import { 
  Plus, 
  Upload, 
  Download, 
  Grid3x3, 
  List,
  Filter,
  Package,
  AlertTriangle
} from 'lucide-react';

/**
 * ProductsListPage - OPTIMIZED VERSION
 * 
 * Main products management page with list/grid view
 * Removed Low Stock tab - now accessible via dedicated button
 */

const ProductListPage = () => {
  const navigate = useNavigate();
  const [view, setView] = useState('list'); // 'list' or 'grid'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [sortColumn, setSortColumn] = useState('name');
  const [sortDirection, setSortDirection] = useState('asc');
  const [activeTab, setActiveTab] = useState('all');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Modals
  const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false);
  const [barcodeGeneratorOpen, setBarcodeGeneratorOpen] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Hooks
  const {
    products,
    loading,
    error,
    pagination,
    fetchProducts,
    deleteProduct,
    adjustStock,
    importProducts,
    exportProducts,
  } = useProducts();

  // Filter products by tab (CLIENT-SIDE - no API call)
  const filteredProducts = products.filter((product) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'active') return product.active;
    if (activeTab === 'inactive') return !product.active;
    return true;
  });

  /**
   * Handle debounced search
   */
  const handleDebouncedSearch = useCallback((debouncedQuery) => {
    console.log('Debounced search for:', debouncedQuery);
    setCurrentPage(1);
    fetchProducts({ 
      search: debouncedQuery, 
      page: 1, 
      limit: pageSize,
      sortBy: sortColumn,
      sortOrder: sortDirection
    });
  }, [fetchProducts, pageSize, sortColumn, sortDirection]);

  /**
   * Handle sort - SERVER SIDE
   */
  const handleSort = useCallback((column, direction) => {
    setSortColumn(column);
    setSortDirection(direction);
    fetchProducts({ 
      sortBy: column, 
      sortOrder: direction,
      page: currentPage,
      limit: pageSize,
      search: searchQuery 
    });
  }, [fetchProducts, currentPage, pageSize, searchQuery]);

  /**
   * Handle pagination - SERVER SIDE
   */
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    fetchProducts({ 
      page: newPage, 
      limit: pageSize,
      search: searchQuery,
      sortBy: sortColumn,
      sortOrder: sortDirection
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchProducts, pageSize, searchQuery, sortColumn, sortDirection]);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchProducts({ 
      page: 1, 
      limit: newSize,
      search: searchQuery,
      sortBy: sortColumn,
      sortOrder: sortDirection
    });
  }, [fetchProducts, searchQuery, sortColumn, sortDirection]);

  // Handle product actions
  const handleEdit = useCallback((product) => {
    navigate(`/inventory/products/${product.id}/edit`);
  }, [navigate]);

  const handleView = useCallback((product) => {
    navigate(`/inventory/products/${product.id}`);
  }, [navigate]);

  const handleDelete = useCallback((product) => {
    setSelectedProduct(product);
    setDeleteConfirmOpen(true);
  }, []);

  const confirmDelete = useCallback(async () => {
    try {
      await deleteProduct(selectedProduct.id);
      setDeleteConfirmOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Delete failed:', error);
    }
  }, [deleteProduct, selectedProduct]);

  const handleAdjustStock = useCallback((product) => {
    setSelectedProduct(product);
    setStockAdjustmentOpen(true);
  }, []);

  const handleStockAdjustmentSubmit = useCallback(async (adjustmentData) => {
    try {
      await adjustStock(adjustmentData.productId, adjustmentData);
      setStockAdjustmentOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Stock adjustment failed:', error);
    }
  }, [adjustStock]);

  const handleGenerateBarcode = useCallback((product) => {
    setSelectedProduct(product);
    setBarcodeGeneratorOpen(true);
  }, []);

  const handleBulkImport = useCallback(async (file, onProgress) => {
    try {
      await importProducts(file, onProgress);
      setBulkImportOpen(false);
    } catch (error) {
      console.error('Import failed:', error);
    }
  }, [importProducts]);

  const handleExport = useCallback(async () => {
    try {
      await exportProducts({ format: 'csv' });
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [exportProducts]);

  // Selection handlers
  const handleSelectProduct = useCallback((product) => {
    setSelectedProducts((prev) =>
      prev.some((p) => p.id === product.id)
        ? prev.filter((p) => p.id !== product.id)
        : [...prev, product]
    );
  }, []);

  const handleSelectAll = useCallback((checked) => {
    setSelectedProducts(checked ? filteredProducts : []);
  }, [filteredProducts]);

  // Count products by status (CLIENT-SIDE)
  const activeCount = products.filter((p) => p.active).length;
  const inactiveCount = products.filter((p) => !p.active).length;
  const lowStockCount = products.filter((p) => p.stock <= (p.minStock || 10)).length;

  return (
    <MainLayout
      currentPath="/inventory/products"
      user={{ name: 'John Doe', role: 'Manager', avatar: 'JD' }}
    >
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Inventory', href: '/inventory' },
            { label: 'Products' },
          ]}
        />

        {/* Page Header */}
        <PageHeader
          title="Products"
          description="Manage your product inventory and pricing"
          badge={`${products.length} items`}
          actions={
            <div className="flex items-center gap-2">
              

              {/* View Toggle */}
              <div className="hidden sm:flex border border-gray-300 rounded-lg p-1">
                <button
                  onClick={() => setView('list')}
                  className={`p-2 rounded ${
                    view === 'list'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <List className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setView('grid')}
                  className={`p-2 rounded ${
                    view === 'grid'
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <Grid3x3 className="h-4 w-4" />
                </button>
              </div>


              {/* ✅ Low Stock Alert Button */}
              {lowStockCount > 0 && (
                <Button
                  variant="warning"
                  icon={AlertTriangle}
                  onClick={() => navigate('/inventory/products/low-stock')}
                  className="relative"
                >
                  Low Stock
                  <span className="ml-2 bg-warning-700 text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                    {lowStockCount}
                  </span>
                </Button>
              )}

              <Button
                variant="outline"
                icon={Upload}
                onClick={() => setBulkImportOpen(true)}
              >
                Import
              </Button>
              <Button
                variant="outline"
                icon={Download}
                onClick={handleExport}
              >
                Export
              </Button>
              <Button
                variant="primary"
                icon={Plus}
                onClick={() => navigate('/inventory/products/add')}
              >
                Add Product
              </Button>
            </div>
          }
        />

        {/* Tabs - Only Active/Inactive (removed Low Stock tab) */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" badge={products.length}>
              All Products
            </TabsTrigger>
            <TabsTrigger value="active" badge={activeCount}>
              Active
            </TabsTrigger>
            <TabsTrigger value="inactive" badge={inactiveCount}>
              Inactive
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {/* List View */}
            {view === 'list' && (
              <div className="space-y-4">
                <ProductList
                  products={filteredProducts}
                  loading={loading}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onView={handleView}
                  onAdjustStock={handleAdjustStock}
                  sortColumn={sortColumn}
                  sortDirection={sortDirection}
                  onSort={handleSort}
                  searchQuery={searchQuery}
                  onSearchChange={setSearchQuery}
                  onSearch={handleDebouncedSearch}
                  selectedRows={selectedProducts}
                  onSelectRow={handleSelectProduct}
                  onSelectAll={handleSelectAll}
                />
                
                {/* Pagination for List View */}
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

            {/* Grid View */}
            {view === 'grid' && (
              <div className="space-y-4">
                {/* Search */}
                <div className="flex items-center gap-4">
                  <SearchBar
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onDebouncedChange={handleDebouncedSearch}
                    placeholder="Search products by name, SKU, or barcode..."
                    debounce={500}
                    autoFocus
                  />
                </div>

                {/* Grid */}
                {loading ? (
                  <div className="text-center py-12 text-gray-500">
                    Loading products...
                  </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No products found</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onView={handleView}
                        onSelect={handleSelectProduct}
                        selected={selectedProducts.some((p) => p.id === product.id)}
                      />
                    ))}
                  </div>
                )}
                
                {/* Pagination for Grid View */}
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
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <StockAdjustmentForm
        isOpen={stockAdjustmentOpen}
        onClose={() => {
          setStockAdjustmentOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSubmit={handleStockAdjustmentSubmit}
        loading={loading}
      />

      <BarcodeGenerator
        isOpen={barcodeGeneratorOpen}
        onClose={() => {
          setBarcodeGeneratorOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
      />

      <BulkImport
        isOpen={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onImport={handleBulkImport}
        loading={loading}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => {
          setDeleteConfirmOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${selectedProduct?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={loading}
      />
    </MainLayout>
  );
};

export default ProductListPage;