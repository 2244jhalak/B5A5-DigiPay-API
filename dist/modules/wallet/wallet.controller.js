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
exports.toggleWalletBlock = exports.cashOut = exports.cashIn = exports.sendMoney = exports.withdraw = exports.topUp = exports.getWallet = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const auth_model_1 = __importDefault(require("../auth/auth.model"));
const wallet_model_1 = require("./wallet.model");
const transaction_model_1 = require("../transaction/transaction.model");
const wallet_interface_1 = require("./wallet.interface");
const user_model_1 = require("../user/user.model");
/**
 * Helper: create transaction record
 */
const createTransactionRecord = (data) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    const record = yield transaction_model_1.TransactionModel.create([
        {
            from: (_a = data.from) !== null && _a !== void 0 ? _a : null,
            to: (_b = data.to) !== null && _b !== void 0 ? _b : null,
            amount: data.amount,
            type: data.type,
            initiatedBy: data.initiatedBy,
            fee: (_c = data.fee) !== null && _c !== void 0 ? _c : 0,
            commission: (_d = data.commission) !== null && _d !== void 0 ? _d : 0,
            status: "completed",
        },
    ], { session: (_e = data.session) !== null && _e !== void 0 ? _e : undefined });
    return record[0];
});
/**
 * Get wallet
 */
const getWallet = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const requester = req.user;
        if (!requester)
            return res.status(401).json({ message: "Unauthorized" });
        const param = (_b = (_a = req.params.authId) !== null && _a !== void 0 ? _a : req.query.userId) !== null && _b !== void 0 ? _b : requester.id;
        if (!param)
            return res.status(400).json({ message: "userId is required" });
        let wallet = null;
        if (mongoose_1.default.Types.ObjectId.isValid(param)) {
            // find wallet authId (not _id/userId)
            wallet = yield wallet_model_1.Wallet.findOne({ authId: param })
                .populate("authId", "name email role")
                .lean();
        }
        if (!wallet) {
            return res.status(404).json({ message: "Wallet not found" });
        }
        return res.json({
            wallet: {
                id: wallet._id,
                user: wallet.authId,
                balance: wallet.balance,
                isBlocked: wallet.isBlocked,
                createdAt: wallet.createdAt,
                updatedAt: wallet.updatedAt,
            },
        });
    }
    catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : String(err);
        return res.status(500).json({ message: "Server error", error: message });
    }
});
exports.getWallet = getWallet;
/**
 * Top-up
 */
const topUp = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const parsed = wallet_interface_1.walletSchema.parse(req.body);
        const amount = parsed.amount;
        const authId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!authId)
            return res.status(401).json({ message: "Unauthorized" });
        const wallet = yield wallet_model_1.Wallet.findOne({ authId });
        if (!wallet)
            return res.status(404).json({ message: "Wallet not found" });
        if (wallet.isBlocked)
            return res.status(403).json({ message: "Wallet is blocked" });
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            wallet.balance += amount;
            yield wallet.save({ session });
            yield createTransactionRecord({
                from: null,
                to: wallet._id,
                amount,
                type: "topup",
                initiatedBy: new mongoose_1.default.Types.ObjectId(authId), // authId
                session,
            });
            yield session.commitTransaction();
            session.endSession();
            return res.json({ message: "Top-up successful", balance: wallet.balance });
        }
        catch (txErr) {
            yield session.abortTransaction();
            session.endSession();
            throw txErr;
        }
    }
    catch (err) {
        if (err instanceof Error && err.name === "ZodError") {
            // Zod validation error
            // @ts-expect-error: ZodError has 'errors' property
            return res.status(400).json({ errors: err.errors });
        }
        const message = err instanceof Error ? err.message : String(err);
        console.error(err);
        return res.status(500).json({ message: "Server error", error: message });
    }
});
exports.topUp = topUp;
/**
 * Withdraw
 */
