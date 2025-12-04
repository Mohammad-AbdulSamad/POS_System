// src/pages/sales/SalesHistoryPage.jsx
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import TransactionList from '../../components/sales/TransactionList';
import TransactionFilters from '../../components/sales/TransactionFilters';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import Card, { CardBody } from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import { useTransactions } from '../../hooks/useTransactions';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatters';
import { usePOS } from '../../hooks/usePOS';
import transactionsHook from '../../hooks/useTransactions';
import ReceiptPreview from '../../components/pos/ReceiptPreview';

import { 
  Download, 
  Receipt, 
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Calendar
} from 'lucide-react';

/**
 * SalesHistoryPage
 * 
 * Main sales history page with filtering and statistics
 */

const SalesHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);

  // Hooks
  const {
    transactions,
    isLoading,
    pagination,
    filters,
    updateFilters,
    clearFilters,
    goToPage,
    setPageSize,
    fetchTransactions,
    getTodayTotals,
    calculateTotals,
  } = useTransactions({
    autoFetch: true,
    initialLimit: 50,
  });

  // for printing receipts
  const pos = usePOS();


    const storeInfo = {
    name: 'My Store',
    address: '123 Main St, City',
    phone: '+972-50-000-0000',
    taxId: '123456789',
    returnPolicy: 'Returns accepted within 30 days',
    website: 'www.mystore.com',
  };
  // Calculate statistics
  const todayStats = getTodayTotals();
  const allStats = calculateTotals();

  /**
   * Handle search
   */
  const handleSearch = useCallback((query) => {
    setSearchQuery(query);
    fetchTransactions({ searchQuery: query, page: 1 });
  }, [fetchTransactions]);

  /**
   * Handle sort
   */
  const handleSort = useCallback((column, direction) => {
    setSortColumn(column);
    setSortDirection(direction);
    fetchTransactions({ 
      sortBy: column, 
      sortOrder: direction,
      searchQuery,
    });
  }, [fetchTransactions, searchQuery]);

  /**
   * Handle pagination
   */
  const handlePageChange = useCallback((newPage) => {
    goToPage(newPage);
    fetchTransactions({ page: newPage, searchQuery });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [goToPage, fetchTransactions, searchQuery]);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    fetchTransactions({ page: 1, limit: newSize, searchQuery });
  }, [setPageSize, fetchTransactions, searchQuery]);

  /**
   * Handle filter apply
   */
  const handleApplyFilters = useCallback((newFilters) => {
    updateFilters(newFilters);
    fetchTransactions({ ...newFilters, page: 1 });
  }, [updateFilters, fetchTransactions]);

  /**
   * Handle filter clear
   */
  const handleClearFilters = useCallback(() => {
    clearFilters();
    fetchTransactions({ page: 1 });
  }, [clearFilters, fetchTransactions]);

  /**
   * Handle view transaction
   */
 const handleView = useCallback(async (transaction) => {
    try {
      // ✅ Fetch full details before navigating or showing modal
    //   await transactionsHook.fetchTransactionById(transaction.id);
      
      // Option 1: Navigate to detail page
      navigate(`/sales/transactions/${transaction.id}`);
      
      // Option 2: Show in modal (if you prefer)
      // await pos.viewTransaction(transaction);
    } catch (error) {
      console.error('Error viewing transaction:', error);
    }
  }, [navigate, transactionsHook]);

  /**
   * Handle print receipt
   */
  const handlePrintReceipt = useCallback(async (transaction) => {
    try {
      console.log('Printing receipt for transaction:', transaction);
      
      // ✅ Fetch full details before showing receipt
      await pos.viewTransaction(transaction);
    } catch (error) {
      console.error('Error loading receipt:', error);
    }
  }, [pos]);

  /**
   * Handle process return
   */
  const handleProcessReturn = useCallback((transaction) => {
    navigate(`/sales/returns/new?transaction=${transaction.id}`);
  }, [navigate]);

  /**
   * Handle export
   */
  const handleExport = useCallback(() => {
    // TODO: Implement export
    console.log('Export transactions');
  }, []);

  // Check if user can see all branches
  const canSeeAllBranches = user && ['ADMIN', 'MANAGER'].includes(user.role);

  return (
    <MainLayout
      currentPath="/sales/history"
      user={{ name: user?.name, role: user?.role, avatar: user?.name?.substring(0, 2) }}
    >
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Sales', href: '/sales' },
            { label: 'Transaction History' },
          ]}
        />

        {/* Page Header */}
        <PageHeader
          title="Transaction History"
          description="View and manage all sales transactions"
          badge={`${pagination.total || 0} transactions`}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                icon={Download}
                onClick={handleExport}
              >
                Export
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
              >
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
            </div>
          }
        />

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Today's Sales */}
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-success-600 rounded-lg p-3">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(todayStats.totalSales)}
                  </div>
                  <div className="text-sm text-gray-600">Today's Sales</div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Today's Transactions */}
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary-600 rounded-lg p-3">
                  <Receipt className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {todayStats.totalTransactions}
                  </div>
                  <div className="text-sm text-gray-600">Today's Transactions</div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Total Sales (All Time) */}
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-warning-600 rounded-lg p-3">
                  <TrendingUp className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(allStats.totalSales)}
                  </div>
                  <div className="text-sm text-gray-600">Total Sales</div>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Average Transaction */}
          <Card>
            <CardBody className="p-4">
              <div className="flex items-center gap-3">
                <div className="bg-purple-600 rounded-lg p-3">
                  <ShoppingCart className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      allStats.totalTransactions > 0
                        ? allStats.totalSales / allStats.totalTransactions
                        : 0
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Avg. Transaction</div>
                </div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Filters */}
        {showFilters && (
          <TransactionFilters
            filters={filters}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            showBranchFilter={canSeeAllBranches}
            loading={isLoading}
          />
        )}

        {/* Transactions List */}
        <Card>
          <CardBody>
            <TransactionList
              transactions={transactions}
              loading={isLoading}
              onView={handleView}
              onPrintReceipt={handlePrintReceipt}
              onReturn={handleProcessReturn}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onSearch={handleSearch}
            />

            {/* Pagination */}
            {pagination.total > 0 && (
              <div className="mt-6">
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  totalItems={pagination.total}
                  pageSize={pagination.limit}
                  onPageChange={handlePageChange}
                  onPageSizeChange={handlePageSizeChange}
                  pageSizeOptions={[20, 50, 100, 200]}
                />
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      <ReceiptPreview
        isOpen={pos.modals.receipt}
        onClose={pos.newTransaction}
        transaction={pos.selectedTransaction}
        store={storeInfo}
        onPrint={() => console.log('Print receipt')}
        loading={pos.isFetchingTransactionDetails} // ✅ Add loading indicator
      />
    </MainLayout>
  );
};

export default SalesHistoryPage;