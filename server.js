import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();
app.use(express.json());

// 🌍 CORS (frontend GitHub Pages)
app.use(cors({
  origin: "https://chrisstina33.github.io",
  methods: ["POST"]
}));

// 🔑 ENV
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

// 🧱 RATE LIMIT (anti spam)
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10
});

app.use("/api/therapy", limiter);

// 🎯 MAIN ENDPOINT
app.post("/api/therapy", async (req, res) => {
  try {
    const { message, uid } = req.body;

    // 🔐 Firebase Auth check
    if (!uid) {
      return res.status(401).json({
        reply: "⚠️ You must be logged in to use this AI."
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        reply: "Please send a message."
      });
    }

    // 🤖 OPENROUTER REQUEST
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
      content: `
You are "YouMatter AI", a supportive emotional wellbeing companion.

RULES:
- Be calm, empathetic, and non-judgmental.
- Speak like a supportive friend, not a therapist giving diagnosis.
- Never claim to be a medical professional.
- If user expresses sadness/anxiety, respond with comfort + grounding advice.
- Keep responses short (max 6-10 sentences).
- Ask gentle follow-up questions when appropriate.
- Encourage healthy habits (sleep, hydration, talking to someone trusted).
- NEVER give harmful or dangerous advice.
- Avoid dramatic or overly emotional exaggeration.

STYLE:
- warm, human tone
- simple English
- slightly Gen-Z friendly but not cringe

GOAL:
Help the user feel heard, safe, and slightly more stable emotionally after each message.
`
    },
    {
      role: "user",
      content: message
    }
  ],
  max_tokens: 200,
  temperature: 0.8
})

    const data = await response.json();

    const aiReply =
      data?.choices?.[0]?.message?.content ||
      "Sorry, I couldn't respond right now.";

    res.json({ reply: aiReply });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      reply: "Server error occurred."
    });
  }
});

// 🟢 HEALTH CHECK
app.get("/", (req, res) => {
  res.send("AI backend running 🚀");
});

// 🚀 START SERVER
app.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port", process.env.PORT || 3000);
});