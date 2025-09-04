"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../auth/auth.middleware");
const transaction_controller_1 = require("./transaction.controller");
const router = (0, express_1.Router)();
// Authenticated users or admins can access transaction history
router.get("/", auth_middleware_1.authenticate, (0, auth_middleware_1.authorize)(["user", "agent", "admin"]), transaction_controller_1.getTransactions);
exports.default = router;
