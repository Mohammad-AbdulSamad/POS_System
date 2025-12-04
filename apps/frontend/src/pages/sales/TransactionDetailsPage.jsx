// src/pages/sales/TransactionDetailsPage.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import TransactionDetails from '../../components/sales/TransactionDetails';
import Button from '../../components/common/Button';
import Spinner from '../../components/common/Spinner';
import { useTransactions } from '../../hooks/useTransactions';
import { useAuth } from '../../hooks/useAuth';
import { usePOS } from '../../hooks/usePOS';
import ReceiptPreview from '../../components/pos/ReceiptPreview';
import { ArrowLeft, Receipt, RotateCcw, Download } from 'lucide-react';

/**
 * TransactionDetailsPage
 * 
 * Page for viewing detailed transaction information
 */

const TransactionDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [transaction, setTransaction] = useState(null);
  const [loadingTransaction, setLoadingTransaction] = useState(true);

  const { fetchTransactionById, isLoading } = useTransactions({ autoFetch: false });


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


  // Load transaction
  const loadTransaction = useCallback(async () => {
    if (!id) return;

    setLoadingTransaction(true);
    try {
      const data = await fetchTransactionById(id, true);
      setTransaction(data);
    } catch (error) {
      console.error('Failed to load transaction:', error);
      navigate('/sales/history');
    } finally {
      setLoadingTransaction(false);
    }
  }, [id, fetchTransactionById, navigate]);

  useEffect(() => {
    loadTransaction();
  }, [loadTransaction]);

  /**
   * Handle print receipt
   */
    /**
   * Handle print receipt
   */
    function handlePrintReceipt(transaction) {
        console.log('Printing receipt for transaction:', transaction);
        pos.viewTransaction(transaction);
    }

  /**
   * Handle process return
   */
  const handleProcessReturn = useCallback((transaction) => {
    navigate(`/sales/returns/new?transaction=${transaction.id}`);
  }, [navigate]);

  /**
   * Handle download receipt
   */
  const handleDownloadReceipt = useCallback(() => {
    // TODO: Implement download
    console.log('Download receipt');
  }, []);

  if (loadingTransaction) {
    return (
      <MainLayout
        currentPath="/sales/history"
        user={{ name: user?.name, role: user?.role, avatar: user?.name?.substring(0, 2) }}
      >
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </MainLayout>
    );
  }

  if (!transaction) {
    return (
      <MainLayout
        currentPath="/sales/history"
        user={{ name: user?.name, role: user?.role, avatar: user?.name?.substring(0, 2) }}
      >
        <div className="text-center py-12">
          <p className="text-gray-500">Transaction not found</p>
          <Button
            variant="primary"
            className="mt-4"
            onClick={() => navigate('/sales/history')}
          >
            Back to History
          </Button>
        </div>
      </MainLayout>
    );
  }

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
            { label: 'Transaction History', href: '/sales/history' },
            { label: transaction.receiptNumber },
          ]}
        />

        {/* Page Header */}
        <PageHeader
          title={`Transaction ${transaction.receiptNumber}`}
          description={`Completed on ${new Date(transaction.timestamp).toLocaleString()}`}
          backButton={
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/sales/history')}
            >
              Back to History
            </Button>
          }
          actions={
            <div className="flex gap-2">
              <Button
                variant="outline"
                icon={Download}
                onClick={handleDownloadReceipt}
              >
                Download
              </Button>
              <Button
                variant="outline"
                icon={Receipt}
                onClick={() => handlePrintReceipt(transaction)}
              >
                Print Receipt
              </Button>
              {transaction.status === 'COMPLETED' && (
                <Button
                  variant="warning"
                  icon={RotateCcw}
                  onClick={() => handleProcessReturn(transaction)}
                >
                  Process Return
                </Button>
              )}
            </div>
          }
        />

        {/* Transaction Details */}
        <TransactionDetails
          transaction={transaction}
          loading={isLoading}
          onPrintReceipt={handlePrintReceipt}
          onProcessReturn={handleProcessReturn}
        />
      </div>

      <ReceiptPreview
        isOpen={pos.modals.receipt}
        onClose={pos.newTransaction}
        transaction={pos.selectedTransaction}
        store={storeInfo}
        onPrint={() => console.log('Print receipt')}
      />
    </MainLayout>
  );
};

export default TransactionDetailsPage;