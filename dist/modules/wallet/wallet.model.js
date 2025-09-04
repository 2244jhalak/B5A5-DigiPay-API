"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Wallet = void 0;
const mongoose_1 = require("mongoose");
const walletSchema = new mongoose_1.Schema({
    authId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Auth", required: true, unique: true }, // Auth reference
    balance: { type: Number, required: true, default: 0, min: 0 },
    isBlocked: { type: Boolean, default: false },
}, { timestamps: true });
exports.Wallet = (0, mongoose_1.model)("Wallet", walletSchema);
