// src/pages/inventory/ProductDetailsPage.jsx - OPTIMIZED VERSION
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import ProductDetails from '../../components/inventory/ProductDetails';
import StockAdjustmentForm from '../../components/inventory/StockAdjustmentForm';
import BarcodeGenerator from '../../components/inventory/BarcodeGenerator';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useProducts } from '../../hooks/useProducts';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';

/**
 * ProductDetailsPage - OPTIMIZED VERSION
 * 
 * Page for viewing detailed product information
 * 
 * OPTIMIZATION CHANGES:
 * - Added autoFetch: false to useProducts (don't need product list)
 * - Fixed useEffect dependencies (removed navigate, added fetchProductById)
 * - Memoized loadProduct with useCallback
 * - Only fetches the single product needed for this page
 */

const ProductDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  
  // Modals
  const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false);
  const [barcodeGeneratorOpen, setBarcodeGeneratorOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  
  // ✅ OPTIMIZED: Don't fetch products list (autoFetch: false)
  const { fetchProductById, deleteProduct, adjustStock, loading } = useProducts({ autoFetch: false });

  // ✅ OPTIMIZED: Memoized loadProduct function
  const loadProduct = useCallback(async () => {
    if (!id) return;
    
    setLoadingProduct(true);
    try {
      const data = await fetchProductById(id, { 
        include_relations: true,
        include_stock_history: true 
      });
      setProduct(data);
    } catch (error) {
      console.error('Failed to load product:', error);
      navigate('/inventory/products');
    } finally {
      setLoadingProduct(false);
    }
  }, [id, fetchProductById, navigate]);

  // ✅ FIXED: Proper dependency array
  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  const handleEdit = () => {
    navigate(`/inventory/products/${id}/edit`);
  };

  const handleDelete = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteProduct(id);
      navigate('/inventory/products');
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  const handleAdjustStock = () => {
    setStockAdjustmentOpen(true);
  };

  const handleStockAdjustmentSubmit = async (adjustmentData) => {
    try {
      const updatedProduct = await adjustStock(adjustmentData.productId, adjustmentData);
      setProduct(updatedProduct);
      setStockAdjustmentOpen(false);
    } catch (error) {
      console.error('Stock adjustment failed:', error);
    }
  };

  const handleGenerateBarcode = () => {
    setBarcodeGeneratorOpen(true);
  };

  if (loadingProduct) {
    return (
      <MainLayout
        currentPath="/inventory/products"
        user={{ name: 'John Doe', role: 'Manager', avatar: 'JD' }}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout
        currentPath="/inventory/products"
        user={{ name: 'John Doe', role: 'Manager', avatar: 'JD' }}
      >
        <div className="text-center py-12">
          <p className="text-gray-500">Product not found</p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => navigate('/inventory/products')}
          >
            Back to Products
          </Button>
        </div>
      </MainLayout>
    );
  }

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
            { label: 'Products', href: '/inventory/products' },
            { label: product.name },
          ]}
        />

        {/* Page Header */}
        <PageHeader
          title={product.name}
          description={`SKU: ${product.sku}`}
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
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                icon={Edit}
                onClick={handleEdit}
              >
                Edit
              </Button>
              <Button
                variant="danger"
                icon={Trash2}
                onClick={handleDelete}
              >
                Delete
              </Button>
            </div>
          }
        />

        {/* Product Details */}
        <ProductDetails
          product={product}
          loading={loading}
          onEdit={handleEdit}
          onAdjustStock={handleAdjustStock}
          onGenerateBarcode={handleGenerateBarcode}
        />
      </div>

      {/* Modals */}
      <StockAdjustmentForm
        isOpen={stockAdjustmentOpen}
        onClose={() => setStockAdjustmentOpen(false)}
        product={product}
        onSubmit={handleStockAdjustmentSubmit}
        loading={loading}
      />

      <BarcodeGenerator
        isOpen={barcodeGeneratorOpen}
        onClose={() => setBarcodeGeneratorOpen(false)}
        product={product}
      />

      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Product"
        message={`Are you sure you want to delete "${product.name}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        loading={loading}
      />
    </MainLayout>
  );
};

export default ProductDetailsPage;