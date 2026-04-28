import { Router } from "express";
import { createPayment, confirmPayment } from "../controllers/paymentController.js";
import { requireAuth } from "../middlewares/auth.js";

const router = Router();

router.use(requireAuth);

router.post("/create", createPayment);
router.patch("/:id/confirm", confirmPayment);

export default router;
