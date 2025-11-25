// src/components/inventory/BulkImport.jsx
import { useState } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import Alert from '../common/Alert';
import Table from '../common/Table';
import { Upload, X, Download, CheckCircle, AlertTriangle, FileText } from 'lucide-react';

/**
 * BulkImport Component
 * 
 * Handles CSV/Excel file upload for bulk product import
 * Shows preview and validation before import
 */

const BulkImport = ({
  isOpen,
  onClose,
  onImport,
  loading = false,
}) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [errors, setErrors] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle file selection
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    const validTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
      setErrors(['Please upload a CSV or Excel file']);
      return;
    }

    setFile(selectedFile);
    setErrors([]);
    
    // Parse CSV for preview (simplified - use proper CSV parser in production)
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const rows = text.split('\n').slice(0, 6); // Preview first 5 rows + header
        const parsedData = rows.map(row => row.split(','));
        setPreview(parsedData);
      } catch (error) {
        setErrors(['Error parsing file. Please check the format.']);
      }
    };
    reader.readAsText(selectedFile);
  };

  // Handle import
  const handleImport = async () => {
    if (!file) return;

    try {
      await onImport(file, (progress) => {
        setUploadProgress(progress);
      });
      
      // Reset on success
      handleClose();
    } catch (error) {
      setErrors([error.message || 'Import failed']);
    }
  };

  // Handle close
  const handleClose = () => {
    setFile(null);
    setPreview([]);
    setErrors([]);
    setUploadProgress(0);
    onClose();
  };

  // Download template
  const handleDownloadTemplate = () => {
    // Create CSV template
    const template = [
      ['name', 'sku', 'barcode', 'priceGross', 'cost', 'stock', 'unit', 'categoryId', 'supplierId', 'description'],
      ['Example Product', 'PROD-001', '1234567890123', '99.99', '50.00', '100', 'pcs', '', '', 'Product description'],
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

  // Preview table columns
  const previewColumns = preview[0]?.map((header, index) => ({
    key: `col_${index}`,
    header: header.trim(),
    render: (_, row) => row[index],
  })) || [];

  const previewData = preview.slice(1).map((row, index) => ({
    id: index,
    ...row,
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Import Products"
      size="lg"
    >
      <div className="space-y-6">
        {/* Instructions */}
        <Alert variant="info">
          <div className="space-y-2">
            <p className="font-medium">Import products from CSV or Excel file</p>
            <ul className="text-sm list-disc list-inside space-y-1">
              <li>Download the template file to see the required format</li>
              <li>Fill in your product data following the template</li>
              <li>Upload the completed file for preview and import</li>
            </ul>
          </div>
        </Alert>

        {/* Download Template */}
        <Card>
          <CardBody>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileText className="h-8 w-8 text-primary-600" />
                <div>
                  <h4 className="font-semibold text-gray-900">Import Template</h4>
                  <p className="text-sm text-gray-600">
                    Download CSV template with required columns
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

        {/* File Upload */}
        <Card>
          <CardBody>
            <div className="space-y-4">
              <h4 className="font-semibold text-gray-900">Upload File</h4>
              
              {!file ? (
                <label className="block">
                  <input
                    type="file"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary-500 cursor-pointer transition-colors">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 mb-1">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-500">
                      CSV or Excel file (max 10MB)
                    </p>
                  </div>
                </label>
              ) : (
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success-600" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-600">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={X}
                    onClick={() => {
                      setFile(null);
                      setPreview([]);
                      setErrors([]);
                    }}
                  />
                </div>
              )}

              {/* Upload Progress */}
              {loading && uploadProgress > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Uploading...</span>
                    <span className="font-medium text-gray-900">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </CardBody>
        </Card>

        {/* Errors */}
        {errors.length > 0 && (
          <Alert variant="danger">
            <div className="space-y-1">
              <p className="font-medium flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Import Errors
              </p>
              <ul className="text-sm list-disc list-inside">
                {errors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          </Alert>
        )}

        {/* Preview */}
        {preview.length > 0 && (
          <Card>
            <CardBody>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900">
                    Preview ({preview.length - 1} rows)
                  </h4>
                  <span className="text-sm text-gray-600">
                    Showing first 5 rows
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <Table
                    columns={previewColumns}
                    data={previewData}
                    compact
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            icon={X}
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            icon={Upload}
            onClick={handleImport}
            loading={loading}
            disabled={!file || loading}
          >
            Import Products
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkImport;