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

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/users", userRoutes);
app.use("/branches", branchRoutes);
app.use("/categories", categorieRoutes);
app.use("/products", productRoutes);
app.use("/suppliers", supplierRoutes);
app.use("/customers", customerRoutes);
app.use("/transactions", transactionRoutes);
app.use("/transactionLines", transactionLinesRoutes);
app.use("/payments", paymentsRoutes);
app.use("/stockMovements", stockMovementsRoutes);
app.use("/taxRates", taxRatesRoutes);
app.use("/promotions", promotionsRoutes);
// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
