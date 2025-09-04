import { Response } from "express";
import mongoose, { Types } from "mongoose";
import AuthModel from "../auth/auth.model";
import { Wallet as WalletModel } from "./wallet.model";
import {TransactionModel} from "../transaction/transaction.model";
import { walletSchema } from "./wallet.interface";
import { User as UserModel } from "../user/user.model";
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
 * Get wallet
 */
export const getWallet = async (req: AuthRequest, res: Response) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });

    const param = req.params.authId ?? req.query.userId ?? requester.id;
    if (!param) return res.status(400).json({ message: "userId is required" });

    let wallet = null;

    if (mongoose.Types.ObjectId.isValid(param)) {
      // find wallet authId (not _id/userId)
      wallet = await WalletModel.findOne({ authId: param })
        .populate("authId", "name email role")
        .lean();
    }

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    return res.json({
      wallet: {
        id: wallet._id,
        user: wallet.authId,
        balance: wallet.balance,
        isBlocked: wallet.isBlocked,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
      },
    });
  } catch (err: unknown) {
  console.error(err);
  const message = err instanceof Error ? err.message : String(err);

  return res.status(500).json({ message: "Server error", error: message });
}

};

/**
 * Top-up
 */
export const topUp = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = walletSchema.parse(req.body);
    const amount = parsed.amount;
    const authId = req.user?.id;
    if (!authId) return res.status(401).json({ message: "Unauthorized" });

    const wallet = await WalletModel.findOne({ authId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    if (wallet.isBlocked) return res.status(403).json({ message: "Wallet is blocked" });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      wallet.balance += amount;
      await wallet.save({ session });

      await createTransactionRecord({
        from: null,
        to: wallet._id,
        amount,
        type: "topup",
        initiatedBy: new mongoose.Types.ObjectId(authId), // authId
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
  } catch (err: unknown) {
  if (err instanceof Error && err.name === "ZodError") {
    // Zod validation error
    // @ts-expect-error: ZodError has 'errors' property
    return res.status(400).json({ errors: err.errors });
  }

  const message = err instanceof Error ? err.message : String(err);
  console.error(err);
  return res.status(500).json({ message: "Server error", error: message });
}

};



/**
 * Withdraw
 */
export const withdraw = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = walletSchema.parse(req.body);
    const amount = parsed.amount;
    const authId = req.user?.id;
    if (!authId) return res.status(401).json({ message: "Unauthorized" });

    // Wallet authId
    const wallet = await WalletModel.findOne({ authId });
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });
    if (wallet.isBlocked) return res.status(403).json({ message: "Wallet is blocked" });
    if (wallet.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      wallet.balance -= amount;
      await wallet.save({ session });

      await createTransactionRecord({
        from: wallet._id,
        to: null,
        amount,
        type: "withdraw",
        initiatedBy: new mongoose.Types.ObjectId(authId), // authId
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
  } catch (err: unknown) {
     // Zod validation error
    
  
  if (err instanceof Error && err.name === "ZodError") {
    // @ts-expect-error: ZodError has 'errors' property
    return res.status(400).json({ errors: err.errors });
  }

  const message = err instanceof Error ? err.message : String(err);
  console.error(err);
  return res.status(500).json({ message: "Server error", error: message });
}

};


/**
 * Send money
 */
export const sendMoney = async (req: AuthRequest, res: Response) => {
  try {
    const parsed = walletSchema.parse(req.body);
    const { amount, toAuthId } = parsed;
    const fromAuthId = req.user?.id;
    if (!fromAuthId) return res.status(401).json({ message: "Unauthorized" });
    if (!toAuthId) return res.status(400).json({ message: "toAuthId is required" });

    // Wallet authId
    const senderWallet = await WalletModel.findOne({ authId: fromAuthId });
    const receiverWallet = await WalletModel.findOne({ authId: toAuthId });
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
        from: senderWallet._id,
        to: receiverWallet._id,
        amount,
        type: "send",
        initiatedBy: new mongoose.Types.ObjectId(fromAuthId), // sender authId
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
  } catch (err: unknown) {
  if (err instanceof Error && err.name === "ZodError") {
    // @ts-expect-error: ZodError has 'errors' property
    return res.status(400).json({ errors: err.errors });
  }

  const message = err instanceof Error ? err.message : String(err);
  console.error(err);
  return res.status(500).json({ message: "Server error", error: message });
}


};


/**
 * Cash-in
 */
export const cashIn = async (req: AuthRequest, res: Response) => {
  try {
    // ✅ Fetch full agent info from DB
    const agentAuth = await AuthModel.findById(req.user?.id);
    console.log(agentAuth)
    if (!agentAuth) return res.status(404).json({ message: "Agent not found" });

    // Agent role check
    if (agentAuth.role !== "agent")
      return res.status(403).json({ message: "Forbidden: Only agents can perform cash-in" });

    // Agent approval check
    if (agentAuth.isApproved !== "approve")
      return res.status(403).json({ message: "Forbidden: Agent is not approved" });

    // Parse request body
    const parsed = walletSchema.parse(req.body);
    const { amount, toAuthId } = parsed;
    if (!toAuthId) return res.status(400).json({ message: "toAuthId is required" });

    // Receiver wallet
    const receiverWallet = await WalletModel.findOne({ authId: toAuthId });
    if (!receiverWallet) return res.status(404).json({ message: "Receiver wallet not found" });
    if (receiverWallet.isBlocked) return res.status(403).json({ message: "Receiver wallet is blocked" });

    // Agent wallet
    const agentWallet = await WalletModel.findOne({ authId: agentAuth._id });
    if (!agentWallet) return res.status(404).json({ message: "Agent wallet not found" });
    if (agentWallet.isBlocked) return res.status(403).json({ message: "Agent wallet is blocked" });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const commission = amount * 0.02;

      receiverWallet.balance += amount - commission;
      agentWallet.balance += commission;

      await receiverWallet.save({ session });
      await agentWallet.save({ session });

      await createTransactionRecord({
        from: agentWallet._id,
        to: receiverWallet._id,
        amount,
        type: "cash_in",
        initiatedBy: agentAuth._id,
        commission,
        session,
      });

      await session.commitTransaction();
      session.endSession();

      return res.json({
        message: "Cash-in successful",
        receiverBalance: receiverWallet.balance,
        agentBalance: agentWallet.balance,
        commission,
      });
    } catch (txErr) {
      await session.abortTransaction();
      session.endSession();
      throw txErr;
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(err);
    return res.status(500).json({ message: "Server error", error: message });
  }
};



/**
 * Cash-out
 */
export const cashOut = async (req: AuthRequest, res: Response) => {
  try {
    // ✅ Fetch full agent info from DB
    const agentAuth = await AuthModel.findById(req.user?.id);
    if (!agentAuth) return res.status(404).json({ message: "Agent not found" });

    // Agent role check
    if (agentAuth.role !== "agent")
      return res.status(403).json({ message: "Forbidden: Only agents can perform cash-out" });

    // Agent approval check
    if (agentAuth.isApproved !== "approve")
      return res.status(403).json({ message: "Forbidden: Agent is not approved" });

    // Parse request body
    const parsed = walletSchema.parse(req.body);
    const { amount, toAuthId } = parsed;
    if (!toAuthId) return res.status(400).json({ message: "toAuthId is required" });

    // Target user
    const user = await UserModel.findOne({ authId: toAuthId });
    if (!user) return res.status(404).json({ message: "User not found" });

    const userWallet = await WalletModel.findOne({ authId: toAuthId });
    if (!userWallet) return res.status(404).json({ message: "User wallet not found" });
    if (userWallet.isBlocked) return res.status(403).json({ message: "User wallet is blocked" });
    if (userWallet.balance < amount) return res.status(400).json({ message: "Insufficient balance" });

    // Agent wallet
    const agentWallet = await WalletModel.findOne({ authId: agentAuth._id });
    if (!agentWallet) return res.status(404).json({ message: "Agent wallet not found" });
    if (agentWallet.isBlocked) return res.status(403).json({ message: "Agent wallet is blocked" });

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      userWallet.balance -= amount;
      agentWallet.balance += amount;

      await userWallet.save({ session });
      await agentWallet.save({ session });

      await createTransactionRecord({
        from: userWallet._id,
        to: agentWallet._id,
        amount,
        type: "cash_out",
        initiatedBy: agentAuth._id,
        session,
      });

      await session.commitTransaction();
      session.endSession();

      return res.json({
        message: "Cash-out successful",
        userBalance: userWallet.balance,
        agentBalance: agentWallet.balance,
      });
    } catch (txErr) {
      await session.abortTransaction();
      session.endSession();
      throw txErr;
    }

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(err);
    return res.status(500).json({ message: "Server error", error: message });
  }
};



/**
 * Admin: Block / Unblock
 */
export const toggleWalletBlock = async (req: AuthRequest, res: Response) => {
  try {
    if (req.user?.role !== "admin") 
      return res.status(403).json({ message: "Forbidden" });

    const { walletId } = req.params;
    const wallet = await WalletModel.findById(walletId);
    if (!wallet) return res.status(404).json({ message: "Wallet not found" });

    // 🔍 wallet owner
    const owner = await AuthModel.findById(wallet.authId);
    if (!owner) return res.status(404).json({ message: "Owner not found" });

    // ❌ Prevent blocking another admin's wallet
    if (owner.role === "admin") {
      return res.status(403).json({ message: "You cannot block/unblock another admin's wallet" });
    }

    wallet.isBlocked = !wallet.isBlocked;
    await wallet.save();

    return res.json({ 
      message: `Wallet ${wallet.isBlocked ? "blocked" : "unblocked"}`,
      wallet 
    });
  } catch (err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  console.error("toggleWalletBlock error:", err);
  return res.status(500).json({ message: "Server error", error: message });
}

};

