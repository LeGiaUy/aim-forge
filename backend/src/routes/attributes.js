import { Router } from "express";
import {
  createAttribute,
  deleteAttribute,
  getAttributes,
  updateAttribute,
} from "../controllers/attributeController.js";
import { requireAuth, requireRole } from "../middlewares/auth.js";

const router = Router();

// Public route to fetch attributes (often needed for filtering as well)
router.get("/", getAttributes);
router.post("/", requireAuth, requireRole("admin"), createAttribute);
router.put("/:id", requireAuth, requireRole("admin"), updateAttribute);
router.delete("/:id", requireAuth, requireRole("admin"), deleteAttribute);

export default router;
