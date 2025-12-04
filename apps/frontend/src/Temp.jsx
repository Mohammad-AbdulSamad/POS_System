import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/auth/ProtectedRoute';
import DashboardPage from './pages/dashboard/DashboardPage';
import POSPage from './pages/pos/POSPage';
import LoginPage from './pages/auth/LoginPage';

import ProductsListPage from './pages/inventory/ProductListPage';
import AddProductPage from './pages/inventory/AddProductPage';
import BulkImportPage from './pages/inventory/BulkImportPage';
import CategoriesPage from './pages/inventory/CategoriesPage';
import ProductDetailsPage from './pages/inventory/ProductDetailsPage';
import EditProductPage from './pages/inventory/EditProductPage';
import LowStockPage from './pages/inventory/LowStockPage';
import StockAdjustmentPage from './pages/inventory/StockAdjustmentPage';
import SuppliersPage from './pages/inventory/SuppliersPage';
import SalesHistoryPage from './pages/sales/SalesHistoryPage';
import TransactionDetailsPage from './pages/sales/TransactionDetailsPage';


const Temp = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========== PUBLIC ROUTES ========== */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* ========== PROTECTED ROUTES ========== */}
        
        {/* Dashboard - Home */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        
        {/* Dashboard - Explicit Route */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        
        {/* POS System */}
        <Route
          path="/pos"
          element={
            <ProtectedRoute>
              <POSPage />
            </ProtectedRoute>
          }
        />

                {/* POS System */}
        <Route
          path="/inventory/products"
          element={
            <ProtectedRoute>
              <ProductsListPage />
            </ProtectedRoute>
          }
        />

        {/* Inventory routes */}
        <Route
          path="/inventory/products/add"
          element={
            <ProtectedRoute>
              <AddProductPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/products/bulk-import"
          element={
            <ProtectedRoute>
              <BulkImportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/products/categories"
          element={
            <ProtectedRoute>
              <CategoriesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/suppliers"
          element={
            <ProtectedRoute>
              <SuppliersPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/products/low-stock"
          element={
            <ProtectedRoute>
              <LowStockPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/products/stock-adjustment"
          element={
            <ProtectedRoute>
              <StockAdjustmentPage />
            </ProtectedRoute>
          }
        />

        {/* Sales routes */}
        <Route
          path="/sales/history"
          element={
            <ProtectedRoute>
              <SalesHistoryPage />
            </ProtectedRoute>
          }
        />

       

        {/* Product details and edit (dynamic) - ensure these come after static routes */}
        <Route
          path="/inventory/products/:id"
          element={
            <ProtectedRoute>
              <ProductDetailsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory/products/:id/edit"
          element={
            <ProtectedRoute>
              <EditProductPage />
            </ProtectedRoute>
          }
        />

        {/* Sales routes (dynamic) */}
        <Route
          path="/sales/transactions/:id"
          element={
            <ProtectedRoute>
              <TransactionDetailsPage />
            </ProtectedRoute>
          }
        />

        {/* Example: Admin-only Route */}
        {/* <Route
          path="/settings"
          element={
            <ProtectedRoute requiredRole="admin">
              <SettingsPage />
            </ProtectedRoute>
          }
        /> */}
        
        {/* ========== FALLBACK ========== */}
        {/* Redirect any unknown routes to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default Temp;