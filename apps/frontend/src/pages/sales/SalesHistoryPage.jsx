// // src/pages/sales/SalesHistoryPage.jsx - FIXED SEARCH

// import { useState, useCallback } from 'react';
// import { useNavigate } from 'react-router-dom';
// import MainLayout from '../../components/layout/MainLayout';
// import PageHeader from '../../components/layout/PageHeader';
// import Breadcrumbs from '../../components/layout/Breadcrumbs';
// import TransactionList from '../../components/sales/TransactionList';
// import TransactionFilters from '../../components/sales/TransactionFilters';
// import Button from '../../components/common/Button';
// import Pagination from '../../components/common/Pagination';
// import Card, { CardBody } from '../../components/common/Card';
// import { useTransactions } from '../../hooks/useTransactions';
// import { useAuth } from '../../hooks/useAuth';
// import { formatCurrency } from '../../utils/formatters';
// import { usePOS } from '../../hooks/usePOS';
// import ReceiptPreview from '../../components/pos/ReceiptPreview';
// import { 
//   Download, 
//   Receipt, 
//   DollarSign,
//   TrendingUp,
//   ShoppingCart
// } from 'lucide-react';

// const SalesHistoryPage = () => {
//   const navigate = useNavigate();
//   const { user } = useAuth();
//   const [searchQuery, setSearchQuery] = useState('');
//   const [sortColumn, setSortColumn] = useState('timestamp');
//   const [sortDirection, setSortDirection] = useState('desc');
//   const [showFilters, setShowFilters] = useState(false);
//   const [currentPage, setCurrentPage] = useState(1);
//   const [pageSize, setPageSize] = useState(50);

//   const {
//     transactions,
//     isLoading,
//     pagination,
//     filters,
//     updateFilters,
//     clearFilters,
//     fetchTransactions,
//     getTodayTotals,
//     calculateTotals,
//   } = useTransactions({
//     autoFetch: true,
//     initialLimit: 50,
//   });

//   const pos = usePOS();

//   const storeInfo = {
//     name: 'My Store',
//     address: '123 Main St, City',
//     phone: '+972-50-000-0000',
//     taxId: '123456789',
//     returnPolicy: 'Returns accepted within 30 days',
//     website: 'www.mystore.com',
//   };

//   const todayStats = getTodayTotals();
//   const allStats = calculateTotals();

//   /**
//    * ✅ FIXED: Handle search properly
//    * This is called ONLY after debounce delay (500ms)
//    */
//   const handleDebouncedSearch = useCallback((debouncedQuery) => {
//     console.log('🔍 Debounced search triggered:', {
//       query: debouncedQuery,
//       queryLength: debouncedQuery?.length,
//       isEmpty: !debouncedQuery || debouncedQuery.trim() === ''
//     });
    
//     // Update local state to match what we're searching
//     setSearchQuery(debouncedQuery);
    
//     setCurrentPage(1);
   
//     // Trigger fetch with search parameter
//     fetchTransactions({ 
//       search: debouncedQuery || '', // Send empty string to clear search,       
//       page: 1, 
//       limit: pageSize,
//       sortBy: sortColumn,
//       sortOrder: sortDirection
//     });
//   }, [fetchTransactions, pageSize, sortColumn, sortDirection]);

//   /**
//    * Handle sort
//    */
//   const handleSort = useCallback((column, direction) => {
//     setSortColumn(column);
//     setSortDirection(direction);
//     fetchTransactions({ 
//       sortBy: column, 
//       sortOrder: direction,
//       search: searchQuery, // ✅ Use 'search'
//       page: currentPage,
//       limit: pageSize
//     });
//   }, [fetchTransactions, searchQuery, currentPage, pageSize]);

//   /**
//    * Handle pagination
//    */
//   const handlePageChange = useCallback((newPage) => {
//     setCurrentPage(newPage);
//     fetchTransactions({ 
//       page: newPage, 
//       limit: pageSize,
//       search: searchQuery, // ✅ Use 'search'
//       sortBy: sortColumn,
//       sortOrder: sortDirection
//     });
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   }, [fetchTransactions, pageSize, searchQuery, sortColumn, sortDirection]);

//   const handlePageSizeChange = useCallback((newSize) => {
//     setPageSize(newSize);
//     setCurrentPage(1);
//     fetchTransactions({ 
//       page: 1, 
//       limit: newSize,
//       search: searchQuery, // ✅ Use 'search'
//       sortBy: sortColumn,
//       sortOrder: sortDirection
//     });
//   }, [fetchTransactions, searchQuery, sortColumn, sortDirection]);

