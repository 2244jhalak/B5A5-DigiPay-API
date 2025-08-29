import { Response } from "express";
import mongoose, { Types } from "mongoose";
import { Wallet as WalletModel } from "./wallet.model";
import TransactionModel from "../transaction/transaction.model";
import { walletSchema } from "./wallet.interface";
import { AuthRequest } from "../../types/express";

/**
 * Helper: create transaction record
 */
const createTransactionRecord = async (data: {
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
 * Get wallet (user, agent, or admin)
 */
export const getWallet = async (req: AuthRequest, res: Response) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });

    const userId = req.params.userId ?? requester.id;

    // Admin can view any wallet
    if (requester.role !== "admin" && requester.id !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const wallet = await WalletModel.findOne({ userId: new Types.ObjectId(userId) }).populate(
      "owner",
      "name email role"
    );
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    return res.json({ wallet });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * User: Top-up
 */
export const topUp = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = walletSchema.parse(req.body);
    const amount = parsed.amount;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const wallet = await WalletModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    if (wallet.isBlocked) return res.status(403).json({ message: "Wallet is blocked" });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      wallet.balance += amount;
      await wallet.save({ session });

      await createTransactionRecord({
        from: null,
        to: new Types.ObjectId(wallet.userId.toString()),

        amount,
        type: "topup",
        initiatedBy: new Types.ObjectId(userId),
        session,
      });

      await session.commitTransaction();
      session.endSession();

      return res.json({ message: "Top-up successful", balance: wallet.balance });
    } catch (txErr) {
      await session.abortTransaction();
      session.endSession();
      throw txErr;
    }
  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ errors: err.errors });
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * User: Withdraw
 */
export const withdraw = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = walletSchema.parse(req.body);
    const amount = parsed.amount;
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const wallet = await WalletModel.findOne({ userId: new Types.ObjectId(userId) });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    if (wallet.isBlocked) return res.status(403).json({ message: "Wallet is blocked" });
    if (wallet.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      wallet.balance -= amount;
      await wallet.save({ session });

      await createTransactionRecord({
        from: new Types.ObjectId(wallet.userId.toString()),

        to: null,
        amount,
        type: "withdraw",
        initiatedBy: new Types.ObjectId(userId),
        session,
      });

      await session.commitTransaction();
      session.endSession();

      return res.json({ message: "Withdraw successful", balance: wallet.balance });
    } catch (txErr) {
      await session.abortTransaction();
      session.endSession();
      throw txErr;
    }
  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ errors: err.errors });
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * User: Send money to another user
 */
export const sendMoney = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = walletSchema.parse(req.body);
    const { amount, toUserId } = parsed;
    const fromUserId = req.user?.id;
    if (!fromUserId) return res.status(401).json({ message: "Unauthorized" });
    if (!toUserId) return res.status(400).json({ message: "toUserId is required" });

    const senderWallet = await WalletModel.findOne({ userId: new Types.ObjectId(fromUserId) });
    const receiverWallet = await WalletModel.findOne({ userId: new Types.ObjectId(toUserId) });

    if (!senderWallet || !receiverWallet)
      return res.status(404).json({ message: "Sender or receiver wallet not found" });
    if (senderWallet.isBlocked) return res.status(403).json({ message: "Sender wallet is blocked" });
    if (receiverWallet.isBlocked) return res.status(403).json({ message: "Receiver wallet is blocked" });
    if (senderWallet.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      senderWallet.balance -= amount;
      receiverWallet.balance += amount;

      await senderWallet.save({ session });
      await receiverWallet.save({ session });

      await createTransactionRecord({
        from: new Types.ObjectId(senderWallet.userId.toString()),
        to: new Types.ObjectId(receiverWallet.userId.toString()),

        amount,
        type: "send",
        initiatedBy: new Types.ObjectId(fromUserId),
        session,
      });

      await session.commitTransaction();
      session.endSession();

      return res.json({
        message: "Send successful",
        senderBalance: senderWallet.balance,
        receiverBalance: receiverWallet.balance,
      });
    } catch (txErr) {
      await session.abortTransaction();
      session.endSession();
      throw txErr;
    }
  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ errors: err.errors });
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Agent: Cash-in (add money to user wallet)
 */
export const cashIn = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "agent") return res.status(403).json({ message: "Forbidden" });

    const parsed = walletSchema.parse(req.body);
    const { amount, toUserId } = parsed;
    if (!toUserId) return res.status(400).json({ message: "toUserId is required" });

    const receiverWallet = await WalletModel.findOne({ userId: new Types.ObjectId(toUserId) });
    if (!receiverWallet) return res.status(404).json({ message: "Receiver wallet not found" });
    if (receiverWallet.isBlocked) return res.status(403).json({ message: "Receiver wallet is blocked" });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      receiverWallet.balance += amount;
      await receiverWallet.save({ session });

      await createTransactionRecord({
        from: req.user.id ? new Types.ObjectId(req.user.id) : null,
        to: new Types.ObjectId(receiverWallet.userId.toString()),

        amount,
        type: "cash_in",
        initiatedBy: new Types.ObjectId(req.user.id!),
        session,
      });

      await session.commitTransaction();
      session.endSession();

      return res.json({ message: "Cash-in successful", receiverBalance: receiverWallet.balance });
    } catch (txErr) {
      await session.abortTransaction();
      session.endSession();
      throw txErr;
    }
  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ errors: err.errors });
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Agent: Cash-out (withdraw money from user wallet)
 */
export const cashOut = async (req: AuthRequest, res: Response) => {
  try {
    // Role validation: only agent can cash-out
    if (req.user?.role !== "agent")
      return res.status(403).json({ message: "Forbidden" });

    // Parse request body
    const parsed = walletSchema.parse(req.body);
    const { amount, toUserId } = parsed; // agent cashes out from a user wallet
    if (!toUserId) return res.status(400).json({ message: "toUserId is required" });

    // Find user's wallet
    const userWallet = await WalletModel.findOne({
      userId: new Types.ObjectId(toUserId),
    });
    if (!userWallet) return res.status(404).json({ message: "User wallet not found" });
    if (userWallet.isBlocked)
      return res.status(403).json({ message: "User wallet is blocked" });
    if (userWallet.balance < amount)
      return res.status(400).json({ message: "Insufficient balance" });

    // Start transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Deduct amount from user wallet
      userWallet.balance -= amount;
      await userWallet.save({ session });

      // Create transaction record
      await createTransactionRecord({
        from: new Types.ObjectId(userWallet.userId.toString()),
        to: req.user.id ? new Types.ObjectId(req.user.id) : null,
        amount,
        type: "cash_out",
        initiatedBy: new Types.ObjectId(req.user.id!),
        session,
      });

      // Commit transaction
      await session.commitTransaction();
      session.endSession();

      return res.json({
        message: "Cash-out successful",
        userBalance: userWallet.balance,
      });
    } catch (txErr) {
      await session.abortTransaction();
      session.endSession();
      throw txErr;
    }
  } catch (err: any) {
    if (err.name === "ZodError") return res.status(400).json({ errors: err.errors });
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};


/**
 * Admin: Block/Unblock wallet
 */
export const toggleWalletBlock = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") return res.status(403).json({ message: "Forbidden" });

    const { walletId } = req.params;
    const wallet = await WalletModel.findById(walletId);
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    wallet.isBlocked = !wallet.isBlocked;
    await wallet.save();

    return res.json({ message: `Wallet ${wallet.isBlocked ? "blocked" : "unblocked"}` });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Transaction history
 */
export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });

    const queryUserId = (req.query.userId as string) ?? requester.id;

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
