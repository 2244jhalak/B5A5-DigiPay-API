import { Router } from "express";
import {
  getWallet,
  topUp,
  withdraw,
  sendMoney,
  cashIn,
  cashOut,
  toggleWalletBlock,
  
} from "./wallet.controller";
import { authenticate, authorize } from "../auth/auth.middleware";

const router = Router();

/**
 * User routes
 */
router.get("/me", authenticate, authorize(["user", "agent", "admin"]), getWallet); // view own wallet
router.post("/topup", authenticate, authorize(["user"]), topUp); // user top-up
router.post("/withdraw", authenticate, authorize(["user"]), withdraw); // user withdraw
router.post("/send", authenticate, authorize(["user"]), sendMoney); // user send money

/**
 * Agent routes
 */
router.post("/cash-in", authenticate, authorize(["agent"]), cashIn); // agent adds money to user
router.post("/cash-out", authenticate, authorize(["agent"]), cashOut); // agent withdraws from user


/**
 * Admin routes
 */
// Admin route to get any user's wallet
router.get("/:authId", authenticate, authorize(["admin"]), getWallet);

router.patch("/block/:walletId", authenticate, authorize(["admin"]), toggleWalletBlock); // block/unblock wallet

export default router;
