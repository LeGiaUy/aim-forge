import { Router } from "express";
import { getCart, addItem, updateItem, removeItem } from "../controllers/cartController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);

router.get("/", getCart);
router.post("/add", addItem);
router.put("/update", updateItem);
router.delete("/remove", removeItem);

export default router;
