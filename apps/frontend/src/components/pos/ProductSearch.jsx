// src/components/pos/ProductSearch.jsx
import { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { Search, Barcode, X, Package } from 'lucide-react';
import Input from '../common/Input';
import Spinner from '../common/Spinner';
import EmptyState from '../common/EmptyState';

/**
 * ProductSearch Component
 * 
 * Search products by name, SKU, or barcode for POS transactions.
 * Supports keyboard navigation and quick selection.
 * 
 * @example
 * <ProductSearch
 *   onSelectProduct={handleAddToCart}
 *   onScanBarcode={handleBarcodeSearch}
 * />
 */

const ProductSearch = ({
  onSelectProduct,
  onScanBarcode,
  products = [],
  loading = false,
  onSearch,
  placeholder = 'Search products by name, SKU, or barcode...',
  showBarcodeButton = true,
  autoFocus = true,
  className = '',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredProducts, setFilteredProducts] = useState([]);
  
  const searchRef = useRef(null);
  const resultsRef = useRef(null);

  // Filter products based on search query
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts([]);
      setShowResults(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = products.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.sku?.toLowerCase().includes(query) ||
      product.barcode?.toLowerCase().includes(query)
    );

    setFilteredProducts(filtered);
    setShowResults(true);
    setSelectedIndex(0);
  }, [searchQuery, products]);

  // Trigger external search
  useEffect(() => {
    if (searchQuery.trim() && onSearch) {
      const timer = setTimeout(() => {
        onSearch(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, onSearch]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!showResults || filteredProducts.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredProducts.length - 1 ? prev + 1 : prev
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredProducts[selectedIndex]) {
            handleSelectProduct(filteredProducts[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          setShowResults(false);
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showResults, filteredProducts, selectedIndex]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current && selectedIndex >= 0) {
      const selectedElement = resultsRef.current.children[selectedIndex];
      selectedElement?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  const handleSelectProduct = (product) => {
    onSelectProduct?.(product);
    setSearchQuery('');
    setShowResults(false);
    setFilteredProducts([]);
    searchRef.current?.focus();
  };

  const handleClear = () => {
    setSearchQuery('');
    setShowResults(false);
    setFilteredProducts([]);
    searchRef.current?.focus();
  };

  const handleBarcodeClick = () => {
    onScanBarcode?.();
  };

  return (
    <div className={clsx('relative', className)}>
      {/* Search Input */}
      <div className="relative">
        <Input
          ref={searchRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => searchQuery && setShowResults(true)}
          placeholder={placeholder}
          leftIcon={Search}
          autoFocus={autoFocus}
          className="w-full"
          inputClassName="pr-20"
        />

        {/* Right side buttons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
          {loading && <Spinner size="sm" variant="primary" />}
          
          {searchQuery && !loading && (
            <button
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}

          {showBarcodeButton && (
            <button
              onClick={handleBarcodeClick}
              className="text-gray-600 hover:text-primary-600 transition-colors"
              aria-label="Scan barcode"
              title="Scan Barcode (F2)"
            >
              <Barcode className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 w-full mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="md" label="Searching..." />
            </div>
          ) : filteredProducts.length > 0 ? (
            <div ref={resultsRef} className="overflow-y-auto max-h-96">
              {filteredProducts.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => handleSelectProduct(product)}
                  className={clsx(
                    'w-full flex items-center gap-3 px-4 py-3 text-left transition-colors',
                    'border-b border-gray-100 last:border-b-0',
                    {
                      'bg-primary-50 border-primary-100': index === selectedIndex,
                      'hover:bg-gray-50': index !== selectedIndex,
                    }
                  )}
                >
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-12 w-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="h-12 w-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {product.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span>SKU: {product.sku}</span>
                      {product.barcode && (
                        <>
                          <span>•</span>
                          <span>Barcode: {product.barcode}</span>
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      Stock: {product.stock || 0} units
                    </div>
                  </div>

                  {/* Price */}
                  <div className="flex-shrink-0 text-right">
                    <div className="text-lg font-bold text-gray-900">
                      ₪{product.price?.toFixed(2)}
                    </div>
                    {product.stock === 0 && (
                      <div className="text-xs text-danger-600 font-medium">
                        Out of Stock
                      </div>
                    )}
                    {product.stock > 0 && product.stock < 10 && (
                      <div className="text-xs text-warning-600 font-medium">
                        Low Stock
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-8">
              <EmptyState
                icon={Search}
                title="No products found"
                description={`No results for "${searchQuery}"`}
                size="sm"
              />
            </div>
          )}

          {/* Results footer */}
          {filteredProducts.length > 0 && (
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
              <div className="flex items-center justify-between">
                <span>{filteredProducts.length} results found</span>
                <span className="text-gray-400">
                  Use ↑↓ to navigate, Enter to select
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Keyboard shortcuts hint */}
      <div className="mt-2 text-xs text-gray-500">
        <span className="font-medium">Shortcuts:</span> F2 - Scan Barcode • 
        Esc - Clear • ↑↓ - Navigate • Enter - Select
      </div>
    </div>
  );
};

ProductSearch.displayName = 'ProductSearch';

export default ProductSearch;