"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletSchema = void 0;
const zod_1 = require("zod");
exports.walletSchema = zod_1.z.object({
    amount: zod_1.z.number().refine(val => val > 0, { message: "Amount must be greater than 0" }),
    toAuthId: zod_1.z.string().optional(),
});
