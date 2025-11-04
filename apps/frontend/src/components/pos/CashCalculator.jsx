// src/components/pos/CashCalculator.jsx
import { useState } from 'react';
import Button from '../common/Button';
import Input from '../common/Input';
import { DollarSign } from 'lucide-react';
import {CURRENCY_SYMBOL} from '../../config/constants';
import clsx from 'clsx';

/**
 * CashCalculator Component
 * 
 * Quick cash amount calculator with preset denominations.
 * 
 * @example
 * <CashCalculator
 *   total={150.00}
 *   receivedAmount={200.00}
 *   onAmountChange={(amount) => setAmount(amount)}
 * />
 */

const CashCalculator = ({
  total = 0,
  receivedAmount = 0,
  onAmountChange,
  disabled = false,
  currency = CURRENCY_SYMBOL,
  denominations = [10, 20, 50, 100, 200],
  className = '',
}) => {
  const [customAmount, setCustomAmount] = useState(receivedAmount.toString());

  const handleDenominationClick = (amount) => {
    const newAmount = receivedAmount + amount;
    setCustomAmount(newAmount.toString());
    onAmountChange?.(newAmount);
  };

  const handleExactClick = () => {
    setCustomAmount(total.toString());
    onAmountChange?.(total);
  };

  const handleClearClick = () => {
    setCustomAmount('0');
    onAmountChange?.(0);
  };

  const handleCustomAmountChange = (e) => {
    const value = e.target.value;
    setCustomAmount(value);
    
    const numValue = parseFloat(value) || 0;
    onAmountChange?.(numValue);
  };

  const change = receivedAmount - total;
  const isInsufficient = receivedAmount < total;

  return (
    <div className={clsx('space-y-4', className)}>
      {/* Amount Input */}
      <div>
        <Input
          label="Received Amount"
          type="number"
          value={customAmount}
          onChange={handleCustomAmountChange}
          leftIcon={DollarSign}
          disabled={disabled}
          min="0"
          step="0.01"
          placeholder="0.00"
          helperText={isInsufficient ? `Need ${currency}${(total - receivedAmount).toFixed(2)} more` : ''}
          error={isInsufficient ? `Insufficient amount` : ''}
        />
      </div>

      {/* Quick Amount Buttons */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Quick Add
        </label>
        <div className="grid grid-cols-3 gap-2">
          {denominations.map((amount) => (
            <Button
              key={amount}
              variant="outline"
              size="lg"
              onClick={() => handleDenominationClick(amount)}
              disabled={disabled}
              className="font-semibold"
            >
              +{currency}{amount}
            </Button>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          onClick={handleExactClick}
          disabled={disabled}
        >
          Exact Amount
        </Button>
        <Button
          variant="outline"
          onClick={handleClearClick}
          disabled={disabled}
        >
          Clear
        </Button>
      </div>

      {/* Change Display */}
      <div className={clsx(
        'p-4 rounded-lg border-2',
        {
          'bg-success-50 border-success-200': !isInsufficient && change > 0,
          'bg-gray-50 border-gray-200': !isInsufficient && change === 0,
          'bg-danger-50 border-danger-200': isInsufficient,
        }
      )}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-700 mb-1">
              {isInsufficient ? 'Insufficient' : change > 0 ? 'Change' : 'Exact Amount'}
            </div>
            <div className="text-xs text-gray-600">
              Received: {currency}{receivedAmount.toFixed(2)} • Total: {currency}{total.toFixed(2)}
            </div>
          </div>
          <div className={clsx(
            'text-2xl font-bold',
            {
              'text-success-700': !isInsufficient && change > 0,
              'text-gray-700': !isInsufficient && change === 0,
              'text-danger-700': isInsufficient,
            }
          )}>
            {currency}{Math.abs(change).toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

CashCalculator.displayName = 'CashCalculator';

export default CashCalculator;