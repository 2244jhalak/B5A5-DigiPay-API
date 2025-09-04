"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorize = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
/**
 * Authentication Middleware
 */
const authenticate = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized: No token provided" });
        }
        const token = authHeader.split(" ")[1];
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        req.user = {
            id: decoded.id,
            role: decoded.role
        };
        next();
    }
    catch (err) {
        const errorMessage = "Unauthorized: Invalid token";
        if (err instanceof Error) {
            console.error("Auth error:", err.message);
        }
        else {
            console.error("Auth error:", err);
        }
        return res.status(401).json({ message: errorMessage });
    }
};
exports.authenticate = authenticate;
/**
 * Role-based Authorization Middleware
 */
const authorize = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Forbidden: Insufficient permissions" });
        }
        next();
    };
};
exports.authorize = authorize;
