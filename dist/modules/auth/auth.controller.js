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
exports.toggleAgent = exports.toggleUserBlock = exports.login = exports.register = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_model_1 = __importDefault(require("./auth.model"));
const auth_interface_1 = require("./auth.interface");
const wallet_model_1 = require("../wallet/wallet.model");
const user_model_1 = require("../user/user.model");
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
// ================= Register =================
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, email, password, role } = auth_interface_1.registerSchema.parse(req.body);
        // check existing email
        const existingUser = yield auth_model_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }
        // hash password
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // create new user in Auth collection
        const newUser = yield auth_model_1.default.create({
            name,
            email,
            password: hashedPassword,
            role,
            // ✅ string enum instead of boolean
            isApproved: role !== "agent" ? "approve" : "suspend",
        });
        // create wallet for this user
        const wallet = yield wallet_model_1.Wallet.create({
            authId: newUser._id,
            balance: 50, // initial balance
            isBlocked: false,
        });
        // create user in User collection
        yield user_model_1.User.create({
            authId: newUser._id,
            walletBalance: wallet.balance,
            isBlocked: wallet.isBlocked,
        });
        res.status(201).json({
            message: "User registered successfully",
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                isApproved: newUser.isApproved,
                walletBalance: wallet.balance,
                isBlocked: wallet.isBlocked,
            },
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Register error:", errorMessage);
        res.status(500).json({
            message: "Internal server error",
            error: errorMessage,
        });
    }
});
exports.register = register;
// ================= Login =================
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = auth_interface_1.loginSchema.parse(req.body);
        const user = yield auth_model_1.default.findOne({ email }).select("+password");
        if (!user)
            return res.status(400).json({ message: "Invalid email or password" });
        if (user.isBlocked) {
            return res.status(403).json({ message: "Your account has been blocked. Please contact support." });
        }
        const isMatch = yield bcrypt_1.default.compare(password, user.password);
        if (!isMatch)
            return res.status(400).json({ message: "Invalid email or password" });
        const wallet = yield wallet_model_1.Wallet.findOne({ authId: user._id });
        const token = jsonwebtoken_1.default.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
        res.status(200).json({
            message: (wallet === null || wallet === void 0 ? void 0 : wallet.isBlocked)
                ? "Login successful, but wallet is blocked"
                : "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isApproved: user.isApproved, // agent status দেখাবে
                walletBalance: (wallet === null || wallet === void 0 ? void 0 : wallet.balance) || 0,
                walletBlocked: (wallet === null || wallet === void 0 ? void 0 : wallet.isBlocked) || false,
                accountBlocked: user.isBlocked || false,
            },
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Login error:", errorMessage);
        res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
});
exports.login = login;
/**
 * Admin: Block / Unblock
 */
const toggleUserBlock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authUser = yield auth_model_1.default.findById(req.params.id);
        if (!authUser)
            return res.status(404).json({ message: "Auth user not found" });
        if (authUser.role === "admin") {
            return res.status(403).json({ message: "You cannot block another admin" });
        }
        authUser.isBlocked = !authUser.isBlocked;
        yield authUser.save();
        yield user_model_1.User.updateOne({ authId: authUser._id }, { $set: { isBlocked: authUser.isBlocked } });
        res.json({
            message: `${authUser.name} ${authUser.isBlocked ? "blocked" : "unblocked"}`,
            authUser,
        });
    }
    catch (err) {
        let errorMessage = "Unknown error";
        if (err instanceof Error) {
            errorMessage = err.message;
        }
        console.error("toggleUserBlock error:", errorMessage);
        res.status(500).json({ message: "Server error", error: errorMessage });
    }
});
exports.toggleUserBlock = toggleUserBlock;
/**
 * Admin: Approve / Suspend Agent
 */
const toggleAgent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const agent = yield auth_model_1.default.findById(req.params.id);
        console.log(agent);
        if (!agent || agent.role !== "agent")
            return res.status(404).json({ message: "Agent not found" });
        // ✅ toggle using string enum
        agent.isApproved = agent.isApproved === "approve" ? "suspend" : "approve";
        yield agent.save();
        res.json({
            message: `Agent ${agent.isApproved} successfully`,
            agent
        });
    }
    catch (err) {
        let errorMessage = "Unknown error";
        if (err instanceof Error)
            errorMessage = err.message;
        console.error("toggleAgent error:", errorMessage);
        res.status(500).json({ message: "Server error", error: errorMessage });
    }
});
exports.toggleAgent = toggleAgent;
