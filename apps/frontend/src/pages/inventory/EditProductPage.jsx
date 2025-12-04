// src/pages/inventory/EditProductPage.jsx - WITH REAL BRANCHES
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import ProductForm from '../../components/inventory/ProductForm';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useBranches } from '../../hooks/useBranches';
import { useAuth } from '../../hooks/useAuth';
import { useTaxRates } from '../../hooks/useTaxRates';
import { ArrowLeft } from 'lucide-react';

/**
 * EditProductPage - WITH REAL BRANCHES
 * 
 * Page for editing an existing product
 * 
 * CHANGES:
 * - Added useBranches hook for real branch data
 * - Admin/Manager can change product branch
 * - Cashier/Stock Manager cannot change branch (disabled field)
 */

const EditProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [product, setProduct] = useState(null);
  const [loadingProduct, setLoadingProduct] = useState(true);
  
  // ✅ OPTIMIZED: Don't fetch products list (autoFetch: false)
  const { fetchProductById, updateProduct, loading } = useProducts({ autoFetch: false });
  
  // ✅ Fetch form dropdown data
  const { categories, loading: categoriesLoading } = useCategories();
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  
  // ✅ NEW: Fetch branches (only for admin/manager)
  const { branches, loading: branchesLoading, canFetchBranches } = useBranches();
  const { taxRates, loading: taxRatesLoading } = useTaxRates();

  // ✅ Determine available branches based on role
  const availableBranches = canFetchBranches 
    ? branches // Admin/Manager sees all branches
    : product?.branch ? [product.branch] : user?.branch ? [user.branch] : [];

  // ✅ OPTIMIZED: Memoized loadProduct function
  const loadProduct = useCallback(async () => {
    if (!id) return;
    
    setLoadingProduct(true);
    try {
      const data = await fetchProductById(id, { include_relations: true });
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

  const handleSubmit = async (data) => {
    try {
      await updateProduct(id, data);
      navigate(`/inventory/products/${id}`);
    } catch (error) {
      console.error('Failed to update product:', error);
    }
  };

  const handleCancel = () => {
    navigate(`/inventory/products/${id}`);
  };

  // ✅ Combined loading states
  const isLoadingData = categoriesLoading || suppliersLoading || branchesLoading || loadingProduct;

  if (loadingProduct) {
    return (
      <MainLayout
        currentPath="/inventory/products/edit"
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
        currentPath="/inventory/products/edit"
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
      currentPath="/inventory/products/edit"
      user={{ name: 'John Doe', role: 'Manager', avatar: 'JD' }}
    >
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Inventory', href: '/inventory' },
            { label: 'Products', href: '/inventory/products' },
            { label: product.name, href: `/inventory/products/${id}` },
            { label: 'Edit' },
          ]}
        />

        {/* Page Header */}
        <PageHeader
          title="Edit Product"
          description={`Product ID: ${product.sku}`}
          backButton={
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={handleCancel}
            >
              Back to Details
            </Button>
          }
        />

        {/* Form Card */}
        <Card>
          <CardBody>
            {isLoadingData && !product ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
                <span className="ml-3 text-gray-600">Loading form data...</span>
              </div>
            ) : (
              <ProductForm
                initialData={{
                  ...product,
                  categoryId: product.category?.id || '',
                  supplierId: product.supplier?.id || '',
                  taxRateId: product.taxRate?.id || '',
                  branchId: product.branch?.id || product.branchId || '',
                }}
                categories={categories}
                suppliers={suppliers}
                taxRates={taxRates}
                branches={availableBranches}
                onSubmit={handleSubmit}
                onCancel={handleCancel}
                loading={loading}
              />
            )}
          </CardBody>
        </Card>
      </div>
    </MainLayout>
  );
};

export default EditProductPage;