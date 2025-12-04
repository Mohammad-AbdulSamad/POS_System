// import express from "express";
// import cors from "cors";
// import userRoutes from "./routes/users.routes.js";
// import branchRoutes from "./routes/branches.routes.js";
// import categorieRoutes from "./routes/categories.routes.js";
// import productRoutes from "./routes/products.routes.js";
// import supplierRoutes from "./routes/suppliers.routes.js";
// import customerRoutes from "./routes/customers.routes.js";
// import transactionRoutes from "./routes/transactions.routes.js";
// import transactionLinesRoutes from "./routes/transactionLines.routes.js";
// import paymentsRoutes from "./routes/payments.routes.js";
// import stockMovementsRoutes from "./routes/stockMovements.routes.js";
// import taxRatesRoutes from "./routes/taxRates.routes.js";
// import promotionsRoutes from "./routes/promotions.routes.js";
// import returnsRoutes from "./routes/returns.routes.js";
// import authRoutes from "./routes/auth.routes.js";
// import { authenticate, requireRole } from "./middleware/auth.middleware.js";

// const app = express();

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Routes
// app.use("/api/auth", authRoutes);
// app.use("/api/users",  userRoutes);
// app.use("/api/branches", branchRoutes);
// app.use("/api/categories", categorieRoutes);
// app.use("/api/products", productRoutes);
// app.use("/api/suppliers", supplierRoutes);
// app.use("/api/customers", customerRoutes);
// app.use("/api/transactions", transactionRoutes);
// app.use("/api/transaction-lines", transactionLinesRoutes);
// app.use("/api/payments", paymentsRoutes);
// app.use("/api/stock-Movements", stockMovementsRoutes);
// app.use("/api/taxrates", taxRatesRoutes);
// app.use("/api/promotions", promotionsRoutes);
// app.use("/api/returns", returnsRoutes);


// // Server
// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
// export default app;
// server.js - Updated with Error Handling & Logging
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import logger and error handlers
import logger from './config/logger.config.js';
import { 
  errorHandler, 
  notFoundHandler,
  handleUnhandledRejection,
  handleUncaughtException 
} from './middleware/errorHandler.middleware.js';
import { 
  correlationId,
  requestLogger, 
  responseTimeLogger 
} from './middleware/requestLogger.middleware.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import branchesRoutes from './routes/branches.routes.js';
import categoriesRoutes from './routes/categories.routes.js';
import customersRoutes from './routes/customers.routes.js';
import paymentsRoutes from './routes/payments.routes.js';
import productsRoutes from './routes/products.routes.js';
import promotionsRoutes from './routes/promotions.routes.js';
import returnsRoutes from './routes/returns.routes.js';
import stockMovementsRoutes from './routes/stockMovements.routes.js';
import suppliersRoutes from './routes/suppliers.routes.js';
import taxRatesRoutes from './routes/taxRates.routes.js';
import transactionLinesRoutes from './routes/transactionLines.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';

// Load environment variables
dotenv.config();

// Handle uncaught exceptions and unhandled rejections
handleUncaughtException();
handleUnhandledRejection();

const app = express();

// =====================================
// MIDDLEWARE
// =====================================

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true,
}));

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Correlation ID (for request tracking)
app.use(correlationId);

// Request logging (Morgan + Winston)
app.use(requestLogger);

// Response time tracking
app.use(responseTimeLogger);

// =====================================
// HEALTH CHECK
// =====================================

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/ping', (req, res) => {
  res.json({ message: 'pong' });
});

// =====================================
// API ROUTES
// =====================================

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/branches', branchesRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/customers', customersRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/promotions', promotionsRoutes);
app.use('/api/returns', returnsRoutes);
app.use('/api/stock-movements', stockMovementsRoutes);
app.use('/api/suppliers', suppliersRoutes);
app.use('/api/tax-rates', taxRatesRoutes);
app.use('/api/transaction-lines', transactionLinesRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// =====================================
// ERROR HANDLING
// =====================================

// 404 handler (must be after all routes)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// =====================================
// START SERVER
// =====================================

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`📊 Logging level: ${logger.level}`);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;