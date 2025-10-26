// src/components/pos/PaymentModal.jsx
import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Alert from '../common/Alert';
import PaymentMethodSelector from './PaymentMethodSelector';
import CashCalculator from './CashCalculator';
import { CreditCard, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

/**
 * PaymentModal Component
 * 
 * Modal for processing payment with multiple payment methods.
 * Handles cash, card, and mixed payments.
 * 
 * @example
 * <PaymentModal
 *   isOpen={paymentOpen}
 *   onClose={() => setPaymentOpen(false)}
 *   total={150.00}
 *   onComplete={handlePaymentComplete}
 * />
 */

const PaymentModal = ({
  isOpen,
  onClose,
  total = 0,
  items = [],
  discount = null,
  tax = null,
  onComplete,
  onError,
  allowPartialPayment = false,
  paymentMethods = ['cash', 'card', 'mobile'],
  className = '',
}) => {
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [cashAmount, setCashAmount] = useState(total);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [paymentDetails, setPaymentDetails] = useState({});

  const handlePaymentMethodChange = (method) => {
    setSelectedMethod(method);
    setError('');
    
    // Reset cash amount when switching methods
    if (method === 'cash') {
      setCashAmount(total);
    }
  };

  const handleCashAmountChange = (amount) => {
    setCashAmount(amount);
    setError('');
  };

  const validatePayment = () => {
    if (selectedMethod === 'cash') {
      if (cashAmount < total) {
        setError(`Insufficient amount. Need at least ₪${total.toFixed(2)}`);
        return false;
      }
    }

    if (selectedMethod === 'card' && !paymentDetails.cardNumber) {
      setError('Please enter card details');
      return false;
    }

    return true;
  };

  const handleComplete = async () => {
    if (!validatePayment()) return;

    setProcessing(true);
    setError('');

    try {
      const payment = {
        method: selectedMethod,
        amount: total,
        receivedAmount: selectedMethod === 'cash' ? cashAmount : total,
        change: selectedMethod === 'cash' ? cashAmount - total : 0,
        details: paymentDetails,
        timestamp: new Date().toISOString(),
      };

      await onComplete?.(payment);
      
      setSuccess(true);
      
      // Close modal after short delay
      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (err) {
      setError(err.message || 'Payment processing failed');
      onError?.(err);
    } finally {
      setProcessing(false);
    }
  };

  const handleClose = () => {
    if (processing) return;
    
    setSelectedMethod('cash');
    setCashAmount(total);
    setError('');
    setSuccess(false);
    setPaymentDetails({});
    onClose?.();
  };

  const change = selectedMethod === 'cash' ? Math.max(0, cashAmount - total) : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Process Payment"
      size="lg"
      closeOnOverlayClick={!processing}
      closeOnEsc={!processing}
      showCloseButton={!processing && !success}
      className={className}
    >
      <div className="space-y-6">
        {/* Success Message */}
        {success && (
          <Alert variant="success" icon={CheckCircle}>
            Payment processed successfully!
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="danger" closable onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Order Summary */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Order Summary
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Items</span>
              <span className="font-medium">{items.length}</span>
            </div>
            
            {discount && discount.amount > 0 && (
              <div className="flex justify-between text-success-600">
                <span>Discount</span>
                <span>-₪{discount.amount.toFixed(2)}</span>
              </div>
            )}
            
            {tax && tax.amount > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Tax ({tax.rate}%)</span>
                <span className="font-medium">₪{tax.amount.toFixed(2)}</span>
              </div>
            )}
            
            <div className="pt-2 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total</span>
                <span className="text-2xl font-bold text-gray-900">
                  ₪{total.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Method Selection */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 mb-3">
            Payment Method
          </h3>
          <PaymentMethodSelector
            selectedMethod={selectedMethod}
            onSelectMethod={handlePaymentMethodChange}
            availableMethods={paymentMethods}
            disabled={processing}
          />
        </div>

        {/* Cash Calculator */}
        {selectedMethod === 'cash' && (
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Cash Payment
            </h3>
            <CashCalculator
              total={total}
              receivedAmount={cashAmount}
              onAmountChange={handleCashAmountChange}
              disabled={processing}
            />
            
            {/* Change Display */}
            {change > 0 && (
              <div className="mt-4 p-4 bg-success-50 border border-success-200 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-success-900">
                    Change to Return
                  </span>
                  <span className="text-2xl font-bold text-success-700">
                    ₪{change.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Card Payment Fields */}
        {selectedMethod === 'card' && (
          <div className="space-y-3">
            <Alert variant="info">
              Card payment integration coming soon. For now, process manually and click Complete.
            </Alert>
          </div>
        )}

        {/* Mobile Payment Fields */}
        {selectedMethod === 'mobile' && (
          <div className="space-y-3">
            <Alert variant="info">
              Mobile payment integration coming soon. For now, process manually and click Complete.
            </Alert>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={processing}
            fullWidth
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={CreditCard}
            onClick={handleComplete}
            loading={processing}
            disabled={processing || success}
            fullWidth
          >
            {processing ? 'Processing...' : `Complete Payment • ₪${total.toFixed(2)}`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

PaymentModal.displayName = 'PaymentModal';

export default PaymentModal;