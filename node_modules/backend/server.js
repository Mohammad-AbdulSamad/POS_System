import express from "express";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";
import branchRoutes from "./routes/branches.routes.js";
import categorieRoutes from "./routes/categories.routes.js";
import productRoutes from "./routes/products.routes.js";
import supplierRoutes from "./routes/suppliers.routes.js";
import customerRoutes from "./routes/customers.routes.js";
import transactionRoutes from "./routes/transactions.routes.js";
import transactionLinesRoutes from "./routes/transactionLines.routes.js";
import paymentsRoutes from "./routes/payments.routes.js";
import stockMovementsRoutes from "./routes/stockMovements.routes.js";
import taxRatesRoutes from "./routes/taxRates.routes.js";
import promotionsRoutes from "./routes/promotions.routes.js";
import returnsRoutes from "./routes/returns.routes.js";
import authRoutes from "./routes/auth.routes.js";
import { authenticate, requireRole } from "./middleware/auth.middleware.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users",  userRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/categories", categorieRoutes);
app.use("/api/products", productRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/transaction-lines", transactionLinesRoutes);
app.use("/api/payments", paymentsRoutes);
app.use("/api/stock-Movements", stockMovementsRoutes);
app.use("/api/taxrates", taxRatesRoutes);
app.use("/api/promotions", promotionsRoutes);
app.use("/api/returns", returnsRoutes);


// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
export default app;