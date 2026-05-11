import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { ChatResponse } from "../routes/chat.routes.js";

dotenv.config();

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api", ChatResponse);

// Health Route
app.get("/health", (req, res) => {
  res.json({
    success: true,
  });
});

// ---------- Frontend Serving ----------

// Serve static files
app.use(express.static(path.join(__dirname, "../public")));

// Serve React App
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});

export default app;
