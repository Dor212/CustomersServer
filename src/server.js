import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./db.js";
import { FormSubmission } from "./models/FormSubmission.js";
import { sendFormEmail } from "./email.js";

dotenv.config();
console.log("MONGODB_URI =", process.env.MONGODB_URI);

const app = express();
app.set("trust proxy", true);

const DEFAULT_ALLOWED = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5174",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://easytax-jy4y.onrender.com",
  "https://easytax-web.com",
  "https://www.easytax-web.com",
];

const ENV_ALLOWED = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const ALLOWED_ORIGINS = [...new Set([...DEFAULT_ALLOWED, ...ENV_ALLOWED])];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    console.log("❌ CORS blocked origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

app.use((req, res, next) => {
  res.header("Vvary", "Origin");
  next();
});

app.use(express.json());

app.get("/", (req, res) => {
  res.json({ ok: true, message: "CustomersServer is running 🚀" });
});

app.post("/api/forms", async (req, res) => {
  const { site, formType, data, notify = {} } = req.body;

  if (!site || !formType || !data) {
    return res.status(400).json({
      ok: false,
      message: "Missing required fields: site, formType, data",
    });
  }

  try {
    const submission = await FormSubmission.create({
      site,
      formType,
      data,
      meta: {
        ip: req.ip,
        userAgent: req.headers["user-agent"],
        origin: req.headers["origin"] || req.headers["referer"],
        notify,
      },
    });

    console.log("📩 New form submission saved:", {
      id: submission._id,
      site,
      formType,
    });

    const emailTo = notify.emailTo || "dorohana212@gmail.com";
    sendFormEmail(submission, { emailTo }).catch((err) => {
      console.error("❌ Error sending form email:", err.message);
    });

    return res.status(201).json({
      ok: true,
      message: `Form from ${site} (${formType}) saved successfully`,
      id: submission._id,
    });
  } catch (err) {
    console.error("❌ Error saving form submission:", err.message);
    return res.status(500).json({
      ok: false,
      message: "Failed to save form submission",
      error: err.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 CustomersServer running on http://localhost:${PORT}`);
    console.log("CORS allowed origins:", ALLOWED_ORIGINS);
  });
});
