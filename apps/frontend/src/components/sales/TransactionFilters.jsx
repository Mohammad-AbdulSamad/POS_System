// src/components/sales/TransactionFilters.jsx
import { useState } from 'react';
import Card, { CardBody } from '../common/Card';
import Button from '../common/Button';
import Select from '../common/Select';
import Input from '../common/Input';
import { Filter, X, Calendar } from 'lucide-react';

/**
 * TransactionFilters Component
 * 
 * Provides filtering options for transactions:
 * - Date range
 * - Status
 * - Payment method
 * - Branch (for admins)
 * - Customer
 */

const TransactionFilters = ({
  filters = {},
  onApply,
  onClear,
  branches = [],
  showBranchFilter = false,
  loading = false,
}) => {
  const [localFilters, setLocalFilters] = useState({
    status: filters.status || '',
    paymentMethod: filters.paymentMethod || '',
    branchId: filters.branchId || '',
    startDate: filters.startDate || '',
    endDate: filters.endDate || '',
    minAmount: filters.minAmount || '',
    maxAmount: filters.maxAmount || '',
  });

  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (field, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleApply = () => {
    // Remove empty filters
    const cleanedFilters = Object.fromEntries(
      Object.entries(localFilters).filter(([_, value]) => value !== '')
    );
    onApply(cleanedFilters);
  };

  const handleClear = () => {
    const emptyFilters = {
      status: '',
      paymentMethod: '',
      branchId: '',
      startDate: '',
      endDate: '',
      minAmount: '',
      maxAmount: '',
    };
    setLocalFilters(emptyFilters);
    onClear();
  };

  const hasActiveFilters = Object.values(localFilters).some(value => value !== '');

  // Quick date range presets
  const setDateRange = (preset) => {
    const now = new Date();
    let startDate = new Date();

    switch (preset) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'yesterday':
        startDate.setDate(now.getDate() - 1);
        startDate.setHours(0, 0, 0, 0);
        now.setDate(now.getDate() - 1);
        now.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        return;
    }

    setLocalFilters(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    }));
  };

  return (
    <Card>
      <CardBody>
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Filters
              </h3>
              {hasActiveFilters && (
                <span className="text-sm text-primary-600 font-medium">
                  (Active)
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Hide' : 'Show'}
            </Button>
          </div>

          {/* Quick Date Presets */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange('today')}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange('yesterday')}
            >
              Yesterday
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange('week')}
            >
              Last 7 Days
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDateRange('month')}
            >
              Last 30 Days
            </Button>
          </div>

          {/* Expanded Filters */}
          {isExpanded && (
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Date Range */}
                <Input
                  label="Start Date"
                  type="date"
                  value={localFilters.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                  icon={Calendar}
                />

                <Input
                  label="End Date"
                  type="date"
                  value={localFilters.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                  icon={Calendar}
                />

                {/* Status Filter */}
                <Select
                  label="Status"
                  value={localFilters.status}
                  onChange={(e) => handleChange('status', e.target.value)}
                  options={[
                    { value: '', label: 'All Statuses' },
                    { value: 'COMPLETED', label: 'Completed' },
                    { value: 'PENDING', label: 'Pending' },
                    { value: 'REFUNDED', label: 'Refunded' },
                    { value: 'PARTIALLY_REFUNDED', label: 'Partially Refunded' },
                  ]}
                />

                {/* Payment Method Filter */}
                <Select
                  label="Payment Method"
                  value={localFilters.paymentMethod}
                  onChange={(e) => handleChange('paymentMethod', e.target.value)}
                  options={[
                    { value: '', label: 'All Methods' },
                    { value: 'CASH', label: 'Cash' },
                    { value: 'CARD', label: 'Card' },
                    { value: 'MOBILE', label: 'Mobile Payment' },
                  ]}
                />

                {/* Branch Filter (for admins) */}
                {showBranchFilter && (
                  <Select
                    label="Branch"
                    value={localFilters.branchId}
                    onChange={(e) => handleChange('branchId', e.target.value)}
                    options={[
                      { value: '', label: 'All Branches' },
                      ...branches.map(b => ({
                        value: String(b.id),
                        label: b.name,
                      })),
                    ]}
                  />
                )}

                {/* Amount Range */}
                <Input
                  label="Min Amount"
                  type="number"
                  step="0.01"
                  value={localFilters.minAmount}
                  onChange={(e) => handleChange('minAmount', e.target.value)}
                  placeholder="0.00"
                />

                <Input
                  label="Max Amount"
                  type="number"
                  step="0.01"
                  value={localFilters.maxAmount}
                  onChange={(e) => handleChange('maxAmount', e.target.value)}
                  placeholder="0.00"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            {hasActiveFilters && (
              <Button
                variant="outline"
                icon={X}
                onClick={handleClear}
                disabled={loading}
              >
                Clear Filters
              </Button>
            )}
            <Button
              variant="primary"
              icon={Filter}
              onClick={handleApply}
              loading={loading}
              disabled={loading}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
};

export default TransactionFilters;