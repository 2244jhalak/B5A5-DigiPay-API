import { ObjectId } from "mongoose";
import { z } from "zod";

export interface IWallet {
  userId: ObjectId;
  balance: number;
  isBlocked: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const walletSchema = z.object({
  amount: z.number()
           .refine(val => val > 0, { message: "Amount must be greater than 0" }),
  toUserId: z.string().optional()
});
