import { Types } from "mongoose";
import { z } from "zod";

/**
 * Populated auth information
 */
export interface PopulatedAuth {
  _id: string;
  name: string;
  email: string;
  role: string;
}

/**
 * Populated wallet owner
 */
export interface PopulatedUser {
  _id: string;
  authId: PopulatedAuth;
}

/**
 * Populated transaction (response)
 */
export interface PopulatedTransaction {
  _id: string;
  from?: PopulatedUser | null;
  to?: PopulatedUser | null;
  amount: number;
  type: "topup" | "withdraw" | "send" | "cash_in" | "cash_out";
  status: "pending" | "completed" | "failed";
  initiatedBy: string;
  fee?: number;
  commission?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Original Transaction interface
 */
export interface ITransaction {
  from?: Types.ObjectId | null; // Wallet reference
  to?: Types.ObjectId | null;   // Wallet reference
  amount: number;
  type: "topup" | "withdraw" | "send" | "cash_in" | "cash_out";
  status: "pending" | "completed" | "failed";
  initiatedBy: Types.ObjectId;
  fee?: number;
  commission?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Validation schema
 */


export const transactionSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  amount: z.number().positive(),
  type: z.enum(["topup", "withdraw", "send", "cash_in", "cash_out"]),
  fee: z.number().nonnegative().optional(),
  commission: z.number().nonnegative().optional(),
});
