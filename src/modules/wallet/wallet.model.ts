import { Schema, model, Types } from "mongoose";
import { IWallet } from "./wallet.interface";


const walletSchema = new Schema<IWallet>(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, 
    },
    balance: {
      type: Number,
      required: true,
      default: 0,
      min: 0, 
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, 
  }
);

export const Wallet = model<IWallet>("Wallet", walletSchema);
