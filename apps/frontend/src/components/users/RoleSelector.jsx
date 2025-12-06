// =====================================
// src/components/users/RoleSelector.jsx
// =====================================

import { Shield, Users, CreditCard, Package } from 'lucide-react';

const RoleSelector = ({
  selectedRole,
  onChange,
  availableRoles = ['ADMIN', 'MANAGER', 'CASHIER', 'STOCK_MANAGER'],
  error,
}) => {
  const roles = [
    {
      value: 'ADMIN',
      label: 'Administrator',
      icon: Shield,
      description: 'Full system access and control',
      color: 'danger',
    },
    {
      value: 'MANAGER',
      label: 'Manager',
      icon: Users,
      description: 'Manage inventory, sales, and staff',
      color: 'primary',
    },
    {
      value: 'CASHIER',
      label: 'Cashier',
      icon: CreditCard,
      description: 'Process sales and returns',
      color: 'success',
    },
    {
      value: 'STOCK_MANAGER',
      label: 'Stock Manager',
      icon: Package,
      description: 'Manage inventory and stock',
      color: 'warning',
    },
  ];

  const filteredRoles = roles.filter(role => availableRoles.includes(role.value));

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-3">
        {filteredRoles.map((role) => {
          const Icon = role.icon;
          const isSelected = selectedRole === role.value;
          const colorClasses = {
            danger: {
              border: 'border-danger-300 bg-danger-50',
              icon: 'bg-danger-600 text-white',
              ring: 'ring-2 ring-danger-500',
            },
            primary: {
              border: 'border-primary-300 bg-primary-50',
              icon: 'bg-primary-600 text-white',
              ring: 'ring-2 ring-primary-500',
            },
            success: {
              border: 'border-success-300 bg-success-50',
              icon: 'bg-success-600 text-white',
              ring: 'ring-2 ring-success-500',
            },
            warning: {
              border: 'border-warning-300 bg-warning-50',
              icon: 'bg-warning-600 text-white',
              ring: 'ring-2 ring-warning-500',
            },
          };

          const colors = colorClasses[role.color];

          return (
            <button
              key={role.value}
              type="button"
              onClick={() => onChange(role.value)}
              className={`
                relative flex items-center gap-3 p-4 rounded-lg border-2 transition-all
                ${isSelected 
                  ? `${colors.border} ${colors.ring}` 
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className={`
                flex-shrink-0 h-12 w-12 rounded-lg flex items-center justify-center
                ${isSelected ? colors.icon : 'bg-gray-200'}
              `}>
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900">{role.label}</div>
                <div className="text-sm text-gray-600">{role.description}</div>
              </div>
            </button>
          );
        })}
      </div>
      {error && (
        <p className="text-sm text-danger-600 mt-1">{error}</p>
      )}
    </div>
  );
};

export default RoleSelector;
