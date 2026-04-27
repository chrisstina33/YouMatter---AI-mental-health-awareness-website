import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();



const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
let chatHistory = []; // păstrează context conversație
let memory="";

app.post("/api/therapy", async (req, res) => {
  try {
    const userMessage = req.body.message?.trim();
    if (!userMessage) return res.status(400).json({ reply: "Please provide a message." });

    // Adaugă mesajul utilizatorului în istoric
    chatHistory.push({ role: "user", content: userMessage });
    const limitedHistory=chatHistory.slice(-6); //we added this because we used a lot of tokens for this model (45K) and we had to pay $0.19$ credits on OpenRouter. We originally had a free plan, so in our account we had a -$0.19 balance after testing it for 112 times; We solved this problem by buying $5 credits. 

    // Apelează OpenRouter
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an empathetic listener and supportive mental health companion. " +
                     "Respond with care, understanding, and attention to the user's feelings. " +
                     "Do not judge. Offer gentle support, clarifying questions, and comforting advice." +
                     "Be swifty and precise. You should take all the facts in consideration." +
                     "Have intriguing conversations with the user. Make him feel engaged in the conversation, so that they can invest emotionally in their own sayings."+
                    "If there are serious situations, for eg abuse and drugs, legal or illegal, you should tell them how to take cautions and make them feel safe and included. Ask them comfortable questions and, depending on the context, move on to another subject."
            extra_body: {
  route: "primary"
}  
              
          },
          ...limitedHistory
        ],
        max_tokens: 200,
        temperature: 0.8
      })
    });

    // Parsează răspunsul și gestionează orice structură neașteptată
    const data = await response.json();
    console.log("Full OpenRouter response:", data); // debug

    let aiReply = "Sorry, I couldn't respond. 😔";

    if(data.choices && data.choices.length >0){
      aiReply=data.choices[0].message?.content || aiReply;
    }
    

    // Adaugă răspunsul AI la istoric
    chatHistory.push({ role: "assistant", content: aiReply });

    memory+=`User: $(userMessage}\nAI: ${aiReply}\n)`;
    if(memory.length>2000){
      memory=memory.slice(-1500); //we added this because we used a lot of tokens for this model (45K) and we had to pay $0.19$ credits on OpenRouter. We originally had a free plan, so in our account we had a -$0.19 balance after testing it for 112 times; We solved this problem by buying $5 credits. 
    }

    res.json({ reply: aiReply });

  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ reply: "Server error occurred. Please try again later. 😔" });
  }
});

// Optional: curăță istoric după 20 mesaje
setInterval(() => {
  if (chatHistory.length > 20) chatHistory.splice(0, chatHistory.length - 20);
}, 60000);

app.listen(3000, () => console.log("Backend running on port 3000 🚀"));
app.get("/", (req, res) => {
  res.send("AI Therapy Backend is running. Use POST /api/therapy to chat.");
});