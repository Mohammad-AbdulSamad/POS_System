import express from "express";
import cors from "cors";
import userRoutes from "./routes/users.routes.js";
import branchRoutes from "./routes/branches.routes.js";
import categorieRoutes from "./routes/categories.routes.js";
import productRoutes from "./routes/products.routes.js";

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/users", userRoutes);
app.use("/branches", branchRoutes);
app.use("/categories", categorieRoutes);
app.use("/products", productRoutes);
// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
