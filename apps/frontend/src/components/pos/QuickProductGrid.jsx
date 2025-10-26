// src/components/pos/QuickProductGrid.jsx
import { useState } from 'react';
import Button from '../common/Button';
import Badge from '../common/Badge';
import Input from '../common/Input';
import EmptyState from '../common/EmptyState';
import Spinner from '../common/Spinner';
import { Package, Search, Grid3x3, List } from 'lucide-react';
import clsx from 'clsx';

/**
 * QuickProductGrid Component
 * 
 * Quick access grid for frequently used products in POS.
 * 
 * @example
 * <QuickProductGrid
 *   products={quickProducts}
 *   onSelectProduct={handleAddToCart}
 *   categories={categories}
 * />
 */

const QuickProductGrid = ({
  products = [],
  onSelectProduct,
  categories = [],
  onCategoryChange,
  loading = false,
  view = 'grid', // 'grid' or 'list'
  onViewChange,
  showSearch = true,
  showCategories = true,
  className = '',
}) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCategoryClick = (categoryId) => {
    setSelectedCategory(categoryId);
    onCategoryChange?.(categoryId);
  };

  const handleProductClick = (product) => {
    if (product.stock > 0) {
      onSelectProduct?.(product);
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory;
    const matchesSearch = !searchQuery || 
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  return (
    <div className={clsx('flex flex-col h-full', className)}>
      {/* Header with search and view toggle */}
      <div className="flex-shrink-0 space-y-3 mb-4">
        {/* Search and View Toggle */}
        <div className="flex gap-2">
          {showSearch && (
            <div className="flex-1">
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search quick products..."
                leftIcon={Search}
                size="sm"
              />
            </div>
          )}

          {onViewChange && (
            <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => onViewChange('grid')}
                className={clsx(
                  'p-2 rounded-md transition-colors',
                  view === 'grid'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
                title="Grid view"
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onViewChange('list')}
                className={clsx(
                  'p-2 rounded-md transition-colors',
                  view === 'list'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                )}
                title="List view"
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Category Filters */}
        {showCategories && categories.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => handleCategoryClick('all')}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                selectedCategory === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              All Products
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                  selectedCategory === category.id
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid/List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" label="Loading products..." />
          </div>
        ) : filteredProducts.length > 0 ? (
          view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  disabled={product.stock === 0}
                  className={clsx(
                    'group relative p-3 bg-white border-2 rounded-lg transition-all',
                    'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500',
                    product.stock === 0
                      ? 'border-gray-200 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-primary-500 active:scale-95'
                  )}
                >
                  {/* Product Image */}
                  <div className="aspect-square mb-2 rounded-lg overflow-hidden bg-gray-100">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="text-left">
                    <h4 className="font-medium text-sm text-gray-900 line-clamp-2 mb-1">
                      {product.name}
                    </h4>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-600">
                        ₪{product.price.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Stock Badge */}
                  {product.stock === 0 ? (
                    <Badge
                      variant="danger"
                      size="xs"
                      className="absolute top-2 right-2"
                    >
                      Out
                    </Badge>
                  ) : product.stock < 10 && (
                    <Badge
                      variant="warning"
                      size="xs"
                      className="absolute top-2 right-2"
                    >
                      {product.stock}
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  disabled={product.stock === 0}
                  className={clsx(
                    'w-full flex items-center gap-3 p-3 bg-white border-2 rounded-lg transition-all text-left',
                    'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500',
                    product.stock === 0
                      ? 'border-gray-200 opacity-50 cursor-not-allowed'
                      : 'border-gray-200 hover:border-primary-500'
                  )}
                >
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="h-16 w-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 truncate mb-1">
                      {product.name}
                    </h4>
                    {product.sku && (
                      <p className="text-xs text-gray-500 mb-1">
                        SKU: {product.sku}
                      </p>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary-600">
                        ₪{product.price.toFixed(2)}
                      </span>
                      {product.stock === 0 ? (
                        <Badge variant="danger" size="xs">Out of Stock</Badge>
                      ) : product.stock < 10 && (
                        <Badge variant="warning" size="xs">
                          {product.stock} left
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Add indicator */}
                  {product.stock > 0 && (
                    <div className="flex-shrink-0 text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )
        ) : (
          <div className="flex items-center justify-center h-64">
            <EmptyState
              icon={Package}
              title="No products found"
              description={
                searchQuery
                  ? `No results for "${searchQuery}"`
                  : selectedCategory !== 'all'
                  ? 'No products in this category'
                  : 'No quick access products available'
              }
              size="md"
            />
          </div>
        )}
      </div>

      {/* Footer Info */}
      {filteredProducts.length > 0 && (
        <div className="flex-shrink-0 mt-4 pt-3 border-t border-gray-200 text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <span>{filteredProducts.length} products</span>
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
              >
                Clear search
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

QuickProductGrid.displayName = 'QuickProductGrid';

export default QuickProductGrid;