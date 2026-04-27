import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";

dotenv.config();

const app = express();
app.use(express.json());

// 🌍 CORS (IMPORTANT: fără slash final în origin)
app.use(cors({
  origin: "https://chrisstina33.github.io",
  methods: ["POST"]
}));

// 🔑 ENV KEYS
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const JWT_SECRET = process.env.JWT_SECRET;

// 🧠 CHAT STORAGE PER USER
const chats = new Map();

function getHistory(userId) {
  if (!chats.has(userId)) chats.set(userId, []);
  return chats.get(userId);
}

// 🔐 AUTH MIDDLEWARE (JWT)
function auth(req, res, next) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ reply: "Unauthorized" });
  }

  try {
    const token = header.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch {
    return res.status(403).json({ reply: "Invalid token" });
  }
}

// 🧱 RATE LIMIT (per user dacă există, altfel IP)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: (req) => req.userId || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { reply: "Too many requests. Try again later." }
});

app.use("/api/therapy", limiter);

// 🎯 MAIN ENDPOINT
app.post("/api/therapy", auth, async (req, res) => {
  try {
    const userMessage = req.body.message?.trim();

    if (!userMessage) {
      return res.status(400).json({ reply: "Empty message." });
    }

    // 🧠 user-specific history
    const history = getHistory(req.userId);

    history.push({ role: "user", content: userMessage });

    const limitedHistory = history.slice(-8);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "openai/gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are a calm, empathetic mental health support assistant. " +
              "Be supportive, non-judgmental, and concise."
          },
          ...limitedHistory
        ],
        max_tokens: 200,
        temperature: 0.8,
        extra_body: {
          route: "primary",
          allow_fallbacks: false
        }
      })
    });

    const data = await response.json();

    const aiReply =
      data?.choices?.[0]?.message?.content || "Sorry, I couldn't respond.";

    history.push({ role: "assistant", content: aiReply });

    res.json({ reply: aiReply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Server error." });
  }
});

// 🟢 HEALTH CHECK
app.get("/", (req, res) => {
  res.send("Secure AI backend running 🔐");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running 🚀");
});