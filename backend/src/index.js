import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";
import errorHandler from "./middlewares/errorHandler.js";

import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import categoryRoutes from "./routes/categories.js";
import brandRoutes from "./routes/brands.js";
import cartRoutes from "./routes/cart.js";
import orderRoutes from "./routes/orders.js";
import paymentRoutes from "./routes/payment.routes.js";
import adminOrderRoutes from "./routes/adminOrder.routes.js";
import statsRoutes from './routes/stats.routes.js'
import attributeRoutes from "./routes/attributes.js";
import uploadRoutes from "./routes/uploads.js";

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ success: true, message: "AimForge API is running 🎯" }));

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin/orders", adminOrderRoutes);
app.use('/api/admin/stats', statsRoutes)
app.use("/api/attributes", attributeRoutes);
app.use("/api/uploads", uploadRoutes);

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found", data: null });
});

// ─── Centralized error handler ────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ────────────────────────────────────────────────────────────────────
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🎯 AimForge API running on http://localhost:${PORT}`);
  });
});