import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AuthModel from "./auth.model";
import { registerSchema, loginSchema } from "./auth.interface";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

/**
 * Register Controller
 */
export const register = async (req: Request, res: Response) => {
  try {
    // 1️⃣ Validate input with Zod
    const validatedData = registerSchema.parse(req.body);

    const { name, email, password, role } = validatedData;

    // 2️⃣ Check if user already exists
    const existingUser = await AuthModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Create new user/agent with initial walletBalance 50
    const newUser = await AuthModel.create({
      name,
      email,
      password: hashedPassword,
      role,
      walletBalance: 50
    });

    // 5️⃣ Respond
    res.status(201).json({
      message: `${role} registered successfully`,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        walletBalance: newUser.walletBalance
      }
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/**
 * Login Controller
 */
export const login = async (req: Request, res: Response) => {
  try {
    // 1️⃣ Validate input
    const { email, password } = loginSchema.parse(req.body);

    // 2️⃣ Find user
    const user = await AuthModel.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 3️⃣ Check if wallet blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: "Wallet is blocked" });
    }

    // 4️⃣ Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // 5️⃣ Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // 6️⃣ Respond
    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: user.walletBalance
      }
    });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return res.status(400).json({ errors: error.errors });
    }
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
