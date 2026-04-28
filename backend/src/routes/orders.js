import { Router } from "express";
import { createOrder, getOrders, getOrderById } from "../controllers/orderController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/create", createOrder);
router.get("/", getOrders);
router.get("/:id", getOrderById);

export default router;
