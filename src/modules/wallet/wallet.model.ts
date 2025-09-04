import { Schema, model } from "mongoose";
import { IWallet } from "./wallet.interface";

const walletSchema = new Schema<IWallet>(
  {
    authId: { type: Schema.Types.ObjectId, ref: "Auth", required: true, unique: true }, // Auth reference
    balance: { type: Number, required: true, default: 0, min: 0 },
    isBlocked: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Wallet = model<IWallet>("Wallet", walletSchema);