//   /**
//    * Handle filter apply
//    */
//   const handleApplyFilters = useCallback((newFilters) => {
//     updateFilters(newFilters);
//     setCurrentPage(1);
//     fetchTransactions({ 
//       ...newFilters, 
//       search: searchQuery, // ✅ Preserve search when applying filters
//       page: 1,
//       limit: pageSize,
//       sortBy: sortColumn,
//       sortOrder: sortDirection
//     });
//   }, [updateFilters, fetchTransactions, searchQuery, pageSize, sortColumn, sortDirection]);

//   /**
//    * Handle filter clear
//    */
//   const handleClearFilters = useCallback(() => {
//     clearFilters();
//     setCurrentPage(1);
//     fetchTransactions({ 
//       page: 1,
//       limit: pageSize,
//       search: searchQuery, // ✅ Preserve search when clearing filters
//       sortBy: sortColumn,
//       sortOrder: sortDirection
//     });
//   }, [clearFilters, fetchTransactions, searchQuery, pageSize, sortColumn, sortDirection]);

//   /**
//    * Handle view transaction
//    */
//   const handleView = useCallback(async (transaction) => {
//     try {
//       navigate(`/sales/transactions/${transaction.id}`);
//     } catch (error) {
//       console.error('Error viewing transaction:', error);
//     }
//   }, [navigate]);

//   /**
//    * Handle print receipt
//    */
//   const handlePrintReceipt = useCallback(async (transaction) => {
//     try {
//       console.log('Printing receipt for transaction:', transaction);
//       await pos.viewTransaction(transaction);
//     } catch (error) {
//       console.error('Error loading receipt:', error);
//     }
//   }, [pos]);

//   /**
//    * Handle process return
//    */
//   const handleProcessReturn = useCallback((transaction) => {
//     navigate(`/sales/returns/new?transaction=${transaction.id}`);
//   }, [navigate]);

//   /**
//    * Handle export
//    */
//   const handleExport = useCallback(() => {
//     console.log('Export transactions');
//   }, []);

//   const canSeeAllBranches = user && ['ADMIN', 'MANAGER'].includes(user.role);

//   return (
//     <MainLayout
//       currentPath="/sales/history"
//       user={{ name: user?.name, role: user?.role, avatar: user?.name?.substring(0, 2) }}
//     >
//       <div className="space-y-6">
//         <Breadcrumbs
//           items={[
//             { label: 'Sales', href: '/sales' },
//             { label: 'Transaction History' },
//           ]}
//         />

//         <PageHeader
//           title="Transaction History"
//           description="View and manage all sales transactions"
//           badge={`${pagination.total || 0} transactions`}
//           actions={
//             <div className="flex items-center gap-2">
//               <Button
//                 variant="outline"
//                 icon={Download}
//                 onClick={handleExport}
//               >
//                 Export
//               </Button>
//               <Button
//                 variant="outline"
//                 onClick={() => setShowFilters(!showFilters)}
//               >
//                 {showFilters ? 'Hide Filters' : 'Show Filters'}
//               </Button>
//             </div>
//           }
//         />

//         {/* Statistics Cards */}
//         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//           <Card>
//             <CardBody className="p-4">
//               <div className="flex items-center gap-3">
//                 <div className="bg-success-600 rounded-lg p-3">
//                   <DollarSign className="h-6 w-6 text-white" />
//                 </div>
//                 <div>
//                   <div className="text-2xl font-bold text-gray-900">
//                     {formatCurrency(todayStats.totalSales)}
//                   </div>
//                   <div className="text-sm text-gray-600">Today's Sales</div>
//                 </div>
//               </div>
//             </CardBody>
//           </Card>

//           <Card>
//             <CardBody className="p-4">
//               <div className="flex items-center gap-3">
//                 <div className="bg-primary-600 rounded-lg p-3">
//                   <Receipt className="h-6 w-6 text-white" />
//                 </div>
//                 <div>
//                   <div className="text-2xl font-bold text-gray-900">
//                     {todayStats.totalTransactions}
//                   </div>
//                   <div className="text-sm text-gray-600">Today's Transactions</div>
//                 </div>
//               </div>
//             </CardBody>
//           </Card>

//           <Card>
//             <CardBody className="p-4">
//               <div className="flex items-center gap-3">
//                 <div className="bg-warning-600 rounded-lg p-3">
//                   <TrendingUp className="h-6 w-6 text-white" />
//                 </div>
//                 <div>
//                   <div className="text-2xl font-bold text-gray-900">
//                     {formatCurrency(allStats.totalSales)}
//                   </div>
//                   <div className="text-sm text-gray-600">Total Sales</div>
//                 </div>
//               </div>
//             </CardBody>
//           </Card>

