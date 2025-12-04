// src/components/inventory/StockHistoryTable.jsx
import { useState, useEffect } from 'react';
import Table from '../common/Table';
import Badge from '../common/Badge';
import Spinner from '../common/Spinner';
import { formatDateTime } from '../../utils/formatters';

import { TrendingUp, TrendingDown, Package } from 'lucide-react';
import * as productService from '../../services/productService';

/**
 * StockHistoryTable Component
 * 
 * Displays stock movement history for a product
 * Shows: date, change, reason, notes, user
 */

const StockHistoryTable = ({
  productId,
  limit = 50,
}) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch stock history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!productId) return;

      setLoading(true);
      setError(null);

      try {
        const data = await productService.getStockHistory(productId, { limit });
        setHistory(data.stockMovements || data || []);
      } catch (err) {
        setError(err.message || 'Failed to load stock history');
        console.error('Stock history error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [productId, limit]);

  // Define columns
  const columns = [
    {
      key: 'createdAt',
      header: 'Date & Time',
      sortable: true,
      width: '200px',
      render: (value) => (
        <span className="text-sm text-gray-900">
          {formatDateTime(value)}
        </span>
      ),
    },
    {
      key: 'change',
      header: 'Change',
      sortable: true,
      align: 'center',
      width: '120px',
      render: (value) => {
        const isIncrease = value > 0;
        const Icon = isIncrease ? TrendingUp : TrendingDown;
        
        return (
          <div className={`flex items-center justify-center gap-1 ${
            isIncrease ? 'text-success-600' : 'text-danger-600'
          }`}>
            <Icon className="h-4 w-4" />
            <span className="font-semibold">
              {isIncrease ? '+' : ''}{value}
            </span>
          </div>
        );
      },
    },
    {
      key: 'reason',
      header: 'Reason',
      sortable: true,
      width: '180px',
      render: (value) => (
        <Badge variant="gray" size="sm">
          {[value] || value}
        </Badge>
      ),
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value || '-'}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'User',
      width: '150px',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value?.name || 'System'}
        </span>
      ),
    },
    {
      key: 'branch',
      header: 'Branch',
      width: '150px',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value?.name || '-'}
        </span>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-danger-600 mb-2">Error loading history</div>
        <div className="text-sm text-gray-500">{error}</div>
      </div>
    );
  }

  // Calculate summary statistics
  const totalIncrease = history
    .filter(m => m.change > 0)
    .reduce((sum, m) => sum + m.change, 0);
  
  const totalDecrease = history
    .filter(m => m.change < 0)
    .reduce((sum, m) => sum + Math.abs(m.change), 0);

  const netChange = totalIncrease - totalDecrease;

  return (
    <div className="space-y-4">
      {/* Summary Statistics */}
      {history.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-success-50 border border-success-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-success-700 mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-sm font-medium">Total Added</span>
            </div>
            <div className="text-2xl font-bold text-success-900">
              +{totalIncrease}
            </div>
          </div>

          <div className="bg-danger-50 border border-danger-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-danger-700 mb-1">
              <TrendingDown className="h-4 w-4" />
              <span className="text-sm font-medium">Total Removed</span>
            </div>
            <div className="text-2xl font-bold text-danger-900">
              -{totalDecrease}
            </div>
          </div>

          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center gap-2 text-primary-700 mb-1">
              <Package className="h-4 w-4" />
              <span className="text-sm font-medium">Net Change</span>
            </div>
            <div className={`text-2xl font-bold ${
              netChange > 0 ? 'text-success-900' : 
              netChange < 0 ? 'text-danger-900' : 
              'text-gray-900'
            }`}>
              {netChange > 0 ? '+' : ''}{netChange}
            </div>
          </div>
        </div>
      )}

      {/* History Table */}
      <Table
        columns={columns}
        data={history}
        hover
        compact
        emptyMessage="No stock movements recorded yet"
      />
    </div>
  );
};

export default StockHistoryTable;