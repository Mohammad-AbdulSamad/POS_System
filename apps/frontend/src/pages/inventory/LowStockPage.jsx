// // src/pages/inventory/LowStockPage.jsx
// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import MainLayout from '../../components/layout/MainLayout';
// import PageHeader from '../../components/layout/PageHeader';
// import Breadcrumbs from '../../components/layout/Breadcrumbs';
// import LowStockList from '../../components/inventory/LowStockList';
// import StockAdjustmentForm from '../../components/inventory/StockAdjustmentForm';
// import Button from '../../components/common/Button';
// import Alert from '../../components/common/Alert';
// import { useProducts } from '../../hooks/useProducts';
// import { AlertTriangle, RefreshCw } from 'lucide-react';

// /**
//  * LowStockPage
//  * 
//  * Page for monitoring and managing low stock products
//  */

// const LowStockPage = () => {
//   const navigate = useNavigate();
//   const [lowStockProducts, setLowStockProducts] = useState([]);
//   const [sortColumn, setSortColumn] = useState('stock');
//   const [sortDirection, setSortDirection] = useState('asc');
  
//   // Modals
//   const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false);
//   const [selectedProduct, setSelectedProduct] = useState(null);
  
//   const { 
//     fetchLowStockProducts, 
//     adjustStock,
//     loading 
//   } = useProducts();

//   // Load low stock products
//   useEffect(() => {
//     loadLowStockProducts();
//   }, []);

//   const loadLowStockProducts = async () => {
//     try {
//       const data = await fetchLowStockProducts({
//         sortBy: sortColumn,
//         sortOrder: sortDirection,
//       });
//       setLowStockProducts(data.products || data || []);
//     } catch (error) {
//       console.error('Failed to load low stock products:', error);
//     }
//   };

//   const handleSort = (column, direction) => {
//     setSortColumn(column);
//     setSortDirection(direction);
//     // Reload with new sort
//     loadLowStockProducts();
//   };

//   const handleAdjustStock = (product) => {
//     setSelectedProduct(product);
//     setStockAdjustmentOpen(true);
//   };

//   const handleStockAdjustmentSubmit = async (adjustmentData) => {
//     try {
//       await adjustStock(adjustmentData.productId, adjustmentData);
//       setStockAdjustmentOpen(false);
//       setSelectedProduct(null);
//       // Reload list
//       loadLowStockProducts();
//     } catch (error) {
//       console.error('Stock adjustment failed:', error);
//     }
//   };

//   const handleReorder = (product) => {
//     // Navigate to supplier or purchase order page
//     navigate(`/inventory/reorder/${product.id}`);
//   };

//   const handleRefresh = () => {
//     loadLowStockProducts();
//   };

//   // Calculate critical count (out of stock)
//   const criticalCount = lowStockProducts.filter(p => p.stock === 0).length;

//   return (
//     <MainLayout
//       currentPath="/inventory/low-stock"
//       user={{ name: 'John Doe', role: 'Manager', avatar: 'JD' }}
//     >
//       <div className="space-y-6">
//         {/* Breadcrumbs */}
//         <Breadcrumbs
//           items={[
//             { label: 'Inventory', href: '/inventory' },
//             { label: 'Low Stock' },
//           ]}
//         />

//         {/* Page Header */}
//         <PageHeader
//           title="Low Stock Alert"
//           description="Products that need immediate attention"
//           badge={
//             criticalCount > 0 ? (
//               <span className="bg-danger-100 text-danger-800 px-3 py-1 rounded-full text-sm font-semibold">
//                 {criticalCount} Critical
//               </span>
//             ) : null
//           }
//           actions={
//             <Button
//               variant="outline"
//               icon={RefreshCw}
//               onClick={handleRefresh}
//               loading={loading}
//             >
//               Refresh
//             </Button>
//           }
//         />

//         {/* Alert */}
//         {lowStockProducts.length > 0 && (
//           <Alert variant="warning">
//             <div className="flex items-center gap-2">
//               <AlertTriangle className="h-5 w-5" />
//               <div>
//                 <p className="font-medium">Stock Level Alert</p>
//                 <p className="text-sm mt-1">
//                   {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} {lowStockProducts.length !== 1 ? 'are' : 'is'} running low on stock. 
//                   Please reorder or adjust stock levels to maintain inventory.
//                 </p>
//               </div>
//             </div>
//           </Alert>
//         )}

//         {/* Low Stock List */}
//         <LowStockList
//           products={lowStockProducts}
//           loading={loading}
//           onAdjustStock={handleAdjustStock}
//           onReorder={handleReorder}
//           sortColumn={sortColumn}
//           sortDirection={sortDirection}
//           onSort={handleSort}
//         />
//       </div>

//       {/* Stock Adjustment Modal */}
//       <StockAdjustmentForm
//         isOpen={stockAdjustmentOpen}
//         onClose={() => {
//           setStockAdjustmentOpen(false);
//           setSelectedProduct(null);
//         }}
//         product={selectedProduct}
//         onSubmit={handleStockAdjustmentSubmit}
//         loading={loading}
//       />
//     </MainLayout>
//   );
// };

