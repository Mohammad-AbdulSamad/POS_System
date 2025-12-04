// src/pages/inventory/StockAdjustmentPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import SearchBar from '../../components/common/SearchBar';
import ProductCard from '../../components/inventory/ProductCard';
import StockAdjustmentForm from '../../components/inventory/StockAdjustmentForm';
import { useProducts } from '../../hooks/useProducts';
import { ArrowLeft, Package, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

/**
 * StockAdjustmentPage
 * 
 * Dedicated page for adjusting product stock levels
 */

const StockAdjustmentPage = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [adjustmentFormOpen, setAdjustmentFormOpen] = useState(false);
  
  const { products, loading, searchProducts, adjustStock } = useProducts();

  // Filter products based on search
  const handleSearch = async (query) => {
    setSearchQuery(query);
    if (query.trim()) {
      await searchProducts(query);
    }
  };

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setAdjustmentFormOpen(true);
  };

  const handleStockAdjustmentSubmit = async (adjustmentData) => {
    try {
      await adjustStock(adjustmentData.productId, adjustmentData);
      setAdjustmentFormOpen(false);
      setSelectedProduct(null);
      // Refresh search results
      if (searchQuery) {
        await searchProducts(searchQuery);
      }
    } catch (error) {
      console.error('Stock adjustment failed:', error);
    }
  };

  // Calculate statistics
  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.stock <= (p.minStock || 0)).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  return (
    <MainLayout
      currentPath="/inventory/stock-adjustment"
      user={{ name: 'John Doe', role: 'Manager', avatar: 'JD' }}
    >
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Inventory', href: '/inventory' },
            { label: 'Stock Adjustment' },
          ]}
        />

        {/* Page Header */}
        <PageHeader
          title="Stock Adjustment"
          description="Update product stock levels across your inventory"
          backButton={
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/inventory/products')}
            >
              Back to Products
            </Button>
          }
        />

        {/* Info Alert */}
        <Alert variant="info">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold mb-1">How to Adjust Stock</h4>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Search for the product you want to adjust</li>
                <li>Click on the product card</li>
                <li>Enter the quantity change (positive to add, negative to remove)</li>
                <li>Select a reason for the adjustment</li>
                <li>Add notes if needed and save</li>
              </ol>
            </div>
          </div>
        </Alert>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Package className="h-6 w-6 text-primary-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {totalProducts}
                  </div>
                  <div className="text-sm text-gray-600">Total Products</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-warning-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-warning-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {lowStockCount}
                  </div>
                  <div className="text-sm text-gray-600">Low Stock</div>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 bg-danger-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-danger-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {outOfStockCount}
                  </div>
                  <div className="text-sm text-gray-600">Out of Stock</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Search Section */}
        <Card>
          <CardBody>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Search Products
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Search by product name, SKU, or barcode
                </p>
                <SearchBar
                  value={searchQuery}
                  onChange={handleSearch}
                  placeholder="Search products to adjust stock..."
                  autoFocus
                />
              </div>

              {/* Search Results */}
              {searchQuery && (
                <div className="pt-4 border-t border-gray-200">
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">
                      Searching...
                    </div>
                  ) : products.length === 0 ? (
                    <div className="text-center py-8">
                      <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">
                        No products found for "{searchQuery}"
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="font-semibold text-gray-900">
                          {products.length} product{products.length !== 1 ? 's' : ''} found
                        </h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {products.map((product) => (
                          <div
                            key={product.id}
                            onClick={() => handleSelectProduct(product)}
                            className="cursor-pointer"
                          >
                            <ProductCard
                              product={product}
                              showActions={false}
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Initial State */}
              {!searchQuery && (
                <div className="text-center py-12 text-gray-500">
                  <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium text-gray-900 mb-2">
                    Start Searching
                  </p>
                  <p className="text-sm">
                    Enter a product name, SKU, or barcode to begin
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant="outline"
                icon={TrendingDown}
                onClick={() => navigate('/inventory/low-stock')}
                className="justify-start"
              >
                View Low Stock Products
              </Button>
              <Button
                variant="outline"
                icon={TrendingUp}
                onClick={() => navigate('/inventory/products')}
                className="justify-start"
              >
                View All Products
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Stock Adjustment Form */}
      <StockAdjustmentForm
        isOpen={adjustmentFormOpen}
        onClose={() => {
          setAdjustmentFormOpen(false);
          setSelectedProduct(null);
        }}
        product={selectedProduct}
        onSubmit={handleStockAdjustmentSubmit}
        loading={loading}
      />
    </MainLayout>
  );
};

export default StockAdjustmentPage;