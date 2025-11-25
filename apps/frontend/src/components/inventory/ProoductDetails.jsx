// src/components/inventory/ProductDetails.jsx
import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../common/Tabs';
import Card, { CardBody } from '../common/Card';
import Badge from '../common/Badge';
import Button from '../common/Button';
import Spinner from '../common/Spinner';
import StockHistoryTable from './StockHistoryTable';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { 
  Package, 
  Edit, 
  Barcode as BarcodeIcon, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  DollarSign,
  Tag,
  Building,
  User
} from 'lucide-react';
import clsx from 'clsx';

/**
 * ProductDetails Component
 * 
 * Comprehensive product details view with tabs
 * Shows: Details, Stock History, Analytics
 */

const ProductDetails = ({
  product,
  loading = false,
  onEdit,
  onAdjustStock,
  onGenerateBarcode,
}) => {
  const [activeTab, setActiveTab] = useState('details');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12 text-gray-500">
        Product not found
      </div>
    );
  }

  const {
    id,
    name,
    sku,
    barcode,
    priceGross,
    cost,
    stock,
    minStock,
    reorderPoint,
    unit,
    imageUrl,
    description,
    category,
    supplier,
    taxRate,
    branch,
    active,
    createdAt,
    updatedAt,
  } = product;

  // Stock status
  const isOutOfStock = stock === 0;
  const isLowStock = stock > 0 && stock <= (minStock || 0);
  const stockStatus = isOutOfStock ? 'danger' : isLowStock ? 'warning' : 'success';

  // Calculate profit margin
  const profitMargin = priceGross && cost
    ? (((priceGross - cost) / priceGross) * 100).toFixed(2)
    : 0;

  const profitAmount = priceGross && cost
    ? priceGross - cost
    : 0;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex gap-6">
          {/* Product Image */}
          <div className="flex-shrink-0">
            <div className="h-48 w-48 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="h-20 w-20 text-gray-400" />
              )}
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{name}</h1>
              <p className="text-sm font-mono text-gray-500 mt-1">
                SKU: {sku}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Badge variant={active ? 'success' : 'gray'}>
                {active ? 'Active' : 'Inactive'}
              </Badge>
              <Badge variant={stockStatus}>
                {stock} {unit || 'pcs'} in stock
              </Badge>
              {category && (
                <Badge variant="primary">
                  {category.name}
                </Badge>
              )}
            </div>

            {(isLowStock || isOutOfStock) && (
              <div className={clsx(
                'flex items-center gap-2 text-sm font-medium',
                isOutOfStock ? 'text-danger-600' : 'text-warning-600'
              )}>
                <AlertTriangle className="h-4 w-4" />
                <span>
                  {isOutOfStock ? 'Out of stock' : 'Low stock - reorder soon'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {onGenerateBarcode && (
            <Button
              variant="outline"
              icon={BarcodeIcon}
              onClick={() => onGenerateBarcode(product)}
            >
              Generate Barcode
            </Button>
          )}
          {onAdjustStock && (
            <Button
              variant="outline"
              icon={Package}
              onClick={() => onAdjustStock(product)}
            >
              Adjust Stock
            </Button>
          )}
          {onEdit && (
            <Button
              variant="primary"
              icon={Edit}
              onClick={() => onEdit(product)}
            >
              Edit Product
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="stock">Stock History</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pricing Information */}
            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Selling Price</span>
                    <span className="text-xl font-bold text-gray-900">
                      {formatCurrency(priceGross)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Cost Price</span>
                    <span className="text-lg font-semibold text-gray-700">
                      {formatCurrency(cost)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Profit per Unit</span>
                      <span className="text-lg font-semibold text-success-600">
                        {formatCurrency(profitAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-600">Profit Margin</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-success-600" />
                        <span className="text-lg font-semibold text-success-600">
                          {profitMargin}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Stock Information */}
            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Stock
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Current Stock</span>
                    <Badge variant={stockStatus} size="lg">
                      {stock} {unit || 'pcs'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Minimum Stock</span>
                    <span className="text-gray-900 font-medium">
                      {minStock || 0} {unit || 'pcs'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Reorder Point</span>
                    <span className="text-gray-900 font-medium">
                      {reorderPoint || 0} {unit || 'pcs'}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Stock Value (Cost)</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatCurrency(stock * cost)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-gray-600">Stock Value (Retail)</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {formatCurrency(stock * priceGross)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardBody>
            </Card>

            {/* Product Information */}
            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  Product Information
                </h3>
                <div className="space-y-3">
                  {barcode && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Barcode</span>
                      <span className="font-mono text-gray-900">{barcode}</span>
                    </div>
                  )}
                  {category && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Category</span>
                      <Badge variant="primary">{category.name}</Badge>
                    </div>
                  )}
                  {supplier && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Supplier</span>
                      <span className="text-gray-900">{supplier.name}</span>
                    </div>
                  )}
                  {taxRate && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Tax Rate</span>
                      <span className="text-gray-900">
                        {taxRate.name} ({taxRate.rate}%)
                      </span>
                    </div>
                  )}
                  {branch && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Branch</span>
                      <span className="text-gray-900">{branch.name}</span>
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>

            {/* Additional Information */}
            <Card>
              <CardBody>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Additional Information
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Created</span>
                    <span className="text-sm text-gray-900">
                      {formatDateTime(createdAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Last Updated</span>
                    <span className="text-sm text-gray-900">
                      {formatDateTime(updatedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Product ID</span>
                    <span className="text-xs font-mono text-gray-500">
                      {id}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Description */}
          {description && (
            <Card className="mt-6">
              <CardBody>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Description
                </h3>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {description}
                </p>
              </CardBody>
            </Card>
          )}
        </TabsContent>

        {/* Stock History Tab */}
        <TabsContent value="stock">
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Stock Movement History
              </h3>
              <StockHistoryTable productId={id} />
            </CardBody>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <Card>
            <CardBody>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Product Analytics
              </h3>
              <div className="text-center py-12 text-gray-500">
                Analytics coming soon...
                <div className="text-sm mt-2">
                  Sales trends, turnover rate, and performance metrics
                </div>
              </div>
            </CardBody>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductDetails;