import mongoose, { Schema, model } from "mongoose";
import { ITransaction } from "./transaction.interface";

const transactionSchema = new Schema<ITransaction>(
  {
    from: { type: Schema.Types.ObjectId, ref: "Wallet", default: null },
    to: { type: Schema.Types.ObjectId, ref: "Wallet", default: null },
    amount: { type: Number, required: true },
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
    initiatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    fee: { type: Number, default: 0 },
    commission: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const TransactionModel = model<ITransaction>("Transaction", transactionSchema);
export default TransactionModel;
