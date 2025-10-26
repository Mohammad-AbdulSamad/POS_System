// import React from 'react';
// import Button from '../../components/common/Button';
// import { useAuth } from '../../hooks/useAuth';

// async function logout_Redirect (){
//     const { logout } = useAuth();
//     await logout();
//     window.location.href = '/';
// }
// export default function HomePage() {
  
//     return (
//     <div>
//       <h1>Welcome to the Dashboard</h1>
//       <p>This is your home page.</p>
//       <Button variant="primary" onClick={logout_Redirect}>
//         Logout
//       </Button>
//     </div>
//   );
// }
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDashboard } from '../../hooks/useDashboard';
import { useToast } from '../../components/common/Toast';

// Dashboard Components
import StatCard from '../../components/dashboard/StatCard';
import SalesChart from '../../components/dashboard/SalesChart';
import RecentTransactions from '../../components/dashboard/RecentTransactions';
import TopProducts from '../../components/dashboard/TopProducts';
import LowStockWidget from '../../components/dashboard/LowStockWidget';
import QuickActions from '../../components/dashboard/QuickActions';

// Common Components
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';

// Icons
import {
  DollarSign,
  ShoppingCart,
  Package,
  AlertTriangle,
  RefreshCw,
  Plus,
  Users,
  BarChart,
  Printer,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
const DashboardPage = () => {
  // const { isAuthenticated, user } = useAuth();
  const toast = useToast();
  
  // useEffect(() => {
  //   if (!isAuthenticated) {
  //     // Redirect to login page if not authenticated
  //     window.location.href = '/login';
  //   }
  //   else{
  //     console.log('User is authenticated, accessing dashboard.');
  //     console.log(user);
  //   }
  // }, [isAuthenticated]);

  const {
    stats,
    salesData,
    transactions,
    topProducts,
    lowStockItems,
    loading,
    error,
    fetchSalesData,
    fetchTopProducts,
    refreshAll,
  } = useDashboard();

  const [refreshing, setRefreshing] = useState(false);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshAll();
      toast.success('Dashboard refreshed successfully');
    } catch (err) {
      toast.error('Failed to refresh dashboard');
    } finally {
      setRefreshing(false);
    }
  };

  // Quick actions configuration
  const quickActions = [
    {
      id: 'new-sale',
      label: 'New Sale',
      icon: ShoppingCart,
      color: 'primary',
      shortcut: 'F1',
      description: 'Start a new sale transaction',
    },
    {
      id: 'add-product',
      label: 'Add Product',
      icon: Plus,
      color: 'success',
      shortcut: 'F2',
      description: 'Add new product to inventory',
    },
    {
      id: 'inventory',
      label: 'Inventory',
      icon: Package,
      color: 'info',
      shortcut: 'F3',
      badge: lowStockItems?.length > 0 ? lowStockItems.length.toString() : null,
      badgeVariant: 'warning',
    },
    {
      id: 'customers',
      label: 'Customers',
      icon: Users,
      color: 'secondary',
      shortcut: 'F4',
    },
    {
      id: 'reports',
      label: 'Reports',
      icon: BarChart,
      color: 'gray',
      shortcut: 'F5',
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      color: 'secondary',
    },
  ];

  // Handle quick action clicks
  const handleQuickAction = async (action) => {
    switch (action.id) {
      case 'new-sale':
        navigate('/pos/sale');
        break;
      case 'add-product':
        navigate('/products/new');
        break;
      case 'inventory':
        navigate('/inventory');
        break;
      case 'customers':
        navigate('/customers');
        break;
      case 'reports':
        navigate('/reports');
        break;
      case 'settings':
        navigate('/settings');
        break;
      default:
        toast.info(`${action.label} clicked`);
    }
  };

  // Handle reorder
  const handleReorder = async (item) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success(`Reorder placed for ${item.name}`);
      // Refresh low stock items
      // await fetchLowStockItems();
    } catch (err) {
      toast.error('Failed to place reorder');
    }
  };

  // Handle export
  const handleExportSales = (data, period, chartType) => {
    toast.info(`Exporting ${period} sales data as ${chartType}...`);
    // Implement export logic here
  };

  // Show loading spinner on initial load
  if (loading.stats && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="xl" label="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's your business overview</p>
          </div>
          <Button
            variant="outline"
            icon={RefreshCw}
            loading={refreshing}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-danger-50 border border-danger-200 text-danger-800 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Today's Sales"
            value={`₪${stats?.todaySales?.value?.toLocaleString() || '0'}`}
            icon={DollarSign}
            trend={stats?.todaySales?.trend}
            trendValue={`${stats?.todaySales?.change > 0 ? '+' : ''}${stats?.todaySales?.change || 0}%`}
            trendLabel="from yesterday"
            color="success"
            variant="gradient"
            loading={loading.stats}
          />

          <StatCard
            title="Total Orders"
            value={stats?.totalOrders?.value?.toLocaleString() || '0'}
            icon={ShoppingCart}
            trend={stats?.totalOrders?.trend}
            trendValue={`${stats?.totalOrders?.change > 0 ? '+' : ''}${stats?.totalOrders?.change || 0}%`}
            trendLabel="from yesterday"
            color="primary"
            loading={loading.stats}
            onClick={() => navigate('/orders')}
            hoverable
          />

          <StatCard
            title="Total Products"
            value={stats?.totalProducts?.value?.toLocaleString() || '0'}
            icon={Package}
            trend={stats?.totalProducts?.trend}
            trendLabel="No change"
            color="gray"
            loading={loading.stats}
          />

          <StatCard
            title="Low Stock Items"
            value={stats?.lowStockItems?.value?.toLocaleString() || '0'}
            icon={AlertTriangle}
            trend={stats?.lowStockItems?.trend}
            trendValue={`${stats?.lowStockItems?.change || 0}`}
            trendLabel="from yesterday"
            color="warning"
            loading={loading.stats}
            onClick={() => navigate('/inventory?filter=low-stock')}
            hoverable
          />
        </div>

        {/* Quick Actions */}
        <QuickActions
          actions={quickActions}
          onActionClick={handleQuickAction}
          columns={3}
        />

        {/* Charts and Lists Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sales Chart - Takes 2 columns */}
          <div className="lg:col-span-2">
            <SalesChart
              data={salesData}
              loading={loading.sales}
              onPeriodChange={fetchSalesData}
              onDownload={handleExportSales}
            />
          </div>

          {/* Top Products - Takes 1 column */}
          <TopProducts
            products={topProducts}
            loading={loading.products}
            onSortChange={fetchTopProducts}
            onViewAll={() => navigate('/products')}
            onProductClick={(product) => navigate(`/products/${product.id}`)}
          />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Transactions - Takes 2 columns */}
          <div className="lg:col-span-2">
            <RecentTransactions
              transactions={transactions}
              loading={loading.transactions}
              onViewAll={() => navigate('/transactions')}
              onViewDetails={(transaction) => navigate(`/transactions/${transaction.id}`)}
            />
          </div>

          {/* Low Stock Widget - Takes 1 column */}
          <LowStockWidget
            items={lowStockItems}
            loading={loading.lowStock}
            onReorder={handleReorder}
            onViewAll={() => navigate('/inventory?filter=low-stock')}
            onItemClick={(item) => navigate(`/products/${item.id}`)}
          />
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;