import { Response } from "express";
import mongoose, { Types } from "mongoose";
import {TransactionModel} from "./transaction.model";
import { AuthRequest } from "../../types/express";
import { PopulatedTransaction } from "./transaction.interface";

/**
 * Create a transaction record (used by wallet operations)
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
 * Get transactions
 */
export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });

    const queryAuthId = (req.query.userId as string) ?? requester.id;

    const txs = await TransactionModel.find()
      .sort({ createdAt: -1 })
      .limit(200)
      .populate({
        path: "from",
        populate: { path: "authId", select: "name email role" },
      })
      .populate({
        path: "to",
        populate: { path: "authId", select: "name email role" },
      })
      .lean<PopulatedTransaction[]>();

    const filteredTxs = txs.filter(tx => {
      const fromId = tx.from?.authId?._id.toString();
      const toId = tx.to?.authId?._id.toString();
      return fromId === queryAuthId || toId === queryAuthId || requester.role === "admin";
    });

    return res.json({ transactions: filteredTxs });
  } catch (err: unknown) {
  console.error(err);

  
  const message = err instanceof Error ? err.message : String(err);

  return res.status(500).json({ message: "Server error", error: message });
}

};