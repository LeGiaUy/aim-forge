import { Router } from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// Public
router.get("/", getProducts);
router.get("/:id", getProductById);

// Admin only
router.post("/", requireAuth, requireRole("admin"), createProduct);
router.put("/:id", requireAuth, requireRole("admin"), updateProduct);
router.delete("/:id", requireAuth, requireRole("admin"), deleteProduct);

export default router;
