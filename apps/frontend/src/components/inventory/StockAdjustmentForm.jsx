// src/components/inventory/StockAdjustmentForm.jsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Select from '../common/Select';
import TextArea from '../common/TextArea';
import Alert from '../common/Alert';
import { Save, X, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react';
import { STOCK_MOVEMENT_REASONS, STOCK_MOVEMENT_LABELS } from '../../utils/constants';

/**
 * StockAdjustmentForm Component
 * 
 * Modal form for adjusting product stock
 * Supports positive/negative adjustments with reasons
 */

const StockAdjustmentForm = ({
  isOpen,
  onClose,
  product,
  onSubmit,
  loading = false,
}) => {
  const [adjustmentType, setAdjustmentType] = useState('increase'); // 'increase' or 'decrease'

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset,
  } = useForm({
    defaultValues: {
      quantity: '',
      reason: STOCK_MOVEMENT_REASONS.ADJUSTMENT,
      notes: '',
    },
  });

  const quantity = watch('quantity');
  const currentStock = product?.stock || 0;

  // Calculate new stock level
  const calculateNewStock = () => {
    const qty = parseInt(quantity) || 0;
    const change = adjustmentType === 'increase' ? qty : -qty;
    return currentStock + change;
  };

  const newStock = calculateNewStock();
  const isValidStock = newStock >= 0;

  // Handle form submission
  const onFormSubmit = (data) => {
    const qty = parseInt(data.quantity);
    const change = adjustmentType === 'increase' ? qty : -qty;

    onSubmit({
      productId: product.id,
      change,
      reason: data.reason,
      notes: data.notes,
    });

    reset();
  };

  // Handle modal close
  const handleClose = () => {
    reset();
    setAdjustmentType('increase');
    onClose();
  };

  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Adjust Stock"
      size="md"
    >
      <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Product Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-start gap-4">
            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{product.name}</h3>
              <p className="text-sm text-gray-600">SKU: {product.sku}</p>
              <div className="mt-2">
                <span className="text-sm text-gray-600">Current Stock: </span>
                <span className="font-semibold text-gray-900">
                  {currentStock} {product.unit || 'pcs'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Adjustment Type Selector */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Adjustment Type
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setAdjustmentType('increase')}
              className={`
                flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all
                ${adjustmentType === 'increase'
                  ? 'border-success-500 bg-success-50 text-success-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }
              `}
            >
              <Plus className="h-5 w-5" />
              <span className="font-medium">Increase Stock</span>
            </button>
            <button
              type="button"
              onClick={() => setAdjustmentType('decrease')}
              className={`
                flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all
                ${adjustmentType === 'decrease'
                  ? 'border-danger-500 bg-danger-50 text-danger-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-700'
                }
              `}
            >
              <Minus className="h-5 w-5" />
              <span className="font-medium">Decrease Stock</span>
            </button>
          </div>
        </div>

        {/* Quantity */}
        <Input
          label="Quantity"
          type="number"
          min="1"
          required
          {...register('quantity', {
            required: 'Quantity is required',
            min: {
              value: 1,
              message: 'Quantity must be at least 1',
            },
          })}
          error={errors.quantity?.message}
          placeholder="Enter quantity"
          icon={adjustmentType === 'increase' ? TrendingUp : TrendingDown}
        />

        {/* Stock Preview */}
        {quantity && (
          <div className={`
            p-4 rounded-lg border-2
            ${isValidStock
              ? 'bg-blue-50 border-blue-200'
              : 'bg-danger-50 border-danger-200'
            }
          `}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">
                New Stock Level:
              </span>
              <span className={`text-2xl font-bold ${
                isValidStock ? 'text-blue-700' : 'text-danger-700'
              }`}>
                {newStock} {product.unit || 'pcs'}
              </span>
            </div>
            {!isValidStock && (
              <Alert variant="danger" className="mt-3">
                Cannot decrease stock below zero. Please reduce the quantity.
              </Alert>
            )}
          </div>
        )}

        {/* Reason */}
        <Select
          label="Reason"
          required
          {...register('reason', {
            required: 'Reason is required',
          })}
          error={errors.reason?.message}
        >
          {Object.entries(STOCK_MOVEMENT_REASONS).map(([key, value]) => (
            <option key={value} value={value}>
              {STOCK_MOVEMENT_LABELS[value]}
            </option>
          ))}
        </Select>

        {/* Notes */}
        <TextArea
          label="Notes (Optional)"
          rows={3}
          {...register('notes')}
          placeholder="Add any additional notes about this adjustment..."
        />

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            icon={X}
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant={adjustmentType === 'increase' ? 'success' : 'danger'}
            icon={Save}
            loading={loading}
            disabled={loading || !isValidStock}
          >
            {adjustmentType === 'increase' ? 'Increase' : 'Decrease'} Stock
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default StockAdjustmentForm;