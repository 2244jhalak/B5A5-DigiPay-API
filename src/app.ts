import express, { Application, Request, Response } from "express";
import transactionRoutes from "./modules/transaction/transaction.route";
import walletRoutes from "./modules/wallet/wallet.route";
import authRoutes from "./modules/auth/auth.route";
import userRoutes from "./modules/user/user.route";


// ✅ user route import
import cors from "cors";

import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create express app
const app: Application = express();


// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"]
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/users", userRoutes);

// Test route
app.get("/", async (req: Request, res: Response) => {
  res.json({ message: "🚀 DigiPay API is running..." });
});

// Server + DB connection
const port = process.env.PORT || 5000;

async function main() {
  try {
    await mongoose.connect(process.env.MONGODB_URI as string);
    console.log("✅ MongoDB is connected");

    app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("❌ Error starting server or connecting to DB:", error);
  }
}

main();

export default app;
