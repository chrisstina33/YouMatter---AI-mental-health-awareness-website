import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

dotenv.config();

const app = express();

// 🔒 CORS RESTRICȚIONAT (schimbă cu domeniul tău real)
app.use(cors({
  origin: "https://chrisstina33.github.io/YouMatter---AI-mental-health-awareness-website/",
  methods: ["POST"],
}));

app.use(express.json());

// 🧱 RATE LIMIT (anti-spam / anti-bot)
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minut
  max: 5, // max 5 request-uri / IP / minut
  message: { reply: "Too many requests. Calm down a bit 😄" }
});

app.use("/api/therapy", limiter);

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const SECRET_KEY = process.env.SECRET_KEY;

// 🔐 Funcție simplă de protecție
function checkAuth(req, res) {
  if (req.headers["x-secret"] !== SECRET_KEY) {
    res.status(403).json({ reply: "Forbidden" });
    return false;
  }
  return true;
}

let chatHistory = [];
let memory = "";

app.post("/api/therapy", async (req, res) => {
  try {
    // 🔐 verificare acces
    if (!checkAuth(req, res)) return;

    const userMessage = req.body.message?.trim();
    if (!userMessage) {
      return res.status(400).json({ reply: "Please provide a message." });
    }

    // 🧠 Istoric
    chatHistory.push({ role: "user", content: userMessage });
    const limitedHistory = chatHistory.slice(-6);

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-4o", // 🎯 FORȚAT
        messages: [
          {
            role: "system",
            content:
              "You are an empathetic listener and supportive mental health companion. " +
              "Respond with care, understanding, and attention to the user's feelings. " +
              "Do not judge. Offer gentle support, clarifying questions, and comforting advice. " +
              "Be swift and precise. Take all facts into consideration. " +
              "Engage the user emotionally and thoughtfully. " +
              "If serious issues arise (abuse, drugs, etc.), guide them safely and responsibly."
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
    console.log("OpenRouter response:", data);

    let aiReply = "Sorry, I couldn't respond. 😔";

    if (data.choices && data.choices.length > 0) {
      aiReply = data.choices[0].message?.content || aiReply;
    }

    // 🧠 salvare istoric
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

// 🧹 curățare istoric
setInterval(() => {
  if (chatHistory.length > 20) {
    chatHistory.splice(0, chatHistory.length - 20);
  }
}, 60000);

app.get("/", (req, res) => {
  res.send("AI Therapy Backend is running.");
});

app.listen(3000, () => {
  console.log("Backend running on port 3000 🚀");
});