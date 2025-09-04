"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionModel = void 0;
const mongoose_1 = require("mongoose");
const transactionSchema = new mongoose_1.Schema({
    from: { type: mongoose_1.Schema.Types.ObjectId, ref: "Wallet", default: null },
    to: { type: mongoose_1.Schema.Types.ObjectId, ref: "Wallet", default: null },
    amount: { type: Number, required: true, min: 0 },
    type: {
        type: String,
        enum: ["topup", "withdraw", "send", "cash_in", "cash_out"],
        required: true
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "completed"
    },
    initiatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: "Auth", required: true },
    fee: { type: Number, default: 0, min: 0 },
    commission: { type: Number, default: 0, min: 0 },
}, { timestamps: true });
exports.TransactionModel = (0, mongoose_1.model)("Transaction", transactionSchema);
