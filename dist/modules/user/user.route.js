"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_middleware_1 = require("../auth/auth.middleware");
const user_controller_1 = require("./user.controller");
const router = express_1.default.Router();
router.post("/create", auth_middleware_1.authenticate, // User must be logged in
(0, auth_middleware_1.authorize)(["admin"]), // Only admin can create users
user_controller_1.createUserController);
exports.default = router;
