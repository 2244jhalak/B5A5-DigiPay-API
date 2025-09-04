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
    origin: ["http://localhost:5173"], // Add your Vercel frontend URL in production
  })
);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/users", userRoutes);

// Test route
app.get("/", async (_req: Request, res: Response) => {
  res.json({ message: "🚀 DigiPay API is running....." });
});

// ================= MongoDB Connection =================
let cached: { conn: mongoose.Connection | null; promise: Promise<mongoose.Connection> | null } = (global as any).mongoose || { conn: null, promise: null };

async function connectDB(): Promise<mongoose.Connection> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(process.env.MONGODB_URI as string, {
        serverSelectionTimeoutMS: 10000,
      })
      .then((mongooseInstance) => mongooseInstance.connection);
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

// ================= Server Start =================
const port = process.env.PORT || 5000;

async function main(): Promise<void> {
  try {
    await connectDB();
    console.log("✅ MongoDB is connected");

    // Only listen if running locally
    if (process.env.NODE_ENV !== "production") {
      app.listen(port, () => {
        console.log(`🚀 Server is running on port ${port}`);
      });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("❌ Error starting server or connecting to DB:", error.message);
    } else {
      console.error("❌ Unknown error starting server or connecting to DB");
    }
    process.exit(1); // Exit process if DB connection fails
  }
}

main();

export default app;
