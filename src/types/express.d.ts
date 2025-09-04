// types/express.d.ts
import { Request } from "express";

export interface AuthRequest extends Request {
  user?: {
    isApproved: string;
    id: string;
    role: "user" | "agent" | "admin";
  };
}
