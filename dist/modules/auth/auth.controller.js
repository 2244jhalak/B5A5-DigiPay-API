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
exports.getAllAuthIds = exports.getAllUsers = exports.toggleUserRole = exports.toggleAgent = exports.toggleUserBlock = exports.updateProfile = exports.login = exports.register = void 0;
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
        const { name, email, password } = auth_interface_1.registerSchema.parse(req.body);
        // check existing email
        const existingUser = yield auth_model_1.default.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }
        // hash password
        const hashedPassword = yield bcrypt_1.default.hash(password, 10);
        // create new user in Auth collection (role always user)
        const newUser = yield auth_model_1.default.create({
            name,
            email,
            password: hashedPassword,
            role: "user",
            isBlocked: false,
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
        // generate JWT token
        const token = jsonwebtoken_1.default.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: "7d" });
        res.status(201).json({
            message: "User registered successfully",
            token, // ✅ Token send for auto-login
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
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
            user: Object.assign({ id: user._id, name: user.name, email: user.email, role: user.role, isApproved: user.role === "agent" ? user.isApproved : undefined, walletBalance: (wallet === null || wallet === void 0 ? void 0 : wallet.balance) || 0, walletBlocked: (wallet === null || wallet === void 0 ? void 0 : wallet.isBlocked) || false, accountBlocked: user.isBlocked || false }, (user.profileImage && { profileImage: user.profileImage }) // optional inclusion
            )
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Login error:", errorMessage);
        res.status(500).json({ message: "Internal server error", error: errorMessage });
    }
});
exports.login = login;
// ================= Update Profile =================
const updateProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.params.authId;
        const { name, profileImage, newPassword, email } = req.body;
        const user = yield auth_model_1.default.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        // Email update (check duplicate)
        if (email && email !== user.email) {
            const existingUser = yield auth_model_1.default.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ message: "Email already in use" });
            }
            user.email = email;
        }
        // Name update
        if (name && name.trim() !== "") {
            user.name = name;
        }
        // Profile Image update
        if (profileImage && profileImage.trim() !== "") {
            user.profileImage = profileImage;
        }
        // Password update with restriction
        if (newPassword && newPassword.trim() !== "") {
            if (newPassword.length < 6) {
                return res.status(400).json({
                    message: "Password must be at least 6 characters long",
                });
            }
            const salt = yield bcrypt_1.default.genSalt(10);
            const hashedPassword = yield bcrypt_1.default.hash(newPassword, salt);
            user.password = hashedPassword;
        }
        yield user.save();
        res.status(200).json({
            message: "Profile updated successfully",
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                profileImage: user.profileImage,
                role: user.role,
                isBlocked: user.isBlocked,
            },
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("Update profile error:", errorMessage);
        res.status(500).json({
            message: "Internal server error",
            error: errorMessage,
        });
    }
});
exports.updateProfile = updateProfile;
// ================= Admin: Block / Unblock =================
const toggleUserBlock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authUser = yield auth_model_1.default.findById(req.params.authId);
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
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("toggleUserBlock error:", errorMessage);
        res.status(500).json({ message: "Server error", error: errorMessage });
    }
});
exports.toggleUserBlock = toggleUserBlock;
// ================= Admin: Approve / Suspend Agent =================
const toggleAgent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const agent = yield auth_model_1.default.findById(req.params.authId);
        if (!agent || agent.role !== "agent")
            return res.status(404).json({ message: "Agent not found" });
        // toggle approve/suspend
        agent.isApproved = agent.isApproved === "approve" ? "suspend" : "approve";
        yield agent.save();
        res.json({
            message: `Agent ${agent.isApproved} successfully`,
            agent
        });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("toggleAgent error:", errorMessage);
        res.status(500).json({ message: "Server error", error: errorMessage });
    }
});
exports.toggleAgent = toggleAgent;
// ================= Admin: Change Role =================
const toggleUserRole = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authUser = yield auth_model_1.default.findById(req.params.authId);
        if (!authUser)
            return res.status(404).json({ message: "User not found" });
        if (authUser.role === "admin") {
            return res.status(403).json({ message: "You cannot change another admin's role" });
        }
        // Toggle logic
        if (authUser.role === "user") {
            authUser.role = "agent";
            authUser.isApproved = "suspend"; // new agent must be approved later
        }
        else if (authUser.role === "agent") {
            authUser.role = "user";
            authUser.isApproved = undefined;
        }
        yield authUser.save();
        res.json({
            message: `Role toggled successfully to ${authUser.role}`,
            authUser,
        });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("toggleUserRole error:", errorMessage);
        res.status(500).json({ message: "Server error", error: errorMessage });
    }
});
exports.toggleUserRole = toggleUserRole;
// ================= Admin: Get all users =================
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Admin এর জন্য সব auth data fetch
        const users = yield auth_model_1.default.find().select("-password"); // password hide করা
        res.status(200).json({
            message: "All users fetched successfully",
            users,
        });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("getAllUsers error:", errorMessage);
        res.status(500).json({ message: "Server error", error: errorMessage });
    }
});
exports.getAllUsers = getAllUsers;
// ================= Admin: Get all Auth IDs =================
const getAllAuthIds = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const authIds = yield auth_model_1.default.find({}, "_id name email").lean();
        res.status(200).json({
            message: "Auth IDs fetched successfully",
            authIds: authIds.map((u) => ({
                id: u._id,
                name: u.name,
                email: u.email,
            })),
        });
    }
    catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("getAllAuthIds error:", errorMessage);
        res.status(500).json({ message: "Server error", error: errorMessage });
    }
});
exports.getAllAuthIds = getAllAuthIds;
