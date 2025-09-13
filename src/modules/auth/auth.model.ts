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
    isBlocked: { type: Boolean, default: false },
    isApproved: { 
      type: String,
      enum: ["approve", "suspend"],
      default: undefined,  // user/admin হলে কিছু থাকবে না
      required: false
    },
    profileImage: { type: String, default: "" }
  },
  
  { timestamps: true }
);

// Pre-save hook: role agent হলে isApproved = suspend, না হলে undefined
AuthSchema.pre("save", function (next) {
  if (this.role === "agent" && !this.isApproved) {
    this.isApproved = "suspend";
  } else if (this.role !== "agent") {
    this.isApproved = undefined; 
  }
  next();
});

export default mongoose.model<IAuth>("Auth", AuthSchema);