const withdraw = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const parsed = wallet_interface_1.walletSchema.parse(req.body);
        const amount = parsed.amount;
        const authId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!authId)
            return res.status(401).json({ message: "Unauthorized" });
        // Wallet authId
        const wallet = yield wallet_model_1.Wallet.findOne({ authId });
        if (!wallet)
            return res.status(404).json({ message: "Wallet not found" });
        if (wallet.isBlocked)
            return res.status(403).json({ message: "Wallet is blocked" });
        if (wallet.balance < amount)
            return res.status(400).json({ message: "Insufficient balance" });
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            wallet.balance -= amount;
            yield wallet.save({ session });
            yield createTransactionRecord({
                from: wallet._id,
                to: null,
                amount,
                type: "withdraw",
                initiatedBy: new mongoose_1.default.Types.ObjectId(authId), // authId
                session,
            });
            yield session.commitTransaction();
            session.endSession();
            return res.json({ message: "Withdraw successful", balance: wallet.balance });
        }
        catch (txErr) {
            yield session.abortTransaction();
            session.endSession();
            throw txErr;
        }
    }
    catch (err) {
        // Zod validation error
        if (err instanceof Error && err.name === "ZodError") {
            // @ts-expect-error: ZodError has 'errors' property
            return res.status(400).json({ errors: err.errors });
        }
        const message = err instanceof Error ? err.message : String(err);
        console.error(err);
        return res.status(500).json({ message: "Server error", error: message });
    }
});
exports.withdraw = withdraw;
/**
 * Send money
 */
const sendMoney = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const parsed = wallet_interface_1.walletSchema.parse(req.body);
        const { amount, toAuthId } = parsed;
        const fromAuthId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.id;
        if (!fromAuthId)
            return res.status(401).json({ message: "Unauthorized" });
        if (!toAuthId)
            return res.status(400).json({ message: "toAuthId is required" });
        // Wallet authId
        const senderWallet = yield wallet_model_1.Wallet.findOne({ authId: fromAuthId });
        const receiverWallet = yield wallet_model_1.Wallet.findOne({ authId: toAuthId });
        if (!senderWallet || !receiverWallet)
            return res.status(404).json({ message: "Sender or receiver wallet not found" });
        if (senderWallet.isBlocked)
            return res.status(403).json({ message: "Sender wallet is blocked" });
        if (receiverWallet.isBlocked)
            return res.status(403).json({ message: "Receiver wallet is blocked" });
        if (senderWallet.balance < amount)
            return res.status(400).json({ message: "Insufficient balance" });
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            senderWallet.balance -= amount;
            receiverWallet.balance += amount;
            yield senderWallet.save({ session });
            yield receiverWallet.save({ session });
            yield createTransactionRecord({
                from: senderWallet._id,
                to: receiverWallet._id,
                amount,
                type: "send",
                initiatedBy: new mongoose_1.default.Types.ObjectId(fromAuthId), // sender authId
                session,
            });
            yield session.commitTransaction();
            session.endSession();
            return res.json({
                message: "Send successful",
                senderBalance: senderWallet.balance,
                receiverBalance: receiverWallet.balance,
            });
        }
        catch (txErr) {
            yield session.abortTransaction();
            session.endSession();
            throw txErr;
        }
    }
    catch (err) {
        if (err instanceof Error && err.name === "ZodError") {
            // @ts-expect-error: ZodError has 'errors' property
            return res.status(400).json({ errors: err.errors });
        }
        const message = err instanceof Error ? err.message : String(err);
        console.error(err);
        return res.status(500).json({ message: "Server error", error: message });
    }
});
exports.sendMoney = sendMoney;
/**
 * Cash-in
 */
const cashIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // ✅ Fetch full agent info from DB
        const agentAuth = yield auth_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        console.log(agentAuth);
        if (!agentAuth)
            return res.status(404).json({ message: "Agent not found" });
        // Agent role check
        if (agentAuth.role !== "agent")
            return res.status(403).json({ message: "Forbidden: Only agents can perform cash-in" });
        // Agent approval check
        if (agentAuth.isApproved !== "approve")
            return res.status(403).json({ message: "Forbidden: Agent is not approved" });
        // Parse request body
        const parsed = wallet_interface_1.walletSchema.parse(req.body);
        const { amount, toAuthId } = parsed;
        if (!toAuthId)
            return res.status(400).json({ message: "toAuthId is required" });
        // Receiver wallet
        const receiverWallet = yield wallet_model_1.Wallet.findOne({ authId: toAuthId });
        if (!receiverWallet)
            return res.status(404).json({ message: "Receiver wallet not found" });
        if (receiverWallet.isBlocked)
            return res.status(403).json({ message: "Receiver wallet is blocked" });
        // Agent wallet
        const agentWallet = yield wallet_model_1.Wallet.findOne({ authId: agentAuth._id });
        if (!agentWallet)
            return res.status(404).json({ message: "Agent wallet not found" });
        if (agentWallet.isBlocked)
            return res.status(403).json({ message: "Agent wallet is blocked" });
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            const commission = amount * 0.02;
            receiverWallet.balance += amount - commission;
            agentWallet.balance += commission;
            yield receiverWallet.save({ session });
            yield agentWallet.save({ session });
            yield createTransactionRecord({
                from: agentWallet._id,
                to: receiverWallet._id,
                amount,
                type: "cash_in",
                initiatedBy: agentAuth._id,
                commission,
                session,
            });
            yield session.commitTransaction();
            session.endSession();
            return res.json({
                message: "Cash-in successful",
                receiverBalance: receiverWallet.balance,
                agentBalance: agentWallet.balance,
                commission,
            });
        }
        catch (txErr) {
            yield session.abortTransaction();
            session.endSession();
            throw txErr;
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(err);
        return res.status(500).json({ message: "Server error", error: message });
    }
});
exports.cashIn = cashIn;
/**
 * Cash-out
 */
