import mongoose, { Schema } from "mongoose";
import { IAuth } from "./auth.interface";

const AuthSchema: Schema<IAuth> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["user", "agent", "admin"],
      default: "user"
    },
    walletBalance: {
      type: Number,
      default: 50    
    },
    isBlocked: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true 
  }
);


AuthSchema.pre("save", function (next) {
  const now = new Date();
  if (!this.createdAt) this.createdAt = now;
  this.updatedAt = now;
  next();
});

export default mongoose.model<IAuth>("Auth", AuthSchema);
