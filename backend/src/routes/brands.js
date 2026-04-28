import { Router } from "express";
import {
  createBrand,
  deleteBrand,
  getBrands,
  updateBrand,
} from "../controllers/brandController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

router.get("/", getBrands);
router.post("/", requireAuth, requireRole("admin"), createBrand);
router.put("/:id", requireAuth, requireRole("admin"), updateBrand);
router.delete("/:id", requireAuth, requireRole("admin"), deleteBrand);

export default router;
