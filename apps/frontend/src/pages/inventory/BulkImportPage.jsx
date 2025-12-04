// src/pages/inventory/BulkImportPage.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../../components/layout/MainLayout';
import PageHeader from '../../components/layout/PageHeader';
import Breadcrumbs from '../../components/layout/Breadcrumbs';
import Card, { CardBody } from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import BulkImport from '../../components/inventory/BulkImport';
import { useProducts } from '../../hooks/useProducts';
import { ArrowLeft, Upload, Download, FileText, CheckCircle, XCircle } from 'lucide-react';

/**
 * BulkImportPage
 * 
 * Dedicated page for bulk importing products
 */

const BulkImportPage = () => {
  const navigate = useNavigate();
  const [importResult, setImportResult] = useState(null);
  const { importProducts, loading } = useProducts();

  const handleImport = async (file, onProgress) => {
    try {
      const result = await importProducts(file, onProgress);
      setImportResult(result);
    } catch (error) {
      console.error('Import failed:', error);
      setImportResult({
        success: false,
        error: error.message || 'Import failed',
      });
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV template
    const template = [
      ['name', 'sku', 'barcode', 'priceGross', 'cost', 'stock', 'unit', 'categoryId', 'supplierId', 'description', 'branchId', 'taxRateId'],
      ['Example Product', 'PROD-001', '1234567890123', '99.99', '50.00', '100', 'pcs', 'cat-id', 'sup-id', 'Product description', 'branch-id', 'tax-id'],
      ['Another Product', 'PROD-002', '1234567890124', '149.99', '75.00', '50', 'pcs', 'cat-id', 'sup-id', 'Another description', 'branch-id', 'tax-id'],
    ];

    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'product-import-template.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <MainLayout
      currentPath="/inventory/bulk-import"
      user={{ name: 'John Doe', role: 'Manager', avatar: 'JD' }}
    >
      <div className="space-y-6">
        {/* Breadcrumbs */}
        <Breadcrumbs
          items={[
            { label: 'Inventory', href: '/inventory' },
            { label: 'Products', href: '/inventory/products' },
            { label: 'Bulk Import' },
          ]}
        />

        {/* Page Header */}
        <PageHeader
          title="Bulk Import Products"
          description="Import multiple products from CSV or Excel file"
          backButton={
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate('/inventory/products')}
            >
              Back to Products
            </Button>
          }
        />

        {/* Instructions */}
        <Alert variant="info">
          <div className="space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5" />
              How to Import Products
            </h4>
            <ol className="text-sm space-y-2 list-decimal list-inside">
              <li>Download the CSV template to see the required format</li>
              <li>Fill in your product data following the template structure</li>
              <li>Make sure all required fields are populated (name, SKU, price, cost, stock)</li>
              <li>Upload your completed file below</li>
              <li>Review the preview and confirm the import</li>
            </ol>
          </div>
        </Alert>

        {/* Download Template Card */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 bg-primary-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-8 w-8 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Import Template
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Download the CSV template with all required columns and example data
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                icon={Download}
                onClick={handleDownloadTemplate}
              >
                Download Template
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Import Results */}
        {importResult && (
          <Alert variant={importResult.success ? 'success' : 'danger'}>
            <div className="flex items-start gap-3">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-danger-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <h4 className="font-semibold mb-2">
                  {importResult.success ? 'Import Successful!' : 'Import Failed'}
                </h4>
                {importResult.success ? (
                  <div className="text-sm space-y-1">
                    <p>Successfully imported {importResult.imported} products</p>
                    {importResult.skipped > 0 && (
                      <p className="text-warning-700">
                        {importResult.skipped} products were skipped due to errors
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-sm">{importResult.error}</p>
                )}
                {importResult.success && (
                  <div className="mt-4">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => navigate('/inventory/products')}
                    >
                      View Products
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Alert>
        )}

        {/* Import Form */}
        <Card>
          <CardBody>
            <div className="space-y-4">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
                <Upload className="h-6 w-6 text-primary-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Upload Your File
                  </h3>
                  <p className="text-sm text-gray-600">
                    Select a CSV or Excel file with your product data
                  </p>
                </div>
              </div>

              <BulkImport
                isOpen={true}
                onClose={() => navigate('/inventory/products')}
                onImport={handleImport}
                loading={loading}
              />
            </div>
          </CardBody>
        </Card>

        {/* Tips */}
        <Card>
          <CardBody>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Import Tips
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex gap-3">
                <span className="text-primary-600 font-semibold">•</span>
                <p>
                  <strong className="text-gray-900">Required fields:</strong> name, sku, priceGross, cost, stock, branchId
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary-600 font-semibold">•</span>
                <p>
                  <strong className="text-gray-900">SKU must be unique:</strong> Each product must have a unique SKU per branch
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary-600 font-semibold">•</span>
                <p>
                  <strong className="text-gray-900">Numeric fields:</strong> priceGross, cost, and stock must be valid numbers
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary-600 font-semibold">•</span>
                <p>
                  <strong className="text-gray-900">IDs:</strong> Use existing category, supplier, branch, and tax rate IDs from your system
                </p>
              </div>
              <div className="flex gap-3">
                <span className="text-primary-600 font-semibold">•</span>
                <p>
                  <strong className="text-gray-900">File size:</strong> Maximum file size is 10MB
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </MainLayout>
  );
};

export default BulkImportPage;