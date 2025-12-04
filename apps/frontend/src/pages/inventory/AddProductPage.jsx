// src/pages/inventory/AddProductPage.jsx - WITH REAL BRANCHES
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import ProductForm from '../../components/inventory/ProductForm';
import Spinner from '../../components/common/Spinner';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useSuppliers } from '../../hooks/useSuppliers';
import { useBranches } from '../../hooks/useBranches';
import { useTaxRates } from '../../hooks/useTaxRates';
import { useAuth } from '../../hooks/useAuth';
import { ArrowLeft } from 'lucide-react';

/**
 * AddProductPage - WITH REAL BRANCHES
 * 
 * Page for creating a new product
 * 
 * CHANGES:
 * - Added useBranches hook for real branch data
 * - Admin/Manager can select any branch
 * - Cashier/Stock Manager auto-assigned to their branch
 */

const AddProductPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // ✅ OPTIMIZED: Don't fetch products list (autoFetch: false)
  const { createProduct, loading } = useProducts({ autoFetch: false });
  const { taxRates, loading: taxRatesLoading } = useTaxRates();
  
  // ✅ Fetch form dropdown data
  const { categories, loading: categoriesLoading } = useCategories();
  const { suppliers, loading: suppliersLoading } = useSuppliers();
  
  // ✅ NEW: Fetch branches (only for admin/manager)
  const { branches, loading: branchesLoading, canFetchBranches } = useBranches();

  
  // ✅ Determine available branches based on role
  const availableBranches = canFetchBranches 
    ? branches // Admin/Manager sees all branches
    : user?.branch ? [user.branch] : []; // Cashier sees only their branch

  const handleSubmit = async (data) => {
    try {
      // ✅ Auto-assign branch for non-admin users if not selected
      const productData = {
        ...data,
        branchId: data.branchId || user?.branchId, // Fallback to user's branch
      };

      const newProduct = await createProduct(productData);
      navigate(`/inventory/products/${newProduct.id}`);
    } catch (error) {
      console.error('Failed to create product:', error);
    }
  };

  const handleCancel = () => {
    navigate('/inventory/products');
  };

  // ✅ Show loading state while fetching dropdown data
  const isLoadingData = categoriesLoading || suppliersLoading || branchesLoading;

  return (
    <MainLayout
      currentPath="/inventory/products/add"
      user={{ name: 'John Doe', role: 'Manager', avatar: 'JD' }}
    >
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Inventory', href: '/inventory' },
            { label: 'Products', href: '/inventory/products' },
            { label: 'Add Product' },
          ]}
        />

        {/* Page Header */}
        <PageHeader
          title="Add New Product"
          description="Create a new product in your inventory"
          backButton={
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={handleCancel}
            >
              Back to Products
            </Button>
          }
        />

        {/* Form Card */}
        <Card>
          <CardBody>
            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <Spinner size="lg" />
                <span className="ml-3 text-gray-600">Loading form data...</span>
              </div>
            ) : (
              <ProductForm
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

export default AddProductPage;