import { z } from "zod";
import { Types } from "mongoose";

export interface ITransaction {
  from?: Types.ObjectId | null;
  to?: Types.ObjectId | null;
  amount: number;
  type: "topup" | "withdraw" | "send" | "cash_in" | "cash_out";
  status: "pending" | "completed" | "failed";
  initiatedBy: Types.ObjectId;
  fee?: number;
  commission?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

// Zod schema for validation (optional input validation)
export const transactionSchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  amount: z.number().positive(),
  type: z.enum(["topup", "withdraw", "send", "cash_in", "cash_out"]),
  fee: z.number().optional(),
  commission: z.number().optional(),
});
