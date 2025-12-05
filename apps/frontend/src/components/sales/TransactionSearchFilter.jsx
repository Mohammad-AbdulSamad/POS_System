// src/components/sales/TransactionSearchFilter.jsx
import { useState } from 'react';
import Input from '../common/Input';
import Select from '../common/Select';
import Button from '../common/Button';
import { Search, X } from 'lucide-react';

/**
 * TransactionSearchFilter Component
 * 
 * Advanced search with field selection
 * Allows users to choose what field to search by
 */

const TransactionSearchFilter = ({
  onSearch,
  onClear,
  loading = false,
}) => {
  const [searchField, setSearchField] = useState('receiptNumber');
  const [searchValue, setSearchValue] = useState('');

  // Search field options
  const searchFields = [
    { value: 'receiptNumber', label: 'Receipt Number', placeholder: 'e.g., STMA-20251106-0001' },
    { value: 'customerName', label: 'Customer Name', placeholder: 'e.g., John Doe' },
    { value: 'customerPhone', label: 'Customer Phone', placeholder: 'e.g., 0501234567' },
    { value: 'customerEmail', label: 'Customer Email', placeholder: 'e.g., john@example.com' },
    { value: 'cashierName', label: 'Cashier Name', placeholder: 'e.g., Sarah Smith' },
    { value: 'transactionId', label: 'Transaction ID', placeholder: 'e.g., uuid...' },
  ];

  const currentField = searchFields.find(f => f.value === searchField);

  const handleSearch = (e) => {
    e?.preventDefault();
    
    if (!searchValue.trim()) {
      return;
    }

    console.log('🔍 Searching:', {
      field: searchField,
      value: searchValue
    });

    onSearch({
      field: searchField,
      value: searchValue.trim()
    });
  };

  const handleClear = () => {
    setSearchValue('');
    setSearchField('receiptNumber');
    onClear();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <form onSubmit={handleSearch} className="space-y-3">
        {/* Search Field Selection */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Field Selector */}
          <div className="w-full sm:w-64">
            <Select
              label="Search By"
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              options={searchFields}
            />
          </div>

          {/* Search Input */}
          <div className="flex-1">
            <Input
              label="Search Value"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={currentField?.placeholder}
              disabled={loading}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 items-end">
            <Button
              type="submit"
              variant="primary"
              icon={Search}
              onClick={handleSearch}
              loading={loading}
              disabled={loading || !searchValue.trim()}
            >
              Search
            </Button>
            
            {searchValue && (
              <Button
                type="button"
                variant="outline"
                icon={X}
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Helper Text */}
        <div className="text-xs text-gray-500">
          <strong>Tip:</strong> Select a field and enter a search term. Press Enter or click Search.
        </div>
      </form>
    </div>
  );
};

export default TransactionSearchFilter;