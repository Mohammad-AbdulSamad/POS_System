// src/components/pos/CustomerSearch.jsx
import { useState, useEffect, useRef } from 'react';
import Input from '../common/Input';
import Button from '../common/Button';
import Badge from '../common/Badge';
import EmptyState from '../common/EmptyState';
import Spinner from '../common/Spinner';
import { Search, User, Plus, X, Phone, Mail } from 'lucide-react';
import clsx from 'clsx';

/**
 * CustomerSearch Component
 * 
 * Search and select customers for transactions.
 * 
 * @example
 * <CustomerSearch
 *   onSelectCustomer={handleCustomerSelect}
 *   selectedCustomer={currentCustomer}
 * />
 */

const CustomerSearch = ({
  onSelectCustomer,
  selectedCustomer = null,
  customers = [],
  loading = false,
  onSearch,
  onAddNew,
  placeholder = 'Search customer by name, phone, or email...',
  showAddButton = true,
  autoFocus = false,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  // Filter customers based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers([]);
      setShowResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = customers.filter(customer => 
      customer.name?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query)
    );

    setFilteredCustomers(filtered);
    setShowResults(true);
  }, [searchQuery, customers]);

  // Trigger external search
  useEffect(() => {
    if (searchQuery.trim() && onSearch) {
      const timer = setTimeout(() => {
        onSearch(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, onSearch]);

  // Close results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target) &&
          searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCustomer = (customer) => {
    onSelectCustomer?.(customer);
    setSearchQuery('');
    setShowResults(false);
  };

  const handleClearCustomer = () => {
    onSelectCustomer?.(null);
    setSearchQuery('');
    searchRef.current?.focus();
  };

  const handleAddNew = () => {
    onAddNew?.();
    setShowResults(false);
  };

  // If customer is selected, show selected state
  if (selectedCustomer) {
    return (
      <div className={clsx('p-4 bg-primary-50 border border-primary-200 rounded-lg', className)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-bold flex-shrink-0">
              {selectedCustomer.name?.charAt(0).toUpperCase() || 'C'}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900 truncate">
                  {selectedCustomer.name}
                </h4>
                {selectedCustomer.isVip && (
                  <Badge variant="warning" size="xs">VIP</Badge>
                )}
              </div>
              
              <div className="space-y-0.5">
                {selectedCustomer.phone && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Phone className="h-3 w-3" />
                    <span>{selectedCustomer.phone}</span>
                  </div>
                )}
                {selectedCustomer.email && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{selectedCustomer.email}</span>
                  </div>
                )}
              </div>
              
              {selectedCustomer.loyaltyPoints !== undefined && (
                <div className="mt-2 text-xs text-primary-700 font-medium">
                  {selectedCustomer.loyaltyPoints} loyalty points
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleClearCustomer}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Remove customer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={clsx('relative', className)}>
      {/* Search Input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            ref={searchRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery && setShowResults(true)}
            placeholder={placeholder}
            leftIcon={Search}
            autoFocus={autoFocus}
          />
        </div>

        {showAddButton && (
          <Button
            variant="outline"
            icon={Plus}
            onClick={handleAddNew}
            title="Add new customer"
          >
            New
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div
          ref={resultsRef}
          className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-80 overflow-hidden"
        >
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" label="Searching..." />
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="overflow-y-auto max-h-80">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => handleSelectCustomer(customer)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                >
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-semibold">
                      {customer.name?.charAt(0).toUpperCase() || 'C'}
                    </div>
                  </div>

                  {/* Customer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 truncate">
                        {customer.name}
                      </span>
                      {customer.isVip && (
                        <Badge variant="warning" size="xs">VIP</Badge>
                      )}
                    </div>
                    
                    <div className="space-y-0.5">
                      {customer.phone && (
                        <div className="text-xs text-gray-500">
                          {customer.phone}
                        </div>
                      )}
                      {customer.email && (
                        <div className="text-xs text-gray-500 truncate">
                          {customer.email}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Loyalty Points */}
                  {customer.loyaltyPoints !== undefined && (
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs text-gray-500">Points</div>
                      <div className="text-sm font-semibold text-primary-600">
                        {customer.loyaltyPoints}
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8">
              <EmptyState
                icon={User}
                title="No customers found"
                description={`No results for "${searchQuery}"`}
                size="sm"
                action={
                  showAddButton && onAddNew ? (
                    <Button
                      variant="outline"
                      size="sm"
                      icon={Plus}
                      onClick={handleAddNew}
                    >
                      Add New Customer
                    </Button>
                  ) : null
                }
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

CustomerSearch.displayName = 'CustomerSearch';

export default CustomerSearch;