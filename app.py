from flask import Flask, request, jsonify
from huggingface_hub import login
from transformers import pipeline
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

# 🔹 Authentication
HF_TOKEN = os.getenv("HF_TOKEN")
if HF_TOKEN:
    login(token=HF_TOKEN)

# 🔹 Load Hugging Face model
try:
    chat_model = pipeline(
        "text-generation",
        model="cristianaghinea33/Companion_lovely",
        trust_remote_code=True
    )
except Exception as e:
    print(f"Error loading model: {e}")
    chat_model = None

# 🔹 Load text files
def load_temperaments():
    try:
        with open("temperaments.txt", "r") as f:
            temperaments_data = f.read().splitlines()
        return {line.split(":")[0].strip(): [t.strip() for t in line.split(":")[1].split(",")] for line in temperaments_data}
    except FileNotFoundError:
        return {"default": ["neutral"]}

def load_therapists():
    try:
        with open("therapists.txt", "r") as f:
            therapists_data = f.read().splitlines()
        therapists = []
        for line in therapists_data:
            name, specialties, style = [x.strip() for x in line.split(" | ")]
            therapists.append({"name": name, "specialties": specialties.split(", "), "style": style})
        return therapists
    except FileNotFoundError:
        return []

def load_problems():
    try:
        with open("problems_scenarios.txt", "r") as f:
            return [line.strip() for line in f.read().splitlines()]
    except FileNotFoundError:
        return []

def load_responses():
    try:
        responses = {}
        with open("responses.txt", "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#"):
                    key, text = line.split(": ", 1)
                    responses[key] = text
        return responses
    except FileNotFoundError:
        return {}

temperaments = load_temperaments()
therapists = load_therapists()
problems = load_problems()
responses = load_responses()

# 🔹 Matching function
def match_user(text):
    # 1️⃣ Detect temperament
    detected_temp = None
    for temp, traits in temperaments.items():
        if any(trait.lower() in text.lower() for trait in traits):
            detected_temp = temp
            break
    if not detected_temp:
        detected_temp = "sanguine"  # default

    # 2️⃣ Detect problems
    detected_problems = [p for p in problems if p.lower() in text.lower()]

    # 3️⃣ Recommend therapists
    recommended = []
    for t in therapists:
        if detected_temp in t["specialties"] or any(p in t["specialties"] for p in detected_problems):
            recommended.append(t["name"])
    if not recommended:
        recommended = [t["name"] for t in therapists]  # fallback

    return detected_temp, detected_problems, recommended

# 🔹 Get empathic response
def get_empathic_response(user_text):
    user_text_lower = user_text.lower()
    for key in responses:
        if key in user_text_lower:
            return responses[key]
    return "I believe in you! Your heart holds incredible strength, and every step you take can create something beautiful."

# 🔹 Chat endpoint
@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_input = data.get('message', '').strip()
        
        if not user_input:
            return jsonify({'reply': 'Please type a message.'}), 400
        
        # Get empathic response
        empathic_reply = get_empathic_response(user_input)
        
        # Match user
        temp, probs, recs = match_user(user_input)
        
        # Generate AI response if model is available
        ai_response = empathic_reply
        if chat_model:
            try:
                generated = chat_model(user_input, max_length=150, do_sample=True)[0]["generated_text"]
                ai_response = generated
            except Exception as e:
                print(f"Model generation error: {e}")
        
        # Format response
        final_response = (
            f"🌟 Detected temperament: {temp}\n\n"
            f"💬 {ai_response}\n\n"
            f"🩺 Recommended Therapists: {', '.join(recs)}\n\n"
            f"⚠️ Disclaimer: This is not an official diagnosis. Consult a licensed professional."
        )
        
        return jsonify({'reply': final_response}), 200
    
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'reply': 'AI unavailable. Please try again.'}), 500

# 🔹 Health check
@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)