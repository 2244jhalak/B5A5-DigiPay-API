import express, { Application, Request, Response } from "express";
import transactionRoutes from "./modules/transaction/transaction.route";
import walletRoutes from "./modules/wallet/wallet.route";
import authRoutes from "./modules/auth/auth.route";
import cors from "cors";
import { Server } from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Create express app
const app: Application = express();
let server: Server;

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"]
  })
);
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/wallet", walletRoutes);


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

    server = app.listen(port, () => {
      console.log(`🚀 Server is running on port ${port}`);
    });
  } catch (error) {
    console.error("❌ Error starting server or connecting to DB:", error);
  }
}

main();

export default app;
