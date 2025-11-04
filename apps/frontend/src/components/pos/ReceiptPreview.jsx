// src/components/pos/ReceiptPreview.jsx
import { useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Receipt from './Receipt';
import { Printer, Download, Mail } from 'lucide-react';

/**
 * ReceiptPreview Component
 * 
 * Modal for previewing and printing receipts.
 * 
 * @example
 * <ReceiptPreview
 *   isOpen={previewOpen}
 *   onClose={() => setPreviewOpen(false)}
 *   transaction={completedTransaction}
 * />
 */

const ReceiptPreview = ({
  isOpen,
  onClose,
  transaction,
  store,
  onPrint,
  onDownload,
  onEmail,
  showActions = true,
  className = '',
}) => {
  const receiptRef = useRef(null);


  useEffect(() => {
    console.log('Hello world //////////////////////////////////')
    console.log(transaction);
  }
  ,[])

  const handlePrint = () => {
    if (onPrint) {
      onPrint(transaction);
    } else {
      // Default print behavior
      window.print();
    }
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(transaction);
    } else {
      // Default download logic would go here
      console.log('Download receipt:', transaction.id);
    }
  };

  const handleEmail = () => {
    if (onEmail) {
      onEmail(transaction);
    } else {
      console.log('Email receipt:', transaction.id);
    }
  };

  const footer = showActions ? (
    <div className="flex gap-2">
      <Button
        variant="outline"
        icon={Download}
        onClick={handleDownload}
      >
        Download
      </Button>
      {/* {transaction.customer?.email && (
        <Button
          variant="outline"
          icon={Mail}
          onClick={handleEmail}
        >
          Email
        </Button>
      )} */}
      <Button
        variant="primary"
        icon={Printer}
        onClick={handlePrint}
        className="flex-1"
      >
        Print Receipt
      </Button>
    </div>
  ) : null;

  return (
    
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Receipt Preview"
      size="md"
      footer={footer}
      className={className}
    >
      <div className="bg-gray-50 p-4 rounded-lg max-h-[70vh] overflow-y-auto">
        <Receipt
          ref={receiptRef}
          transaction={transaction}
          store={store}
        />
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .receipt-container,
          .receipt-container * {
            visibility: visible;
          }
          .receipt-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
          }
        }
      `}</style>
    </Modal>
  );
};

ReceiptPreview.displayName = 'ReceiptPreview';

export default ReceiptPreview;