// export default LowStockPage;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import LowStockList from '../../components/inventory/LowStockList';
import StockAdjustmentForm from '../../components/inventory/StockAdjustmentForm';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { useProducts } from '../../hooks/useProducts';
import { useAuth } from '../../hooks/useAuth';
import { AlertTriangle, RefreshCw } from 'lucide-react';

const LowStockPage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [sortColumn, setSortColumn] = useState('stock');
  const [sortDirection, setSortDirection] = useState('asc');
  const [threshold, setThreshold] = useState(10);
  
  // Modals
  const [stockAdjustmentOpen, setStockAdjustmentOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  const { 
    fetchLowStockProducts, 
    adjustStock,
    loading 
  } = useProducts();

  // Get branchId - try multiple possible property names
  const branchId = user?.branchId || user?.branch_id || user?.branch?.id;

  // Debug: Log user object to see its structure
  useEffect(() => {
    if (user) {
      console.log('🔍 User object structure:', user);
      console.log('📍 Extracted branchId:', branchId);
      console.log('📋 All user keys:', Object.keys(user));
    }
  }, [user]);

  // Load low stock products when branchId is available
  useEffect(() => {
    if (branchId && !authLoading) {
      loadLowStockProducts();
    }
  }, [branchId, threshold, authLoading]);

  const loadLowStockProducts = async () => {
    if (!branchId) {
      console.error('❌ No branch ID found for user');
      return;
    }

    try {
      console.log('📦 Fetching low stock products for branch:', branchId, 'threshold:', threshold);
      const data = await fetchLowStockProducts(branchId, threshold);
      console.log('✅ Received low stock data:', data);
      setLowStockProducts(data || []);
    } catch (error) {
      console.error('❌ Failed to load low stock products:', error);
    }
  };

  const handleSort = (column, direction) => {
    setSortColumn(column);
    setSortDirection(direction);
    const sorted = [...lowStockProducts].sort((a, b) => {
      const aValue = a[column];
      const bValue = b[column];
      
      if (direction === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }
      return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
    });
    setLowStockProducts(sorted);
  };

  const handleAdjustStock = (product) => {
    setSelectedProduct(product);
    setStockAdjustmentOpen(true);
  };

  const handleStockAdjustmentSubmit = async (adjustmentData) => {
    try {
      await adjustStock(adjustmentData.productId, adjustmentData);
      setStockAdjustmentOpen(false);
      setSelectedProduct(null);
      loadLowStockProducts();
    } catch (error) {
      console.error('Stock adjustment failed:', error);
    }
  };

  const handleReorder = (product) => {
    navigate(`/inventory/reorder/${product.id}`);
  };

  const handleRefresh = () => {
    loadLowStockProducts();
  };

  const criticalCount = lowStockProducts.filter(p => p.stock === 0).length;

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <MainLayout
        currentPath="/inventory/low-stock"
        user={{ name: 'Loading...', role: 'User', avatar: 'L' }}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show message if user has no branch assigned
  if (!branchId) {
    return (
      <MainLayout
        currentPath="/inventory/low-stock"
        user={{ 
          name: user?.name || 'User', 
          role: user?.role || 'User', 
          avatar: user?.name?.[0]?.toUpperCase() || 'U' 
        }}
      >
        <Alert variant="warning">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <div>
              <p className="font-medium">No Branch Assigned</p>
              <p className="text-sm mt-1">
                You don't have a branch assigned. Please contact your administrator.
              </p>
              <p className="text-xs mt-2 text-gray-500">
                Debug: User object keys: {user ? Object.keys(user).join(', ') : 'No user'}
              </p>
            </div>
          </div>
        </Alert>
      </MainLayout>
    );
  }

  return (
    <MainLayout
      currentPath="/inventory/low-stock"
      user={{ 
        name: user?.name || 'User', 
        role: user?.role || 'User', 
        avatar: user?.name?.[0]?.toUpperCase() || 'U' 
      }}
    >
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Inventory', href: '/inventory' },
            { label: 'Low Stock' },
          ]}
        />

        <PageHeader
          title="Low Stock Alert"
          description="Products that need immediate attention"
          badge={
            criticalCount > 0 ? (
              <span className="bg-danger-100 text-danger-800 px-3 py-1 rounded-full text-sm font-semibold">
                {criticalCount} Critical
              </span>
            ) : null
          }
          actions={
            <Button
              variant="outline"
              icon={RefreshCw}
              onClick={handleRefresh}
              loading={loading}
            >
              Refresh
            </Button>
          }
        />

        {lowStockProducts.length > 0 && (
          <Alert variant="warning">
            <div className="flex items-center gap-2">
              {/* <AlertTriangle className="h-5 w-5" /> */}
              <div>
                <p className="font-medium">Stock Level Alert</p>
                <p className="text-sm mt-1">
                  {lowStockProducts.length} product{lowStockProducts.length !== 1 ? 's' : ''} {lowStockProducts.length !== 1 ? 'are' : 'is'} running low on stock. 
                  Please reorder or adjust stock levels to maintain inventory.
                </p>
              </div>
            </div>
          </Alert>
        )}

        <LowStockList
          products={lowStockProducts}
          loading={loading}
          onAdjustStock={handleAdjustStock}
          onReorder={handleReorder}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          threshold={threshold}
        />
      </div>

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
    </MainLayout>
  );
};

export default LowStockPage;