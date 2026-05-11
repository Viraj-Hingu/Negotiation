import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { ChatResponse } from "../routes/chat.routes.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security Headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "img-src": ["'self'", "data:", "https://images.unsplash.com"],
        "font-src": ["'self'", "https://fonts.gstatic.com"],
        "style-src": [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
        ],
      },
    },
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests from this IP, please try again later.",
});

app.use("/api", limiter);

// CORS Configuration
const allowedOrigins = new Set(
  ["http://localhost:5173", process.env.FRONTEND_URL].filter(Boolean)
);

app.use(
  cors((req, callback) => {
    const origin = req.header("Origin");
    const requestOrigin = `${req.protocol}://${req.get("host")}`;
    const isSameOrigin = origin === requestOrigin;

    if (!origin || isSameOrigin || allowedOrigins.has(origin)) {
      return callback(null, {
        origin: true,
        credentials: true,
      });
    }

    return callback(new Error("CORS policy violation"), {
      origin: false,
    });
  })
);

app.use(express.json());

// API Routes
app.use("/api", ChatResponse);

// Health Route
app.get("/health", (req, res) => {
  res.status(200).json({ ok: true });
});

// ---------- Frontend Serving ----------


// Serve static assets
app.use(express.static(path.join(__dirname, "../public")));

// Serve React app
app.get("/*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "/public/index.html"));
});

// ---------- Error Middleware ----------

app.use((err, req, res, next) => {
  console.error(err.stack);

  res.status(500).json({
    isAccepted: false,
    message: "Something went wrong on the server!",
  });
});

export default app;
