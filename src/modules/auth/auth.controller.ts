import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import AuthModel from "./auth.model";
import { registerSchema, loginSchema } from "./auth.interface";
import { Wallet } from "../wallet/wallet.model";
import { User } from "../user/user.model";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

// ================= Register =================
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = registerSchema.parse(req.body);

    // check existing email
    const existingUser = await AuthModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create new user in Auth collection
    const newUser = await AuthModel.create({
      name,
      email,
      password: hashedPassword,
      role,
    });

    // create wallet for this user
    const wallet = await Wallet.create({
      authId: newUser._id,
      balance: 50, // initial balance
      isBlocked: false,
    });

    // create user in User collection
    const newUserRecord = await User.create({
      authId: newUser._id,
      walletBalance: wallet.balance,
      isBlocked: wallet.isBlocked,
    });

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        walletBalance: wallet.balance,
        isBlocked: wallet.isBlocked,
      },
    });
  } catch (error: any) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// ================= Login =================
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // must select password explicitly
    const user = await AuthModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // check account-level block
    if (user.isBlocked) {
      return res.status(403).json({
        message: "Your account has been blocked. Please contact support.",
      });
    }

    // check password match
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // find wallet (optional, since admin might block wallet separately)
    const wallet = await Wallet.findOne({ authId: user._id });

    // generate JWT
    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      message: wallet?.isBlocked
        ? "Login successful, but wallet is blocked"
        : "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: wallet?.balance || 0,
        walletBlocked: wallet?.isBlocked || false, // 🚀 wallet block info
        accountBlocked: user.isBlocked || false,   // 🚀 account block info
      },
    });
  } catch (error: any) {
    console.error("Login error:", error);
    res.status(500).json({
      message: "Internal server error",
      error: error.message,
    });
  }
};

/**
 * Admin: Block / Unblock
 */
export const toggleUserBlock = async (req: Request, res: Response) => {
  try {
    const authUser = await AuthModel.findById(req.params.id); 
    console.log("authUser:", authUser);

    if (!authUser) return res.status(404).json({ message: "Auth user not found" });

    if (authUser.role === "admin") {
      return res.status(403).json({ message: "You cannot block another admin" });
    }

    authUser.isBlocked = !authUser.isBlocked;
    await authUser.save();

    await User.updateOne(
      { authId: authUser._id },
      { $set: { isBlocked: authUser.isBlocked } }
    );

    res.json({
      message: `${authUser.name} ${authUser.isBlocked ? "blocked" : "unblocked"}`,
      authUser,
    });
  } catch (err: any) {
    console.error("toggleUserBlock error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};
