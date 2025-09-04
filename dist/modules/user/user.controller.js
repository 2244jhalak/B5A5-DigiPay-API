"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserController = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const auth_model_1 = __importDefault(require("../auth/auth.model")); // Auth collection
const user_model_1 = require("./user.model"); // User collection
const wallet_model_1 = require("../wallet/wallet.model"); // Wallet collection
const user_interface_1 = require("./user.interface");
/**
 * Create User + Wallet after Auth creation
 */
const createUserWithWallet = (authId_1, ...args_1) => __awaiter(void 0, [authId_1, ...args_1], void 0, function* (authId, initialBalance = 50) {
    // Validate input for User collection
    const validatedData = user_interface_1.userSchema.parse({ authId });
    // Create User
    const newUser = yield user_model_1.User.create({
        authId: validatedData.authId,
        isBlocked: false,
    });
    // Create Wallet
    const wallet = yield wallet_model_1.Wallet.create({
        authId: validatedData.authId,
        balance: initialBalance,
        isBlocked: false,
    });
    return { user: newUser, wallet };
});
/**
 * Admin endpoint to create a new auth + linked user & wallet
 */
const createUserController = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, role, initialBalance } = req.body;
        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({ message: "Missing required fields" });
        }
        // Check if email already exists
        const existingAuth = yield auth_model_1.default.findOne({ email });
        if (existingAuth) {
            return res.status(400).json({ message: "Email already exists" });
        }
        // Hash password
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // 1️⃣ Create Auth document first
        const newAuth = yield auth_model_1.default.create({
            name,
            email,
            password: hashedPassword,
            role, // "user" or "agent" or "admin"
            isBlocked: false,
            isApproved: role === "agent" ? "suspend" : "approve", // agents start as suspended, others approved
        });
        // 2️⃣ Create User & Wallet using newAuth._id
        const { user, wallet } = yield createUserWithWallet(newAuth._id.toString(), initialBalance);
        res.status(201).json({
            message: "Auth, User, and Wallet created successfully",
            auth: newAuth,
            user,
            wallet,
        });
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(error);
        res.status(500).json({ message: "Server error", error: message });
    }
});
exports.createUserController = createUserController;
