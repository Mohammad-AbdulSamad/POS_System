// src/components/common/SearchBar.jsx
import { forwardRef, useState, useEffect } from 'react';
import { useDebounce } from '../../hooks/useDebounce';
import clsx from 'clsx';
import { Search, X } from 'lucide-react';

/**
 * SearchBar Component
 * 
 * A reusable search input component with clear button, loading state, and optional icon.
 * Uses Tailwind CSS and custom theme variables from index.css.
 * 
 * @example
 * <SearchBar
 *   placeholder="Search products..."
 *   value={query}
 *   onChange={(e) => setQuery(e.target.value)}
 * />
 */

const SearchBar = forwardRef(
  (
    {
      value,
      onChange,
      onDebouncedChange,  
      debounce = 2000,       //delay in ms, 0 = disabled, 2000 ms default
      onFocus,
      onBlur,
      onClear,
      placeholder = 'Search...',
      label,
      variant = 'outline',
      size = 'md',
      loading = false,
      disabled = false,
      fullWidth = true,
      className = '',
      inputClassName = '',
      labelClassName = '',
      icon: Icon = Search,
            ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    const debouncedValue = useDebounce(value, debounce);

  // ✅ Trigger callback when debounced value changes
  useEffect(() => {
    if (debounce > 0 && onDebouncedChange && debouncedValue !== undefined) {
    onDebouncedChange(debouncedValue);
  }
  }, [debouncedValue, onDebouncedChange, debounce]);

    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-sm rounded-lg',
      lg: 'px-5 py-3 text-base rounded-lg',
    };

    // Variant styles
    const variantStyles = {
      outline:
        'border border-gray-300 bg-white text-gray-900 hover:border-gray-400 focus:ring-2 focus:ring-primary-500',
      filled:
        'bg-gray-100 border border-transparent text-gray-900 hover:bg-gray-200 focus:ring-2 focus:ring-primary-500',
      ghost:
        'bg-transparent border-none text-gray-900 hover:bg-gray-100 focus:ring-2 focus:ring-primary-500',
    };

    // Spinner for loading
    const Spinner = () => (
      <svg
        className="animate-spin h-5 w-5 text-primary-600"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );

    return (
      <div className={clsx('relative', { 'w-full': fullWidth }, className)}>
        {/* Label */}
        {label && (
          <label
            className={clsx(
              'block text-sm font-medium text-gray-700 mb-1.5',
              { 'text-gray-400': disabled },
              labelClassName
            )}
          >
            {label}
          </label>
        )}

        {/* Input container */}
        <div className="relative">
          {/* Left icon */}
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
              <Icon className="h-5 w-5" />
            </div>
          )}

          {/* Input field */}
          <input
            ref={ref}
            type="text"
            disabled={disabled}
            value={value}
            onChange={onChange}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            placeholder={placeholder}
            className={clsx(
              'block w-full transition-all duration-200 focus:outline-none',
              'disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed',
              Icon && 'pl-10',
              (loading || value) && 'pr-10',
              sizeStyles[size],
              variantStyles[variant],
              {
                'ring-2 ring-primary-500 border-primary-500': isFocused,
              },
              inputClassName
            )}
            {...props}
          />

          {/* Right-side buttons */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {loading && <Spinner />}
            {!loading && value && (
              <button
                type="button"
                onClick={(e) => {
                  onClear ? onClear(e) : onChange?.({ target: { value: '' } });
                }}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Clear search"
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';

export default SearchBar;

/**
 * Example Usage:
 * 
 * import SearchBar from '@/components/common/SearchBar';
 * import { Search, Package, Users } from 'lucide-react';
 * 
 * // Basic usage
 * const [query, setQuery] = useState('');
 * 
 * <SearchBar
 *   placeholder="Search products..."
 *   value={query}
 *   onChange={(e) => setQuery(e.target.value)}
 * />
 * 
 * // With label
 * <SearchBar
 *   label="Search Customer"
 *   value={customerSearch}
 *   onChange={(e) => setCustomerSearch(e.target.value)}
 * />
 * 
 * // With custom icon
 * <SearchBar
 *   placeholder="Search inventory..."
 *   icon={Package}
 *   value={search}
 *   onChange={(e) => setSearch(e.target.value)}
 * />
 * 
 * // With clear button
 * <SearchBar
 *   placeholder="Search employees..."
 *   value={search}
 *   onChange={(e) => setSearch(e.target.value)}
 *   onClear={() => setSearch('')}
 * />
 * 
 * // Loading state
 * <SearchBar
 *   placeholder="Searching..."
 *   loading
 *   value={search}
 *   onChange={(e) => setSearch(e.target.value)}
 * />
 * 
 * // Disabled
 * <SearchBar
 *   placeholder="Search disabled"
 *   disabled
 * />
 * 
 * // Different sizes
 * <SearchBar size="sm" placeholder="Small search" />
 * <SearchBar size="md" placeholder="Medium search" />
 * <SearchBar size="lg" placeholder="Large search" />
 * 
 * // POS specific: Product search in sales screen
 * <div className="flex items-center gap-2">
 *   <SearchBar
 *     placeholder="Scan or search product..."
 *     value={productSearch}
 *     onChange={(e) => setProductSearch(e.target.value)}
 *     className="flex-1"
 *   />
 *   <Button variant="primary" size="md">
 *     Add
 *   </Button>
 * </div>
 * 
 * // POS specific: Customer lookup
 * <Card>
 *   <CardHeader title="Find Customer" />
 *   <CardBody>
 *     <SearchBar
 *       label="Customer Name or Phone"
 *       value={customerQuery}
 *       onChange={(e) => setCustomerQuery(e.target.value)}
 *       placeholder="Search by name or number"
 *       icon={Users}
 *     />
 *   </CardBody>
 * </Card>
 * 
 * // POS specific: Filter orders
 * <div className="flex flex-col md:flex-row gap-4">
 *   <SearchBar
 *     placeholder="Search by Order ID or Customer"
 *     value={orderSearch}
 *     onChange={(e) => setOrderSearch(e.target.value)}
 *     className="flex-1"
 *   />
 *   <DatePicker
 *     label="From"
 *     value={startDate}
 *     onChange={(e) => setStartDate(e.target.value)}
 *   />
 *   <DatePicker
 *     label="To"
 *     value={endDate}
 *     onChange={(e) => setEndDate(e.target.value)}
 *   />
 * </div>
 */
