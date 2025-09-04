import { Request, Response } from "express";
import bcrypt from "bcrypt";
import AuthModel from "../auth/auth.model"; // Auth collection
import { User } from "./user.model"; // User collection
import { Wallet } from "../wallet/wallet.model"; // Wallet collection
import { userSchema } from "./user.interface";

/**
 * Create User + Wallet after Auth creation
 */
const createUserWithWallet = async (authId: string, initialBalance = 50) => {
  // Validate input for User collection
  const validatedData = userSchema.parse({ authId });

  // Create User
  const newUser = await User.create({
    authId: validatedData.authId,
    isBlocked: false,
  });

  // Create Wallet
  const wallet = await Wallet.create({
    authId: validatedData.authId,
    balance: initialBalance,
    isBlocked: false,
  });

  return { user: newUser, wallet };
};

/**
 * Admin endpoint to create a new auth + linked user & wallet
 */
export const createUserController = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role, initialBalance } = req.body;

    // Validate required fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Check if email already exists
    const existingAuth = await AuthModel.findOne({ email });
    if (existingAuth) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1️⃣ Create Auth document first
    const newAuth = await AuthModel.create({
      name,
      email,
      password: hashedPassword,
      role, // "user" or "agent"
      isBlocked: false,
    });

    // 2️⃣ Create User & Wallet using newAuth._id
    const { user, wallet } = await createUserWithWallet(newAuth._id.toString(), initialBalance);

    res.status(201).json({
      message: "Auth, User, and Wallet created successfully",
      auth: newAuth,
      user,
      wallet,
    });
  }catch (error: unknown) {
  console.error(error);

  const message = error instanceof Error ? error.message : String(error);

  res.status(500).json({ message: "Server error", error: message });
}

};
