// src/components/pos/DiscountModal.jsx
import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import { RadioGroup } from '../common/Radio';
import Alert from '../common/Alert';
import { Tag, Percent } from 'lucide-react';

/**
 * DiscountModal Component
 * 
 * Modal for applying discounts (percentage or fixed amount).
 * 
 * @example
 * <DiscountModal
 *   isOpen={discountOpen}
 *   onClose={() => setDiscountOpen(false)}
 *   subtotal={150.00}
 *   onApply={handleDiscountApply}
 * />
 */

const DiscountModal = ({
  isOpen,
  onClose,
  subtotal = 0,
  currentDiscount = null,
  onApply,
  maxDiscountPercent = 50,
  maxDiscountAmount = null,
  requiresApproval = false,
  className = '',
}) => {
  const [discountType, setDiscountType] = useState(currentDiscount?.type || 'percentage');
  const [discountValue, setDiscountValue] = useState(currentDiscount?.value?.toString() || '');
  const [reason, setReason] = useState(currentDiscount?.reason || '');
  const [error, setError] = useState('');

  const validateDiscount = () => {
    const value = parseFloat(discountValue) || 0;

    if (value <= 0) {
      setError('Discount value must be greater than 0');
      return false;
    }

    if (discountType === 'percentage') {
      if (value > maxDiscountPercent) {
        setError(`Maximum discount is ${maxDiscountPercent}%`);
        return false;
      }
      if (value > 100) {
        setError('Percentage cannot exceed 100%');
        return false;
      }
    }

    if (discountType === 'fixed') {
      if (value >= subtotal) {
        setError('Discount cannot be greater than or equal to subtotal');
        return false;
      }
      if (maxDiscountAmount && value > maxDiscountAmount) {
        setError(`Maximum discount amount is ₪${maxDiscountAmount.toFixed(2)}`);
        return false;
      }
    }

    return true;
  };

  const calculateDiscount = () => {
    const value = parseFloat(discountValue) || 0;
    
    if (discountType === 'percentage') {
      return subtotal * (value / 100);
    } else {
      return value;
    }
  };

  const handleApply = () => {
    if (!validateDiscount()) return;

    const value = parseFloat(discountValue) || 0;
    const amount = calculateDiscount();

    const discount = {
      type: discountType,
      value,
      amount,
      reason: reason.trim(),
      appliedAt: new Date().toISOString(),
      requiresApproval: requiresApproval && (
        (discountType === 'percentage' && value > maxDiscountPercent * 0.5) ||
        (discountType === 'fixed' && amount > subtotal * 0.3)
      ),
    };

    onApply?.(discount);
    handleClose();
  };

  const handleRemove = () => {
    onApply?.(null);
    handleClose();
  };

  const handleClose = () => {
    setDiscountValue(currentDiscount?.value?.toString() || '');
    setDiscountType(currentDiscount?.type || 'percentage');
    setReason(currentDiscount?.reason || '');
    setError('');
    onClose?.();
  };

  const discountAmount = discountValue ? calculateDiscount() : 0;
  const finalTotal = subtotal - discountAmount;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Apply Discount"
      size="md"
      className={className}
    >
      <div className="space-y-4">
        {/* Error Alert */}
        {error && (
          <Alert variant="danger" closable onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Current Order Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Subtotal</span>
            <span className="font-semibold">₪{subtotal.toFixed(2)}</span>
          </div>
          {discountAmount > 0 && (
            <>
              <div className="flex justify-between text-sm mb-2 text-success-600">
                <span>Discount</span>
                <span className="font-semibold">-₪{discountAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                <span>New Total</span>
                <span>₪{finalTotal.toFixed(2)}</span>
              </div>
            </>
          )}
        </div>

        {/* Discount Type Selection */}
        <RadioGroup
          label="Discount Type"
          value={discountType}
          onChange={setDiscountType}
          options={[
            {
              value: 'percentage',
              label: 'Percentage Discount',
              description: `Up to ${maxDiscountPercent}% off`,
            },
            {
              value: 'fixed',
              label: 'Fixed Amount',
              description: 'Discount by specific amount',
            },
          ]}
        />

        {/* Discount Value Input */}
        <div>
          <Input
            label="Discount Value"
            type="number"
            value={discountValue}
            onChange={(e) => {
              setDiscountValue(e.target.value);
              setError('');
            }}
            placeholder={discountType === 'percentage' ? '0' : '0.00'}
            leftIcon={discountType === 'percentage' ? Percent : Tag}
            min="0"
            step={discountType === 'percentage' ? '1' : '0.01'}
            max={discountType === 'percentage' ? '100' : undefined}
            helperText={
              discountType === 'percentage'
                ? `Enter percentage (max ${maxDiscountPercent}%)`
                : maxDiscountAmount
                ? `Enter amount (max ₪${maxDiscountAmount.toFixed(2)})`
                : 'Enter discount amount'
            }
          />
        </div>

        {/* Discount Reason */}
        <div>
          <Input
            label="Reason (Optional)"
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Customer loyalty, Damaged item"
            helperText="Provide a reason for this discount"
          />
        </div>

        {/* Approval Warning */}
        {requiresApproval && discountAmount > subtotal * 0.3 && (
          <Alert variant="warning">
            This discount requires manager approval
          </Alert>
        )}

        {/* Preview */}
        {discountAmount > 0 && (
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-success-900">
                  Discount Preview
                </div>
                <div className="text-xs text-success-700 mt-1">
                  {discountType === 'percentage' 
                    ? `${discountValue}% off` 
                    : `₪${discountValue} off`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-success-700">
                  -₪{discountAmount.toFixed(2)}
                </div>
                <div className="text-xs text-success-600">
                  Save {((discountAmount / subtotal) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {currentDiscount && (
            <Button
              variant="outline"
              onClick={handleRemove}
              className="text-danger-600"
            >
              Remove Discount
            </Button>
          )}
          <Button
            variant="outline"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleApply}
            disabled={!discountValue || parseFloat(discountValue) <= 0}
            className="flex-1"
          >
            Apply Discount
          </Button>
        </div>
      </div>
    </Modal>
  );
};

DiscountModal.displayName = 'DiscountModal';

export default DiscountModal;