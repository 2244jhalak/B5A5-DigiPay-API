import mongoose, { Schema } from "mongoose";
import { IAuth } from "./auth.interface";

const AuthSchema: Schema<IAuth> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true, 
      trim: true 
    },
    password: { type: String, required: true, select: false },
    role: { 
      type: String, 
      enum: ["user", "agent", "admin"], 
      default: "user" 
    },
    isBlocked: { type: Boolean, default: false }
  },
  { timestamps: true }
);

export default mongoose.model<IAuth>("Auth", AuthSchema);
