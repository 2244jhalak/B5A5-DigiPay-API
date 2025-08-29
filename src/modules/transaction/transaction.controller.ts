import { Response } from "express";
import mongoose, { Types } from "mongoose";
import TransactionModel from "./transaction.model";
import { AuthRequest } from "../../types/express";
import { transactionSchema } from "./transaction.interface";

/**
 * Helper: create transaction record
 */
export const createTransactionRecord = async (data: {
  from?: Types.ObjectId | null;
  to?: Types.ObjectId | null;
  amount: number;
  type: "topup" | "withdraw" | "send" | "cash_in" | "cash_out";
  initiatedBy: Types.ObjectId;
  fee?: number;
  commission?: number;
  session?: mongoose.ClientSession | null;
}) => {
  const record = await TransactionModel.create(
    [
      {
        from: data.from ?? null,
        to: data.to ?? null,
        amount: data.amount,
        type: data.type,
        initiatedBy: data.initiatedBy,
        fee: data.fee ?? 0,
        commission: data.commission ?? 0,
        status: "completed",
      },
    ],
    { session: data.session ?? undefined }
  );
  return record[0];
};

/**
 * Get transactions for a user or admin
 */
export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });

    const queryUserId = (req.query.userId as string) ?? requester.id;

    // Only admin or self can see
    if (requester.role !== "admin" && requester.id !== queryUserId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const q = { $or: [{ from: new Types.ObjectId(queryUserId) }, { to: new Types.ObjectId(queryUserId) }] };
    const txs = await TransactionModel.find(q).sort({ createdAt: -1 }).limit(200);

    return res.json({ transactions: txs });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
