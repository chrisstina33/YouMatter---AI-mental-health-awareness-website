import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
app.use(express.json());

// 🌍 CORS
app.use(cors({
  origin: "https://chrisstina33.github.io",
  methods: ["POST"]
}));

// 🔑 ENV
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// 🧠 USER STORAGE (simplu, în memorie)
const users = new Map(); 
const chats = new Map();

// helper
function getUser(userId) {
  if (!users.has(userId)) {
    users.set(userId, { created: Date.now() });
  }
  return users.get(userId);
}

function getChat(userId) {
  if (!chats.has(userId)) {
    chats.set(userId, []);
  }
  return chats.get(userId);
}

// 🧱 rate limit
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false
});

app.use("/api/therapy", limiter);

// 🎯 MAIN ENDPOINT
app.post("/api/therapy", async (req, res) => {
  try {
    const { message, userId } = req.body;

    // 🚨 CHECK USER LOGIN
    if (!userId) {
      return res.status(401).json({
        reply: "⚠️ You need an account to use this AI. Please sign up or log in."
      });
    }

    if (!message?.trim()) {
      return res.status(400).json({ reply: "Empty message." });
    }

    // 👤 ensure user exists
    getUser(userId);

    // 🧠 chat history per user
    const history = getChat(userId);

    history.push({ role: "user", content: message });

    const limited = history.slice(-8);

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
              "You are a supportive mental health assistant. Be empathetic, calm, and concise."
          },
          ...limited
        ],
        max_tokens: 200,
        temperature: 0.8
      })
    });

    const data = await response.json();

    const aiReply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't respond.";

    history.push({ role: "assistant", content: aiReply });

    res.json({ reply: aiReply });

  } catch (err) {
    console.error(err);
    res.status(500).json({ reply: "Server error." });
  }
});

// 🟢 health check
app.get("/", (req, res) => {
  res.send("AI backend running 👤");
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running 🚀");
});