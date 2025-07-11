import express from "express";
import cors from "cors";
import "dotenv/config";
import { connectDB } from "./configs/dbConnection.js";
import { clerkWebhooks } from "./controllers/webhooks.js";

// application initialization
const app = express();

// Connect with Data Base
await connectDB();

// Middleware
app.use(cors());

// routes
app.get("/", (req, res) => res.send("API is Working"));
app.post("/clerk", express.json(), clerkWebhooks);

// PORT
const PORT = process.env.PORT || 8000;

app.listen(PORT, (req, res) => {
  console.log(`Server is Running on port ${PORT} ------>>> http://localhost:${PORT}`);
});
