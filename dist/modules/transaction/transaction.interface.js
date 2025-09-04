"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transactionSchema = void 0;
const zod_1 = require("zod");
/**
 * Validation schema
 */
exports.transactionSchema = zod_1.z.object({
    from: zod_1.z.string().optional(),
    to: zod_1.z.string().optional(),
    amount: zod_1.z.number().positive(),
    type: zod_1.z.enum(["topup", "withdraw", "send", "cash_in", "cash_out"]),
    fee: zod_1.z.number().nonnegative().optional(),
    commission: zod_1.z.number().nonnegative().optional(),
});
