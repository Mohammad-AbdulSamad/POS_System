import { useState, useEffect, useCallback } from 'react';
import { dashboardService } from '../services/dashboardService';

export const useDashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);

  const [loading, setLoading] = useState({
    stats: true,
    sales: true,
    transactions: true,
    products: true,
    lowStock: true,
  });

  const [error, setError] = useState(null);

  // Fetch dashboard stats
  const fetchStats = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, stats: true }));
      const data = await dashboardService.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load statistics');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, stats: false }));
    }
  }, []);

  // Fetch sales data
  const fetchSalesData = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, sales: true }));
      const data = await dashboardService.getSalesChartData();
      setSalesData(data);
    } catch (err) {
      setError('Failed to load sales data');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, sales: false }));
    }
  }, []);



  // Fetch recent transactions
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, transactions: true }));
      const data = await dashboardService.getRecentTransactions();
      setTransactions(data);
    } catch (err) {
      setError('Failed to load transactions');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, transactions: false }));
    }
  }, []);

  // Fetch top products
  const fetchTopProducts = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, products: true }));
      const data = await dashboardService.getTopProducts();
      setTopProducts(data);
    } catch (err) {
      setError('Failed to load top products');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, products: false }));
    }
  }, []);

  // Fetch low stock items
  const fetchLowStockItems = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, lowStock: true }));
      const data = await dashboardService.getLowStockItems();
      setLowStockItems(data);
    } catch (err) {
      setError('Failed to load low stock items');
      console.error(err);
    } finally {
      setLoading(prev => ({ ...prev, lowStock: false }));
    }
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchStats(),
      fetchSalesData(),
      fetchTransactions(),
      fetchTopProducts(),
      fetchLowStockItems(),
    ]);
  }, [
   fetchStats,
    fetchSalesData,
    fetchTransactions,
    fetchTopProducts,
    fetchLowStockItems,
  ]);

  // Initial load
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  return {
    stats,
    salesData,
    transactions,
    topProducts,
    lowStockItems,
    loading,
    error,
    fetchStats,
    fetchSalesData,
    fetchTransactions,
    fetchTopProducts,
    fetchLowStockItems,
    refreshAll,
  };
};
