// src/components/pos/PaymentMethodSelector.jsx
import { DollarSign, CreditCard, Smartphone, Banknote } from 'lucide-react';
import clsx from 'clsx';

/**
 * PaymentMethodSelector Component
 * 
 * Visual selector for payment methods (cash, card, mobile, etc.)
 * 
 * @example
 * <PaymentMethodSelector
 *   selectedMethod="cash"
 *   onSelectMethod={(method) => setMethod(method)}
 * />
 */

const PaymentMethodSelector = ({
  selectedMethod = 'cash',
  onSelectMethod,
  availableMethods = ['cash', 'card', 'mobile'],
  disabled = false,
  className = '',
}) => {
  const paymentMethods = {
    cash: {
      id: 'cash',
      label: 'Cash',
      icon: Banknote,
      description: 'Pay with cash',
      color: 'green',
    },
    card: {
      id: 'card',
      label: 'Card',
      icon: CreditCard,
      description: 'Credit/Debit card',
      color: 'blue',
    },
    mobile: {
      id: 'mobile',
      label: 'Mobile',
      icon: Smartphone,
      description: 'Mobile payment',
      color: 'purple',
    },
    other: {
      id: 'other',
      label: 'Other',
      icon: DollarSign,
      description: 'Other payment method',
      color: 'gray',
    },
  };

  const methods = availableMethods
    .map(id => paymentMethods[id])
    .filter(Boolean);

  const getColorClasses = (color, isSelected) => {
    const colors = {
      green: {
        border: 'border-success-200',
        bg: 'bg-success-50',
        text: 'text-success-700',
        icon: 'text-success-600',
        hover: 'hover:border-success-300',
      },
      blue: {
        border: 'border-primary-200',
        bg: 'bg-primary-50',
        text: 'text-primary-700',
        icon: 'text-primary-600',
        hover: 'hover:border-primary-300',
      },
      purple: {
        border: 'border-purple-200',
        bg: 'bg-purple-50',
        text: 'text-purple-700',
        icon: 'text-purple-600',
        hover: 'hover:border-purple-300',
      },
      gray: {
        border: 'border-gray-200',
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        icon: 'text-gray-600',
        hover: 'hover:border-gray-300',
      },
    };

    return isSelected ? colors[color] : {
      border: 'border-gray-200',
      bg: 'bg-white',
      text: 'text-gray-700',
      icon: 'text-gray-500',
      hover: 'hover:border-gray-300',
    };
  };

  return (
    <div className={clsx('grid grid-cols-2 md:grid-cols-4 gap-3', className)}>
      {methods.map((method) => {
        const Icon = method.icon;
        const isSelected = selectedMethod === method.id;
        const colorClasses = getColorClasses(method.color, isSelected);

        return (
          <button
            key={method.id}
            onClick={() => onSelectMethod(method.id)}
            disabled={disabled}
            className={clsx(
              'relative p-4 rounded-lg border-2 transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              colorClasses.border,
              colorClasses.bg,
              colorClasses.hover,
              {
                'shadow-md': isSelected,
              }
            )}
          >
            {/* Selected indicator */}
            {isSelected && (
              <div className="absolute top-2 right-2">
                <div className={clsx(
                  'h-5 w-5 rounded-full flex items-center justify-center',
                  colorClasses.bg
                )}>
                  <svg className={clsx('h-3 w-3', colorClasses.icon)} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            )}

            {/* Icon */}
            <div className="flex justify-center mb-2">
              <Icon className={clsx('h-8 w-8', colorClasses.icon)} />
            </div>

            {/* Label */}
            <div className={clsx('font-semibold text-sm', colorClasses.text)}>
              {method.label}
            </div>

            {/* Description */}
            <div className="text-xs text-gray-500 mt-1">
              {method.description}
            </div>
          </button>
        );
      })}
    </div>
  );
};

PaymentMethodSelector.displayName = 'PaymentMethodSelector';

export default PaymentMethodSelector;