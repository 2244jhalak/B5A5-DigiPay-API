"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const wallet_controller_1 = require("./wallet.controller");
const auth_middleware_1 = require("../auth/auth.middleware");
const router = (0, express_1.Router)();
/**
 * User routes
 */
router.get("/me", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["user", "agent", "admin"]), wallet_controller_1.getWallet); // view own wallet
router.post("/topup", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["user"]), wallet_controller_1.topUp); // user top-up
router.post("/withdraw", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["user"]), wallet_controller_1.withdraw); // user withdraw
router.post("/send", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["user"]), wallet_controller_1.sendMoney); // user send money
/**
 * Agent routes
 */
router.post("/cash-in", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["agent"]), wallet_controller_1.cashIn); // agent adds money to user
router.post("/cash-out", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["agent"]), wallet_controller_1.cashOut); // agent withdraws from user
/**
 * Admin routes
 */
// Admin route to get any user's wallet
router.get("/:authId", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["admin"]), wallet_controller_1.getWallet);
router.patch("/block/:walletId", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["admin"]), wallet_controller_1.toggleWalletBlock); // block/unblock wallet
exports.default = router;
