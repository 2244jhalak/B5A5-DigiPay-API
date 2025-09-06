import { z } from "zod";

export interface IAuth {
  name: string;
  email: string;
  password: string;
  role: "user" | "agent" | "admin"; 
  isBlocked?: boolean;   
  isApproved?: "approve" | "suspend";  
  updatedAt?: Date;
}

// Registration Schema 
export const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

// Login Schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
