"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
    authId: { type: mongoose_1.Schema.Types.ObjectId, ref: "Auth", required: true, unique: true },
    isBlocked: { type: Boolean, default: false },
}, { timestamps: true });
exports.User = (0, mongoose_1.model)("User", userSchema);
