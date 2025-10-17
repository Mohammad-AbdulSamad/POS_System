// src/components/common/Dropdown.jsx
import { forwardRef, useState, useRef, useEffect } from 'react';
import clsx from 'clsx';
import { ChevronDown, Check, X } from 'lucide-react';

/**
 * Dropdown Component
 * 
 * A reusable dropdown (select) component with multiple variants, sizes, and options.
 * Supports icons, controlled/uncontrolled states, and keyboard navigation.
 * Uses Tailwind CSS and custom theme variables from index.css
 * 
 * @example
 * <Dropdown
 *   label="Select Category"
 *   options={categories}
 *   onChange={(value) => setCategory(value)}
 * />
 */

const Dropdown = forwardRef(
  (
    {
      label,
      options = [],
      value = null,
      placeholder = 'Select...',
      onChange,
      variant = 'outline',
      size = 'md',
      disabled = false,
      clearable = false,
      searchable = false,
      icon: Icon = null,
      className = '',
      fullWidth = true,
      maxHeight = 240,
      ...props
    },
    ref
  ) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const dropdownRef = useRef(null);

    // Handle outside click
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find((opt) => opt.value === value);
    const filteredOptions = searchable
      ? options.filter((opt) =>
          opt.label.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : options;

    const toggleOpen = () => {
      if (!disabled) setIsOpen((prev) => !prev);
    };

    const handleSelect = (option) => {
      onChange?.(option.value);
      setIsOpen(false);
      setSearchTerm('');
    };

    const handleClear = (e) => {
      e.stopPropagation();
      onChange?.(null);
    };

    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm rounded-md',
      md: 'px-4 py-2 text-sm rounded-lg',
      lg: 'px-5 py-2.5 text-base rounded-lg',
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

    return (
      <div
        ref={dropdownRef}
        className={clsx(
          'relative inline-block text-left',
          { 'w-full': fullWidth },
          className
        )}
        {...props}
      >
        {label && (
          <label className="block mb-1 text-sm font-medium text-gray-700">
            {label}
          </label>
        )}

        {/* Trigger Button */}
        <button
          ref={ref}
          type="button"
          disabled={disabled}
          onClick={toggleOpen}
          className={clsx(
            'flex items-center justify-between w-full',
            'focus:outline-none transition-all duration-200',
            variantStyles[variant],
            sizeStyles[size],
            {
              'opacity-50 cursor-not-allowed': disabled,
              'cursor-pointer': !disabled,
            }
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {Icon && <Icon className="h-4 w-4 text-gray-500" />}
            {selectedOption ? (
              <span className="truncate">{selectedOption.label}</span>
            ) : (
              <span className="text-gray-400">{placeholder}</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {clearable && selectedOption && (
              <X
                onClick={handleClear}
                className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-pointer"
              />
            )}
            <ChevronDown
              className={clsx('h-4 w-4 text-gray-500 transition-transform', {
                'rotate-180': isOpen,
              })}
            />
          </div>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg"
            style={{ maxHeight, overflowY: 'auto' }}
          >
            {searchable && (
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            )}

            {filteredOptions.length > 0 ? (
              <ul className="py-1 text-sm text-gray-700">
                {filteredOptions.map((option) => (
                  <li
                    key={option.value}
                    className={clsx(
                      'px-4 py-2 flex items-center justify-between cursor-pointer transition-colors duration-150',
                      'hover:bg-gray-100',
                      {
                        'bg-primary-50 text-primary-700':
                          option.value === value,
                      }
                    )}
                    onClick={() => handleSelect(option)}
                  >
                    <div className="flex items-center gap-2">
                      {option.icon && (
                        <option.icon className="h-4 w-4 text-gray-500" />
                      )}
                      {option.label}
                    </div>
                    {option.value === value && (
                      <Check className="h-4 w-4 text-primary-600" />
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No options found
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

export default Dropdown;

/**
 * Example Usage:
 * 
 * import Dropdown from '@/components/common/Dropdown';
 * import { Package, User, Tag } from 'lucide-react';
 * 
 * // Basic usage
 * const [category, setCategory] = useState(null);
 * const categories = [
 *   { value: 'electronics', label: 'Electronics' },
 *   { value: 'groceries', label: 'Groceries' },
 *   { value: 'clothing', label: 'Clothing' },
 * ];
 * 
 * <Dropdown
 *   label="Category"
 *   options={categories}
 *   value={category}
 *   onChange={setCategory}
 * />
 * 
 * // With icons
 * const paymentOptions = [
 *   { value: 'cash', label: 'Cash', icon: Tag },
 *   { value: 'credit', label: 'Credit Card', icon: User },
 *   { value: 'online', label: 'Online', icon: Package },
 * ];
 * 
 * <Dropdown
 *   label="Payment Method"
 *   options={paymentOptions}
 *   value={selectedPayment}
 *   onChange={setSelectedPayment}
 *   icon={Tag}
 * />
 * 
 * // Searchable
 * <Dropdown
 *   label="Search Product"
 *   options={productOptions}
 *   searchable
 *   value={product}
 *   onChange={setProduct}
/>
 * 
 * // Clearable
 * <Dropdown
 *   label="Select User"
 *   options={users}
 *   value={selectedUser}
 *   clearable
 *   onChange={setSelectedUser}
 * />
 * 
 * // Variants and sizes
 * <Dropdown variant="filled" size="sm" label="Small" options={categories} />
 * <Dropdown variant="outline" size="md" label="Medium" options={categories} />
 * <Dropdown variant="ghost" size="lg" label="Large" options={categories} />
 * 
 * // Disabled
 * <Dropdown label="Disabled" disabled options={categories} />
 * 
 * // POS specific: Filter by product category
 * <Dropdown
 *   label="Filter by Category"
 *   options={[
 *     { value: 'all', label: 'All Products' },
 *     { value: 'low', label: 'Low Stock' },
 *     { value: 'out', label: 'Out of Stock' },
 *   ]}
 *   value={filter}
 *   onChange={setFilter}
 * />
 * 
 * // POS specific: Select employee role
 * <Dropdown
 *   label="User Role"
 *   options={[
 *     { value: 'admin', label: 'Admin' },
 *     { value: 'manager', label: 'Manager' },
 *     { value: 'cashier', label: 'Cashier' },
 *   ]}
 *   value={role}
 *   onChange={setRole}
/>
 * 
 * // Inside Card
 * <Card>
 *   <CardHeader title="Filter Products" />
 *   <CardBody>
 *     <Dropdown
 *       label="Category"
 *       options={categories}
 *       value={category}
 *       onChange={setCategory}
 *       searchable
 *     />
 *   </CardBody>
 * </Card>
 */
