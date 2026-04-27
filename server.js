import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();

// 🔒 CORS – pune domeniul tău real
app.use(cors({
  origin: "https://chrisstina33.github.io/YouMatter---AI-mental-health-awareness-website/", // ⚠️ schimbă
  methods: ["POST"],
}));

app.use(express.json());

// 🧱 Rate limit – anti-spam
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minut
  max: 5, // max 5 request-uri/IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { reply: "Too many requests. Try again in a minute." }
});

app.use("/api/therapy", limiter);

// 🔑 Chei din .env
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SECRET_KEY = process.env.SECRET_KEY;

// 🔐 Middleware simplu de protecție
function checkAuth(req, res, next) {
  if (req.headers["x-secret"] !== SECRET_KEY) {
    return res.status(403).json({ reply: "Forbidden" });
  }
  next();
}

let chatHistory = [];
let memory = "";

// 🎯 Endpoint principal
app.post("/api/therapy", checkAuth, async (req, res) => {
  try {
    const userMessage = req.body.message?.trim();
    if (!userMessage) {
      return res.status(400).json({ reply: "Please provide a message." });
    }

    // 🧠 Istoric limitat (cost control)
    chatHistory.push({ role: "user", content: userMessage });
    const limitedHistory = chatHistory.slice(-6);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o", // 🔒 FORȚAT
        messages: [
          {
            role: "system",
            content:
              "You are an empathetic listener and supportive mental health companion. " +
              "Respond with care, understanding, and attention to the user's feelings. " +
              "Do not judge. Offer gentle support, clarifying questions, and comforting advice. " +
              "Be concise and helpful."
          },
          ...limitedHistory
        ],
        max_tokens: 200,
        temperature: 0.8,
        extra_body: {
          route: "primary",
          allow_fallbacks: false // 🔒 fără Claude fallback
        }
      })
    });

    const data = await response.json();

    let aiReply = "Sorry, I couldn't respond. 😔";
    if (data.choices && data.choices.length > 0) {
      aiReply = data.choices[0].message?.content || aiReply;
    }

    // 🧠 Salvare istoric
    chatHistory.push({ role: "assistant", content: aiReply });

    memory += `User: ${userMessage}\nAI: ${aiReply}\n`;
    if (memory.length > 2000) {
      memory = memory.slice(-1500);
    }

    res.json({ reply: aiReply });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ reply: "Server error occurred. 😔" });
  }
});

// 🧹 Curățare istoric
setInterval(() => {
  if (chatHistory.length > 20) {
    chatHistory.splice(0, chatHistory.length - 20);
  }
}, 60000);

// 🟢 Health check
app.get("/", (req, res) => {
  res.send("AI backend running");
});

app.listen(3000, () => {
  console.log("Server running on port 3000 🚀");
});