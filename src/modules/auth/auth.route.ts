import { Router } from "express";
import { register, login, toggleUserBlock, toggleAgent } from "./auth.controller";
import { authenticate, authorize } from "./auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);



/**
 * Admin routes
 */

router.patch("/block/:id", authenticate, authorize(["admin"]), toggleUserBlock);

// ✅ Admin can approve/suspend agent
router.patch("/agentApprove/:id", authenticate, authorize(["admin"]), toggleAgent);

export default router;
