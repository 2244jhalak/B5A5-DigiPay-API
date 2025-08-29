import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import { getTransactions } from "./transaction.controller";

const router = Router();

// Only authenticated users or admins can access
router.get("/", authenticate, authorize(["user", "agent", "admin"]), getTransactions);

export default router;
