import { Router } from "express";
import {
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from "../controllers/categoryController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/", getCategories);
router.post("/", requireAuth, requireRole("admin"), createCategory);
router.put("/:id", requireAuth, requireRole("admin"), updateCategory);
router.delete("/:id", requireAuth, requireRole("admin"), deleteCategory);

export default router;
