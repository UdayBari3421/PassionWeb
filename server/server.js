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
app.use(clerkMiddleware());

// Webhook routes (must be before express.json() middleware)
app.post("/clerk", express.raw({ type: "application/json" }), clerkWebhooks);
app.post("/clerk-no-verify", express.json(), async (req, res) => {
  try {
    console.log("=== CLERK WEBHOOK NO VERIFY ===");
    console.log("Body:", req.body);
    
    const { data, type } = req.body;
    console.log("Webhook type:", type);
    
    if (type === "user.created") {
      console.log("Creating user without verification:", data.id);
      const userData = {
        _id: data.id,
        email: data.email_addresses[0].email_address,
        name: data.first_name + " " + data.last_name,
        imageUrl: data.image_url,
      };
      const newUser = await User.create(userData);
      console.log("User created successfully:", newUser._id);
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error("Webhook no-verify error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});
app.post("/stripe", express.raw({ type: "application/json" }), stripeWebHooks);

// JSON parsing middleware (after webhook routes)
app.use(express.json());

// routes
app.get("/", (req, res) => res.send("API is Working"));
app.get("/test-db", async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    res.json({
      success: true,
      message: "DB connection working",
      userCount,
      hasWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET,
    });
  } catch (error) {
    res.json({ success: false, error: error.message });
  }
});
app.get("/webhook-test", (req, res) => {
  res.json({
    message: "Webhook endpoint is accessible",
    hasWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET,
    webhookSecretLength: process.env.CLERK_WEBHOOK_SECRET
      ? process.env.CLERK_WEBHOOK_SECRET.length
      : 0,
  });
});

// Debug endpoint for webhook
app.post("/clerk-debug", express.raw({ type: "application/json" }), (req, res) => {
  try {
    console.log("=== WEBHOOK DEBUG ===");
    console.log("Headers:", req.headers);
    console.log("Body type:", typeof req.body);
    console.log("Body length:", req.body ? req.body.length : 0);
    console.log("Has webhook secret:", !!process.env.CLERK_WEBHOOK_SECRET);
    console.log(
      "Webhook secret length:",
      process.env.CLERK_WEBHOOK_SECRET ? process.env.CLERK_WEBHOOK_SECRET.length : 0
    );

    res.json({
      success: true,
      message: "Debug info logged",
      headers: req.headers,
      bodyType: typeof req.body,
      bodyLength: req.body ? req.body.length : 0,
      hasWebhookSecret: !!process.env.CLERK_WEBHOOK_SECRET,
    });
  } catch (error) {
    console.error("Debug endpoint error:", error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint to create user without webhook signature verification
app.post("/test-user-creation", express.json(), async (req, res) => {
  try {
    const { id, email, firstName, lastName, imageUrl } = req.body;

    const userData = {
      _id: id || `test_${Date.now()}`,
      email: email || "test@example.com",
      name: `${firstName || "Test"} ${lastName || "User"}`,
      imageUrl: imageUrl || "https://example.com/default.jpg",
    };

    const newUser = await User.create(userData);
    console.log("Test user created:", newUser._id);

    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error("Test user creation error:", error);
    res.status(400).json({ success: false, error: error.message });
  }
});

app.use("/api/educator", educatorRouter);
app.use("/api/course", courseRouter);
app.use("/api/user", userRouter);

// PORT
const PORT = process.env.PORT || 8000;

app.listen(PORT, (req, res) => {
  console.log(`Server is Running on port ${PORT} ------>>> http://localhost:${PORT}`);
});
