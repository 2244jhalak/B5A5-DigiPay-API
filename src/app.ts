import express, { Application, Request, Response } from "express";
import transactionRoutes from "./modules/transaction/transaction.route";
import walletRoutes from "./modules/wallet/wallet.route";
import authRoutes from "./modules/auth/auth.route";
import userRoutes from "./modules/user/user.route";
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
    origin: ["http://localhost:5173"], 
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/users", userRoutes);

// Test route
app.get("/", async (req: Request, res: Response) => {
  res.json({ message: "🚀 DigiPay API is running....." });
});

// Server + DB connection
const port = process.env.PORT || 5000;

async function main() {
  try {
    // Mongoose connection with proper options
    await mongoose.connect(process.env.MONGODB_URI as string, {
      
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
    });

    console.log("✅ MongoDB is connected");

    // Listen server
    app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("❌ Error starting server or connecting to DB:", error);
    process.exit(1); // Exit process if DB connection fails
  }
}

main();

export default app;

