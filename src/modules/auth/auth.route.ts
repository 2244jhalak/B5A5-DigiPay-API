import { Router } from "express";
import { 
  register, 
  login, 
  toggleUserBlock, 
  toggleAgent, 
  
  getAllUsers,
  toggleUserRole,
  updateProfile
} from "./auth.controller";
import { authenticate, authorize } from "./auth.middleware";

const router = Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.patch("/updateProfile", authenticate, updateProfile);

// ================= Admin routes =================

// Block / Unblock user
router.patch("/block/:authId", authenticate, authorize(["admin"]), toggleUserBlock);

// Approve / Suspend agent
router.patch("/agentApprove/:authId", authenticate, authorize(["admin"]), toggleAgent);

// ✅ Change user role (user → agent/admin or agent → user)
router.patch("/changeRole/:authId", authenticate, authorize(["admin"]), toggleUserRole);

router.get("/all", authenticate, authorize(["admin"]), getAllUsers);

export default router;