const cashOut = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        // ✅ Fetch full agent info from DB
        const agentAuth = yield auth_model_1.default.findById((_a = req.user) === null || _a === void 0 ? void 0 : _a.id);
        if (!agentAuth)
            return res.status(404).json({ message: "Agent not found" });
        // Agent role check
        if (agentAuth.role !== "agent")
            return res.status(403).json({ message: "Forbidden: Only agents can perform cash-out" });
        // Agent approval check
        if (agentAuth.isApproved !== "approve")
            return res.status(403).json({ message: "Forbidden: Agent is not approved" });
        // Parse request body
        const parsed = wallet_interface_1.walletSchema.parse(req.body);
        const { amount, toAuthId } = parsed;
        if (!toAuthId)
            return res.status(400).json({ message: "toAuthId is required" });
        // Target user
        const user = yield user_model_1.User.findOne({ authId: toAuthId });
        if (!user)
            return res.status(404).json({ message: "User not found" });
        const userWallet = yield wallet_model_1.Wallet.findOne({ authId: toAuthId });
        if (!userWallet)
            return res.status(404).json({ message: "User wallet not found" });
        if (userWallet.isBlocked)
            return res.status(403).json({ message: "User wallet is blocked" });
        if (userWallet.balance < amount)
            return res.status(400).json({ message: "Insufficient balance" });
        // Agent wallet
        const agentWallet = yield wallet_model_1.Wallet.findOne({ authId: agentAuth._id });
        if (!agentWallet)
            return res.status(404).json({ message: "Agent wallet not found" });
        if (agentWallet.isBlocked)
            return res.status(403).json({ message: "Agent wallet is blocked" });
        const session = yield mongoose_1.default.startSession();
        session.startTransaction();
        try {
            userWallet.balance -= amount;
            agentWallet.balance += amount;
            yield userWallet.save({ session });
            yield agentWallet.save({ session });
            yield createTransactionRecord({
                from: userWallet._id,
                to: agentWallet._id,
                amount,
                type: "cash_out",
                initiatedBy: agentAuth._id,
                session,
            });
            yield session.commitTransaction();
            session.endSession();
            return res.json({
                message: "Cash-out successful",
                userBalance: userWallet.balance,
                agentBalance: agentWallet.balance,
            });
        }
        catch (txErr) {
            yield session.abortTransaction();
            session.endSession();
            throw txErr;
        }
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error(err);
        return res.status(500).json({ message: "Server error", error: message });
    }
});
exports.cashOut = cashOut;
/**
 * Admin: Block / Unblock
 */
const toggleWalletBlock = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== "admin")
            return res.status(403).json({ message: "Forbidden" });
        const { walletId } = req.params;
        const wallet = yield wallet_model_1.Wallet.findById(walletId);
        if (!wallet)
            return res.status(404).json({ message: "Wallet not found" });
        // 🔍 wallet owner
        const owner = yield auth_model_1.default.findById(wallet.authId);
        if (!owner)
            return res.status(404).json({ message: "Owner not found" });
        // ❌ Prevent blocking another admin's wallet
        if (owner.role === "admin") {
            return res.status(403).json({ message: "You cannot block/unblock another admin's wallet" });
        }
        wallet.isBlocked = !wallet.isBlocked;
        yield wallet.save();
        return res.json({
            message: `Wallet ${wallet.isBlocked ? "blocked" : "unblocked"}`,
            wallet
        });
    }
    catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.error("toggleWalletBlock error:", err);
        return res.status(500).json({ message: "Server error", error: message });
    }
});
exports.toggleWalletBlock = toggleWalletBlock;
