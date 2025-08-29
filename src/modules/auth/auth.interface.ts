import { z } from "zod";

export interface IAuth {
  name: string;                     
  email: string;                    
  password: string;                 
  role: "user" | "agent" | "admin"; 
  walletBalance?: number;           
  isBlocked?: boolean;             
  createdAt?: Date;                
  updatedAt?: Date;                
}

export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "agent"], "Role must be 'user' or 'agent'")
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
      