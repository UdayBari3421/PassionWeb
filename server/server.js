import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./configs/dbConnection.js";
import { clerkWebhooks, stripeWebHooks } from "./controllers/webhooks.js";
import educatorRouter from "./routes/educatorRoutes.js";
import { clerkMiddleware } from "@clerk/express";
import { connectCloudinary } from "./configs/cloudinary.js";
import courseRouter from "./routes/courseRoute.js";
import userRouter from "./routes/userRoutes.js";
import User from "./models/User.model.js";

// application initialization
const app = express();

// Connect with Data Base
await connectDB();
await connectCloudinary();

// Middleware
app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());

// routes
app.get("/", (req, res) => res.send("API is Working"));
app.get("/test-db", async (req, res) => {
  try {
    const userCount = await User.count();
    res.json({ 
      success: true, 
      message: "DB connection working",
      userCount,
      hasWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET 
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});
app.post("/clerk", express.raw({ type: "application/json" }), clerkWebhooks);
app.use("/api/educator", educatorRouter);
app.use("/api/course", courseRouter);
app.use("/api/user", userRouter);
app.post("/stripe", express.raw({ type: "application/json" }), stripeWebHooks);

// PORT
const PORT = process.env.PORT || 8000;

app.listen(PORT, (req, res) => {
  console.log(`Server is Running on port ${PORT} ------>>> http://localhost:${PORT}`);
});