//           <Card>
//             <CardBody className="p-4">
//               <div className="flex items-center gap-3">
//                 <div className="bg-purple-600 rounded-lg p-3">
//                   <ShoppingCart className="h-6 w-6 text-white" />
//                 </div>
//                 <div>
//                   <div className="text-2xl font-bold text-gray-900">
//                     {formatCurrency(
//                       allStats.totalTransactions > 0
//                         ? allStats.totalSales / allStats.totalTransactions
//                         : 0
//                     )}
//                   </div>
//                   <div className="text-sm text-gray-600">Avg. Transaction</div>
//                 </div>
//               </div>
//             </CardBody>
//           </Card>
//         </div>

//         {/* Filters */}
//         {showFilters && (
//           <TransactionFilters
//             filters={filters}
//             onApply={handleApplyFilters}
//             onClear={handleClearFilters}
//             showBranchFilter={canSeeAllBranches}
//             loading={isLoading}
//           />
//         )}

//         {/* Transactions List */}
//         <Card>
//           <CardBody>
//             <TransactionList
//               transactions={transactions}
//               loading={isLoading}
//               onView={handleView}
//               onPrintReceipt={handlePrintReceipt}
//               onReturn={handleProcessReturn}
//               sortColumn={sortColumn}
//               sortDirection={sortDirection}
//               onSort={handleSort}
//               searchQuery={searchQuery}
//               onSearchChange={setSearchQuery} // ✅ Still update local state for display
//               onSearch={handleDebouncedSearch} // ✅ Only this triggers fetch
//             />

//             {/* Pagination */}
//             {pagination.total > 0 && (
//               <div className="mt-6">
//                 <Pagination
//                   currentPage={pagination.page}
//                   totalPages={pagination.pages}
//                   totalItems={pagination.total}
//                   pageSize={pagination.limit}
//                   onPageChange={handlePageChange}
//                   onPageSizeChange={handlePageSizeChange}
//                   pageSizeOptions={[20, 50, 100, 200]}
//                 />
//               </div>
//             )}
//           </CardBody>
//         </Card>
//       </div>

//       <ReceiptPreview
//         isOpen={pos.modals.receipt}
//         onClose={pos.newTransaction}
//         transaction={pos.selectedTransaction}
//         store={storeInfo}
//         onPrint={() => console.log('Print receipt')}
//         loading={pos.isFetchingTransactionDetails}
//       />
//     </MainLayout>
//   );
// };

// export default SalesHistoryPage;

// src/pages/sales/SalesHistoryPage.jsx - FIXED SEARCH

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import TransactionList from '../../components/sales/TransactionList';
import TransactionSearchFilter from '../../components/sales/TransactionSearchFilter';
import TransactionFilters from '../../components/sales/TransactionFilters';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import Card, { CardBody } from '../../components/common/Card';
import { useTransactions } from '../../hooks/useTransactions';
import { useAuth } from '../../hooks/useAuth';
import { formatCurrency } from '../../utils/formatters';
import { usePOS } from '../../hooks/usePOS';
import ReceiptPreview from '../../components/pos/ReceiptPreview';
import { 
  Download, 
  Receipt, 
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Search,
  X
} from 'lucide-react';

const SalesHistoryPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchField, setSearchField] = useState('receiptNumber'); // ✅ NEW
  const [searchValue, setSearchValue] = useState(''); // ✅ NEW
  const [sortColumn, setSortColumn] = useState('timestamp');
  const [sortDirection, setSortDirection] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const {
    transactions,
    isLoading,
    pagination,
    filters,
    updateFilters,
    clearFilters,
    fetchTransactions,
    getTodayTotals,
    calculateTotals,
  } = useTransactions({
    autoFetch: true,
    initialLimit: 50,
  });

  const pos = usePOS();

  const storeInfo = {
    name: 'My Store',
    address: '123 Main St, City',
    phone: '+972-50-000-0000',
    taxId: '123456789',
    returnPolicy: 'Returns accepted within 30 days',
    website: 'www.mystore.com',
  };

  const todayStats = getTodayTotals();
  const allStats = calculateTotals();

  /**
   * ✅ NEW: Handle filtered search
   */
  const handleSearch = useCallback(({ field, value }) => {
    console.log('🔍 Filtered search:', { field, value });
    
    setSearchField(field);
    setSearchValue(value);
    setCurrentPage(1);
    
    fetchTransactions({
      search: value,
      searchField: field,
      page: 1,
      limit: pageSize,
      sortBy: sortColumn,
      sortOrder: sortDirection
    });
  }, [fetchTransactions, pageSize, sortColumn, sortDirection]);

  /**
   * ✅ NEW: Handle search clear
   */
  const handleClearSearch = useCallback(() => {
    console.log('🧹 Clearing search');
    
    setSearchField('receiptNumber');
    setSearchValue('');
    setCurrentPage(1);
    
    fetchTransactions({
      page: 1,
      limit: pageSize,
      sortBy: sortColumn,
      sortOrder: sortDirection
    });
  }, [fetchTransactions, pageSize, sortColumn, sortDirection]);

  /**
   * Handle sort
   */
  const handleSort = useCallback((column, direction) => {
    setSortColumn(column);
    setSortDirection(direction);
    fetchTransactions({ 
      sortBy: column, 
      sortOrder: direction,
      search: searchValue, // ✅ Preserve search
      searchField: searchField,
      page: currentPage,
      limit: pageSize
    });
  }, [fetchTransactions, searchValue, searchField, currentPage, pageSize]);

  /**
   * Handle pagination
   */
  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage);
    fetchTransactions({ 
      page: newPage, 
      limit: pageSize,
      search: searchValue, // ✅ Preserve search
      searchField: searchField,
      sortBy: sortColumn,
      sortOrder: sortDirection
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [fetchTransactions, pageSize, searchValue, searchField, sortColumn, sortDirection]);

  const handlePageSizeChange = useCallback((newSize) => {
    setPageSize(newSize);
    setCurrentPage(1);
    fetchTransactions({ 
      page: 1, 
      limit: newSize,
      search: searchValue, // ✅ Preserve search
      searchField: searchField,
      sortBy: sortColumn,
      sortOrder: sortDirection
    });
  }, [fetchTransactions, searchValue, searchField, sortColumn, sortDirection]);

  /**
   * Handle filter apply
   */
  const handleApplyFilters = useCallback((newFilters) => {
    updateFilters(newFilters);
    setCurrentPage(1);
    fetchTransactions({ 
      ...newFilters, 
      search: searchValue, // ✅ Preserve search
      searchField: searchField,
      page: 1,
      limit: pageSize,
      sortBy: sortColumn,
      sortOrder: sortDirection
    });
  }, [updateFilters, fetchTransactions, searchValue, searchField, pageSize, sortColumn, sortDirection]);

  /**
   * Handle filter clear
   */
  const handleClearFilters = useCallback(() => {
    clearFilters();
    setCurrentPage(1);
    fetchTransactions({ 
      page: 1,
      limit: pageSize,
      search: searchValue, // ✅ Preserve search
      searchField: searchField,
      sortBy: sortColumn,
      sortOrder: sortDirection
    });
  }, [clearFilters, fetchTransactions, searchValue, searchField, pageSize, sortColumn, sortDirection]);

  /**
   * Handle view transaction
   */
  const handleView = useCallback(async (transaction) => {
    try {
      navigate(`/sales/transactions/${transaction.id}`);
    } catch (error) {
      console.error('Error viewing transaction:', error);
    }
  }, [navigate]);

  /**
   * Handle print receipt
   */
  const handlePrintReceipt = useCallback(async (transaction) => {
    try {
      console.log('Printing receipt for transaction:', transaction);
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
    console.log('Export transactions');
  }, []);

  const canSeeAllBranches = user && ['ADMIN', 'MANAGER'].includes(user.role);

  return (
    <MainLayout
      currentPath="/sales/history"
      user={{ name: user?.name, role: user?.role, avatar: user?.name?.substring(0, 2) }}
    >
      <div className="space-y-6">
        <Breadcrumbs
          items={[
            { label: 'Sales', href: '/sales' },
            { label: 'Transaction History' },
          ]}
        />

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

        {/* Search Filter */}
        <TransactionSearchFilter
          onSearch={handleSearch}
          onClear={handleClearSearch}
          loading={isLoading}
        />

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
            {/* Show active search indicator */}
            {searchValue && (
              <div className="mb-4 flex items-center justify-between bg-primary-50 border border-primary-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary-600" />
                  <span className="text-sm text-primary-900">
                    Searching <strong>{searchField.replace(/([A-Z])/g, ' $1').trim()}</strong> for: 
                    <strong className="ml-1">{searchValue}</strong>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={X}
                  onClick={handleClearSearch}
                >
                  Clear
                </Button>
              </div>
            )}

            <TransactionList
              transactions={transactions}
              loading={isLoading}
              onView={handleView}
              onPrintReceipt={handlePrintReceipt}
              onReturn={handleProcessReturn}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              onSort={handleSort}
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
        loading={pos.isFetchingTransactionDetails}
      />
    </MainLayout>
  );
};

export default SalesHistoryPage;