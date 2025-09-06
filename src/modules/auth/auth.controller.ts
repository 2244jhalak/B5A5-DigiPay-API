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
    const { name, email, password } = registerSchema.parse(req.body);

    // check existing email
    const existingUser = await AuthModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create new user in Auth collection (role always user)
    const newUser = await AuthModel.create({
      name,
      email,
      password: hashedPassword,
      role: "user", // ✅ force role = user
      isBlocked: false,
    });

    // create wallet for this user
    const wallet = await Wallet.create({
      authId: newUser._id,
      balance: 50, // initial balance
      isBlocked: false,
    });

    // create user in User collection
    await User.create({
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Register error:", errorMessage);
    res.status(500).json({
      message: "Internal server error",
      error: errorMessage,
    });
  }
};

// ================= Login =================
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await AuthModel.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    if (user.isBlocked) {
      return res.status(403).json({ message: "Your account has been blocked. Please contact support." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid email or password" });

    const wallet = await Wallet.findOne({ authId: user._id });

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

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
        isApproved: user.role === "agent" ? user.isApproved : undefined, 
        walletBalance: wallet?.balance || 0,
        walletBlocked: wallet?.isBlocked || false,
        accountBlocked: user.isBlocked || false,
      },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Login error:", errorMessage);
    res.status(500).json({ message: "Internal server error", error: errorMessage });
  }
};

// ================= Admin: Block / Unblock =================
export const toggleUserBlock = async (req: Request, res: Response) => {
  try {
    const authUser = await AuthModel.findById(req.params.authId); 

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
  } catch (err: unknown) {
    let errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("toggleUserBlock error:", errorMessage);
    res.status(500).json({ message: "Server error", error: errorMessage });
  }
};

// ================= Admin: Approve / Suspend Agent =================
export const toggleAgent = async (req: Request, res: Response) => {
  try {
    const agent = await AuthModel.findById(req.params.authId);

    if (!agent || agent.role !== "agent")
      return res.status(404).json({ message: "Agent not found" });

    // toggle approve/suspend
    agent.isApproved = agent.isApproved === "approve" ? "suspend" : "approve";
    await agent.save();

    res.json({ 
      message: `Agent ${agent.isApproved} successfully`, 
      agent 
    });
  } catch (err: unknown) {
    let errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("toggleAgent error:", errorMessage);
    res.status(500).json({ message: "Server error", error: errorMessage });
  }
};

// ================= Admin: Change Role =================
export const toggleUserRole = async (req: Request, res: Response) => {
  try {
    const authUser = await AuthModel.findById(req.params.authId);
    if (!authUser) return res.status(404).json({ message: "User not found" });

    if (authUser.role === "admin") {
      return res.status(403).json({ message: "You cannot change another admin's role" });
    }

    // Toggle logic
    if (authUser.role === "user") {
      authUser.role = "agent";
      authUser.isApproved = "suspend"; // new agent must be approved later
    } else if (authUser.role === "agent") {
      authUser.role = "user";
      authUser.isApproved = undefined;
    }

    await authUser.save();

    res.json({
      message: `Role toggled successfully to ${authUser.role}`,
      authUser,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("toggleUserRole error:", errorMessage);
    res.status(500).json({ message: "Server error", error: errorMessage });
  }
};


// ================= Admin: Get all users =================
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    // Admin এর জন্য সব auth data fetch
    const users = await AuthModel.find().select("-password"); // password hide করা

    res.status(200).json({
      message: "All users fetched successfully",
      users,
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("getAllUsers error:", errorMessage);
    res.status(500).json({ message: "Server error", error: errorMessage });
  }
};

