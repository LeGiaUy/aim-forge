import { Router } from "express";
import { getBrands } from "../controllers/brandController.js";

const router = Router();

router.get("/", getBrands);

export default router;
