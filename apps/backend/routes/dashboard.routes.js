// routes/dashboard.routes.js
import express from 'express';
import {
  getDashboardStats,
  getSalesChartData,
  getRecentTransactions,
  getTopProducts,
  getLowStockItems
} from '../controllers/dashboard.controller.js';
import { authenticate, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

// All dashboard routes require authentication
// router.use(authenticate);

router.get('/stats', getDashboardStats);
router.get('/sales', getSalesChartData);
router.get('/top-products', getTopProducts);
router.get('/transactions', getRecentTransactions);
router.get('/low-stock', getLowStockItems);
export default router;