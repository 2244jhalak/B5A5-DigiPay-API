import { Types } from "mongoose";
import { z } from "zod";

/**
 * User interface (points to Auth)
 */
export interface IUser {
  authId: Types.ObjectId;   // Auth reference
  isBlocked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Zod validation schema for creating/updating User
 */
export const userSchema = z.object({
  authId: z.string().min(1, "Auth ID is required"), // ObjectId as string
  isBlocked: z.boolean().optional().default(false),
});
