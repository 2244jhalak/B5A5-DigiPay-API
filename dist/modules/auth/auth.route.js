"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("./auth.controller");
const auth_middleware_1 = require("./auth.middleware");
const router = (0, express_1.Router)();
router.post("/register", auth_controller_1.register);
router.post("/login", auth_controller_1.login);
/**
 * Admin routes
 */
router.patch("/block/:id", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["admin"]), auth_controller_1.toggleUserBlock);
exports.default = router;
