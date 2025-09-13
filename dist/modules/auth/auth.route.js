"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("./auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.post("/register", auth_controller_1.register);
router.post("/login", auth_controller_1.login);
router.patch("/updateProfile", auth_middleware_1.authenticate, auth_controller_1.updateProfile);
// ================= Admin routes =================
// Block / Unblock user
router.patch("/block/:authId", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["admin"]), auth_controller_1.toggleUserBlock);
// Approve / Suspend agent
router.patch("/agentApprove/:authId", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["admin"]), auth_controller_1.toggleAgent);
// ✅ Change user role (user → agent/admin or agent → user)
router.patch("/changeRole/:authId", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["admin"]), auth_controller_1.toggleUserRole);
router.get("/all", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["admin"]), auth_controller_1.getAllUsers);
exports.default = router;
