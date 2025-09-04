import { Schema, model } from "mongoose";
import { ITransaction } from "./transaction.interface";

const transactionSchema = new Schema<ITransaction>(
  {
    from: { type: Schema.Types.ObjectId, ref: "Wallet", default: null },
    to: { type: Schema.Types.ObjectId, ref: "Wallet", default: null },
    amount: { type: Number, required: true, min: 0 },
    type: { 
      type: String, 
      enum: ["topup", "withdraw", "send", "cash_in", "cash_out"], 
      required: true 
    },
    status: { 
      type: String, 
      enum: ["pending", "completed", "failed"], 
      default: "completed" 
    },
    initiatedBy: { type: Schema.Types.ObjectId, ref: "Auth", required: true },
    fee: { type: Number, default: 0, min: 0 },
    commission: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const TransactionModel = model<ITransaction>("Transaction", transactionSchema);
