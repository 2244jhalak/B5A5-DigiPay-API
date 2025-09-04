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
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransactions = exports.createTransactionRecord = void 0;
const transaction_model_1 = require("./transaction.model");
/**
 * Create a transaction record (used by wallet operations)
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
exports.createTransactionRecord = createTransactionRecord;
/**
 * Get transactions
 */
const getTransactions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const requester = req.user;
        if (!requester)
            return res.status(401).json({ message: "Unauthorized" });
        const queryAuthId = (_a = req.query.userId) !== null && _a !== void 0 ? _a : requester.id;
        const txs = yield transaction_model_1.TransactionModel.find()
            .sort({ createdAt: -1 })
            .limit(200)
            .populate({
            path: "from",
            populate: { path: "authId", select: "name email role" },
        })
            .populate({
            path: "to",
            populate: { path: "authId", select: "name email role" },
        })
            .lean();
        const filteredTxs = txs.filter(tx => {
            var _a, _b, _c, _d;
            const fromId = (_b = (_a = tx.from) === null || _a === void 0 ? void 0 : _a.authId) === null || _b === void 0 ? void 0 : _b._id.toString();
            const toId = (_d = (_c = tx.to) === null || _c === void 0 ? void 0 : _c.authId) === null || _d === void 0 ? void 0 : _d._id.toString();
            return fromId === queryAuthId || toId === queryAuthId || requester.role === "admin";
        });
        return res.json({ transactions: filteredTxs });
    }
    catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : String(err);
        return res.status(500).json({ message: "Server error", error: message });
    }
});
exports.getTransactions = getTransactions;
