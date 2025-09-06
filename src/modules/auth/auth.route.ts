import { Router } from "express";
import { 
  register, 
  login, 
  toggleUserBlock, 
  toggleAgent, 
  
  getAllUsers,
  toggleUserRole
} from "./auth.controller";
import { authenticate, authorize } from "./auth.middleware";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);

// ================= Admin routes =================

// Block / Unblock user
router.patch("/block/:authId", authenticate, authorize(["admin"]), toggleUserBlock);

// Approve / Suspend agent
router.patch("/agentApprove/:authId", authenticate, authorize(["admin"]), toggleAgent);

// ✅ Change user role (user → agent/admin or agent → user)
router.patch("/changeRole/:authId", authenticate, authorize(["admin"]), toggleUserRole);
// ================= Admin routes =================
router.get("/all", authenticate, authorize(["admin"]), getAllUsers);


export default router;
