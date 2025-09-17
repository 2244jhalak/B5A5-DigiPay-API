"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const transaction_route_1 = __importDefault(require("./modules/transaction/transaction.route"));
const wallet_route_1 = __importDefault(require("./modules/wallet/wallet.route"));
const auth_route_1 = __importDefault(require("./modules/auth/auth.route"));
const user_route_1 = __importDefault(require("./modules/user/user.route"));
const cors_1 = __importDefault(require("cors"));
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load environment variables
dotenv_1.default.config();
// Create express app
const app = (0, express_1.default)();
// Middleware
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: ["http://localhost:5173", "https://digipay-six.vercel.app"],
}));
// Routes
app.use("/api/auth", auth_route_1.default);
app.use("/api/transactions", transaction_route_1.default);
app.use("/api/wallet", wallet_route_1.default);
app.use("/api/users", user_route_1.default);
// Test route
app.get("/", (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.json({ message: "🚀 DigiPay API is running" });
}));
// ================= MongoDB Connection =================
const globalForMongoose = global;
const cached = globalForMongoose.mongoose || { conn: null, promise: null };
function connectDB() {
    return __awaiter(this, void 0, void 0, function* () {
        if (cached.conn)
            return cached.conn;
        if (!cached.promise) {
            cached.promise = mongoose_1.default
                .connect(process.env.MONGODB_URI, {
                serverSelectionTimeoutMS: 10000,
            })
                .then((mongooseInstance) => mongooseInstance.connection);
        }
        cached.conn = yield cached.promise;
        return cached.conn;
    });
}
// ================= Server Start =================
const port = process.env.PORT || 5000;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield connectDB();
            console.log("✅ MongoDB is connected");
            // Only listen if running locally
            if (process.env.NODE_ENV !== "production") {
                app.listen(port, () => {
                    console.log(`🚀 Server is running on port ${port}`);
                });
            }
        }
        catch (error) {
            if (error instanceof Error) {
                console.error("❌ Error starting server or connecting to DB:", error.message);
            }
            else {
                console.error("❌ Unknown error starting server or connecting to DB");
            }
            process.exit(1); // Exit process if DB connection fails
        }
    });
}
main();
exports.default = app;
