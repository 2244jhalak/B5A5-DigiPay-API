import { Router } from "express";
import { register, login, toggleUserBlock } from "./auth.controller";
import { authenticate, authorize } from "./auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);



/**
 * Admin routes
 */

router.patch("/block/:id", authenticate, authorize(["admin"]), toggleUserBlock);


export default router;
