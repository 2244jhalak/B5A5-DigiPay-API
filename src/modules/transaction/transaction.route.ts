import { Router } from "express";
import { authenticate, authorize } from "../auth/auth.middleware";
import { getTransactions } from "./transaction.controller";

const router = Router();

// Authenticated users or admins can access transaction history
router.get("/", authenticate, authorize(["user", "agent", "admin"]), getTransactions);


export default router;
