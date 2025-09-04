"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod validation schema for creating/updating User
 */
exports.userSchema = zod_1.z.object({
    authId: zod_1.z.string().min(1, "Auth ID is required"), // ObjectId as string
    isBlocked: zod_1.z.boolean().optional().default(false),
});
