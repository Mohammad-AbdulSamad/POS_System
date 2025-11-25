// src/components/inventory/BarcodeGenerator.jsx
import { useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Card, { CardBody } from '../common/Card';
import { Download, Printer, X } from 'lucide-react';

/**
 * BarcodeGenerator Component
 * 
 * Generates and displays product barcodes
 * Allows printing and downloading
 * 
 * Note: This is a simple implementation using canvas
 * For production, consider using a library like 'jsbarcode' or 'react-barcode'
 */

const BarcodeGenerator = ({
  isOpen,
  onClose,
  product,
}) => {
  const canvasRef = useRef(null);
  const barcodeValue = product?.barcode || product?.sku || '';

  // Generate simple barcode visualization
  useEffect(() => {
    if (!canvasRef.current || !barcodeValue) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = 300;
    canvas.height = 150;

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw barcode-like pattern (simplified)
    ctx.fillStyle = 'black';
    const barWidth = 3;
    const spacing = 2;
    let x = 20;

    // Create pattern based on barcode digits
    for (let i = 0; i < barcodeValue.length; i++) {
      const digit = parseInt(barcodeValue[i]) || 0;
      const height = 60 + (digit * 5); // Vary height based on digit
      
      ctx.fillRect(x, 20, barWidth, height);
      x += barWidth + spacing;
    }

    // Draw barcode text
    ctx.fillStyle = 'black';
    ctx.font = '14px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(barcodeValue, canvas.width / 2, 110);

    // Draw product name
    ctx.font = '12px sans-serif';
    ctx.fillText(product?.name || '', canvas.width / 2, 135);

  }, [barcodeValue, product]);

  // Handle print
  const handlePrint = () => {
    window.print();
  };

  // Handle download
  const handleDownload = () => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `barcode-${barcodeValue}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  if (!product) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Product Barcode"
      size="md"
    >
      <div className="space-y-6">
        {/* Product Info */}
        <Card>
          <CardBody>
            <div className="flex items-center gap-4">
              {product.imageUrl && (
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="h-16 w-16 rounded-lg object-cover"
                />
              )}
              <div>
                <h3 className="font-semibold text-gray-900">{product.name}</h3>
                <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                {product.barcode && (
                  <p className="text-sm font-mono text-gray-600">
                    Barcode: {product.barcode}
                  </p>
                )}
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Barcode Display */}
        <Card>
          <CardBody>
            <div className="flex flex-col items-center py-6">
              <canvas
                ref={canvasRef}
                className="border border-gray-200 rounded-lg"
              />
              <p className="text-sm text-gray-500 mt-4">
                Scan this barcode at checkout
              </p>
            </div>
          </CardBody>
        </Card>

        {/* Note about production implementation */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This is a simplified barcode visualization. 
            For production use, integrate a proper barcode library like <code>jsbarcode</code> or <code>react-barcode</code> 
            to generate standard formats (EAN-13, UPC, Code128, etc.).
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            variant="outline"
            icon={X}
            onClick={onClose}
          >
            Close
          </Button>
          <Button
            variant="outline"
            icon={Download}
            onClick={handleDownload}
          >
            Download
          </Button>
          <Button
            variant="primary"
            icon={Printer}
            onClick={handlePrint}
          >
            Print
          </Button>
        </div>
      </div>

      {/* Print styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          canvas {
            visibility: visible;
            position: absolute;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
          }
        }
      `}</style>
    </Modal>
  );
};

export default BarcodeGenerator;