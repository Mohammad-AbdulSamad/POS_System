import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Alert from '../common/Alert';
import PaymentMethodSelector from './PaymentMethodSelector';
import CashCalculator from './CashCalculator';
import { CreditCard, CheckCircle } from 'lucide-react';
import {CURRENCY_SYMBOL} from '../../config/constants';
import clsx from 'clsx';

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
  currency = CURRENCY_SYMBOL,
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
    if (method === 'cash') setCashAmount(total);
  };

  const handleCashAmountChange = (amount) => {
    setCashAmount(amount);
    setError('');
  };

  const validatePayment = () => {
    if (selectedMethod === 'cash' && cashAmount < total) {
      setError(`Insufficient amount. Need at least ₪${total.toFixed(2)}`);
      return false;
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

      setTimeout(() => handleClose(), 1500);
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
      size="full"
      closeOnOverlayClick={!processing}
      closeOnEsc={!processing}
      showCloseButton={!processing && !success}
      className={clsx('max-h-[90vh]', className)}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        {/* LEFT COLUMN */}
        <div className="flex flex-col justify-between">
          {/* Alerts */}
          <div className="space-y-3">
            {success && (
              <Alert variant="success" icon={CheckCircle}>
                Payment processed successfully!
              </Alert>
            )}
            {error && (
              <Alert variant="danger" closable onClose={() => setError('')}>
                {error}
              </Alert>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 rounded-lg p-4 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Order Summary</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Items</span>
                <span className="font-medium">{items.length}</span>
              </div>

              {discount && discount.amount > 0 && (
                <div className="flex justify-between text-success-600">
                  <span>Discount</span>
                  <span>-{currency}{discount.amount.toFixed(2)}</span>
                </div>
              )}

              {tax && tax.amount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax ({tax.rate}%)</span>
                  <span className="font-medium">{currency}{tax.amount.toFixed(2)}</span>
                </div>
              )}

              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Total</span>
                  <span className="text-2xl font-bold text-gray-900">{currency}{total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="mt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Method</h3>
            <PaymentMethodSelector
              selectedMethod={selectedMethod}
              onSelectMethod={handlePaymentMethodChange}
              availableMethods={paymentMethods}
              disabled={processing}
            />
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex flex-col justify-between">
          {/* Dynamic Payment Section */}
          <div className="flex-1 space-y-4">
            {selectedMethod === 'cash' && (
              <>
                <h3 className="text-sm font-semibold text-gray-900">Cash Payment</h3>
                <CashCalculator
                  total={total}
                  receivedAmount={cashAmount}
                  onAmountChange={handleCashAmountChange}
                  disabled={processing}
                />

                {change > 0 && (
                  <div className="p-3 bg-success-50 border border-success-200 rounded-lg mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-success-900">Change to Return</span>
                      <span className="text-2xl font-bold text-success-700">
                        {currency}{change.toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </>
            )}

            {selectedMethod === 'card' && (
              <Alert variant="info">
                Card payment integration coming soon. Process manually and click Complete.
              </Alert>
            )}

            {selectedMethod === 'mobile' && (
              <Alert variant="info">
                Mobile payment integration coming soon. Process manually and click Complete.
              </Alert>
            )}
          </div>

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
      </div>
    </Modal>
  );
};

PaymentModal.displayName = 'PaymentModal';
export default PaymentModal;
