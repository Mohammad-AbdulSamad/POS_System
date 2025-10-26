// src/components/pos/BarcodeScanner.jsx
import { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Input from '../common/Input';
import Alert from '../common/Alert';
import { Barcode, Camera, X, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

/**
 * BarcodeScanner Component
 * 
 * Modal for scanning barcodes manually or with camera.
 * Supports keyboard input and barcode scanner devices.
 * 
 * @example
 * <BarcodeScanner
 *   isOpen={scannerOpen}
 *   onClose={() => setScannerOpen(false)}
 *   onScan={handleBarcodeScanned}
 * />
 */

const BarcodeScanner = ({
  isOpen,
  onClose,
  onScan,
  onError,
  title = 'Scan Barcode',
  placeholder = 'Enter or scan barcode...',
  autoFocus = true,
  showCameraOption = false,
  validateBarcode = null,
  recentScans = [],
  className = '',
}) => {
  const [barcode, setBarcode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [scannedBarcodes, setScannedBarcodes] = useState([]);
  
  const inputRef = useRef(null);
  const scanBufferRef = useRef('');
  const scanTimeoutRef = useRef(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && autoFocus) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, autoFocus]);

  // Handle barcode scanner device input
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyPress = (e) => {
      // Ignore if user is typing in the input field
      if (document.activeElement === inputRef.current) return;

      // Clear timeout if exists
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }

      // If Enter key, process the scanned barcode
      if (e.key === 'Enter' && scanBufferRef.current) {
        e.preventDefault();
        handleScan(scanBufferRef.current);
        scanBufferRef.current = '';
        return;
      }

      // Add character to buffer (only alphanumeric and some special chars)
      if (/^[a-zA-Z0-9\-_]$/.test(e.key)) {
        scanBufferRef.current += e.key;

        // Reset buffer after 100ms of inactivity
        scanTimeoutRef.current = setTimeout(() => {
          scanBufferRef.current = '';
        }, 100);
      }
    };

    document.addEventListener('keypress', handleKeyPress);
    
    return () => {
      document.removeEventListener('keypress', handleKeyPress);
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (success) {
        const timer = setTimeout(() => setSuccess(false), 2000);
        return () => clearTimeout(timer);
      }
    };
  }, [success]);

  const handleScan = async (scannedBarcode) => {
    const trimmedBarcode = scannedBarcode.trim();
    
    if (!trimmedBarcode) {
      setError('Please enter a valid barcode');
      return;
    }

    // Validate barcode if validator provided
    if (validateBarcode) {
      const validation = validateBarcode(trimmedBarcode);
      if (!validation.valid) {
        setError(validation.message || 'Invalid barcode format');
        return;
      }
    }

    setError('');
    setScanning(true);

    try {
      // Call the onScan callback
      await onScan?.(trimmedBarcode);
      
      // Show success state
      setSuccess(true);
      setScannedBarcodes(prev => [
        { barcode: trimmedBarcode, timestamp: new Date() },
        ...prev.slice(0, 4)
      ]);

      // Clear input and reset after delay
      setTimeout(() => {
        setBarcode('');
        setSuccess(false);
        inputRef.current?.focus();
      }, 1000);

    } catch (err) {
      setError(err.message || 'Failed to process barcode');
      onError?.(err);
    } finally {
      setScanning(false);
    }
  };

  const handleManualScan = () => {
    handleScan(barcode);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleManualScan();
    }
  };

  const handleClose = () => {
    setBarcode('');
    setError('');
    setSuccess(false);
    scanBufferRef.current = '';
    onClose?.();
  };

  const handleCameraClick = () => {
    // Placeholder for camera scanning implementation
    setError('Camera scanning coming soon...');
  };

  const handleRecentScanClick = (scan) => {
    setBarcode(scan.barcode);
    inputRef.current?.focus();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      size="md"
      className={className}
    >
      <div className="space-y-4">
        {/* Scanning indicator */}
        {scanning && (
          <Alert variant="info" icon={Barcode}>
            Processing barcode...
          </Alert>
        )}

        {/* Success message */}
        {success && (
          <Alert variant="success" icon={CheckCircle}>
            Barcode scanned successfully!
          </Alert>
        )}

        {/* Error message */}
        {error && (
          <Alert variant="danger" closable onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Barcode input */}
        <div>
          <Input
            ref={inputRef}
            label="Barcode"
            type="text"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            leftIcon={Barcode}
            disabled={scanning}
            helperText="Scan with device or enter manually"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <Button
            variant="primary"
            onClick={handleManualScan}
            disabled={!barcode || scanning}
            loading={scanning}
            fullWidth
          >
            Scan Barcode
          </Button>

          {showCameraOption && (
            <Button
              variant="outline"
              icon={Camera}
              onClick={handleCameraClick}
              disabled={scanning}
              title="Scan with camera"
            >
              Camera
            </Button>
          )}
        </div>

        {/* Recent scans */}
        {scannedBarcodes.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Recent Scans
            </h4>
            <div className="space-y-2">
              {scannedBarcodes.map((scan, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentScanClick(scan)}
                  className={clsx(
                    'w-full flex items-center justify-between px-3 py-2',
                    'text-sm bg-gray-50 hover:bg-gray-100 rounded-lg',
                    'transition-colors'
                  )}
                >
                  <span className="font-mono text-gray-900">
                    {scan.barcode}
                  </span>
                  <span className="text-xs text-gray-500">
                    {scan.timestamp.toLocaleTimeString()}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Barcode className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">How to scan:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-800">
                <li>Use a USB barcode scanner to scan automatically</li>
                <li>Or type/paste the barcode manually and press Enter</li>
                {showCameraOption && <li>Or use your device camera to scan</li>}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

BarcodeScanner.displayName = 'BarcodeScanner';

export default BarcodeScanner;