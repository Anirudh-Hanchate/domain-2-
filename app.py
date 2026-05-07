import os
import json
import re
import base64
import io
import PIL.Image
import google.generativeai as genai
from flask import Flask, render_template, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# ── Gemini client (reads GOOGLE_API_KEY from environment) ──────────────
from dotenv import load_dotenv
load_dotenv()

genai.configure(api_key=os.environ.get("GOOGLE_API_KEY"))

SYSTEM_PROMPT = """You are a clinical neuropsychologist AI specialized in the Clock Drawing Test (CDT).
Analyze the provided clock image and output ONLY a valid JSON object — no markdown, no extra text.

Return this exact structure:
{
  "scores": {
    "circle": <integer 0-2>,
    "numbers_present": <integer 0-3>,
    "number_placement": <integer 0-4>,
    "hands_present": <integer 0-2>,
    "hand_length": <integer 0-2>,
    "time_accuracy": <integer 0-2>
  },
  "flags": [
    { "severity": "red|amber|green", "title": "<short flag title>", "detail": "<clinical explanation>" }
  ],
  "reasoning": "<2-3 sentence clinical summary of overall findings>"
}

Scoring criteria (CLOX system):
- circle:           2=reasonable closed circle, 1=distorted but recognizable, 0=absent or just a line
- numbers_present:  3=all 12 numbers inside circle, 2=10-11, 1=7-9, 0=fewer than 7 or numbers outside circle
- number_placement: 4=correct quadrants evenly spaced, 3=minor spacing errors, 2=hemineglect (all on one side) OR counterclockwise, 1=severe clustering, 0=random with no spatial logic
- hands_present:    2=two hands drawn, 1=one hand, 0=no hands
- hand_length:      2=minute hand longer pointing near 2, hour hand pointing near 10, 1=both present but same length or slightly off, 0=completely wrong positions
- time_accuracy:    2=both hands correctly show 10:10, 1=one hand correct, 0=neither correct

Critical red flags to detect and report:
- Hemineglect: all numbers on right or left half only → spatial neglect
- Perseveration: numbers 13, 14, 15 written after 12 → frontal lobe sign
- Concrete interpretation: hands pointing to digit 1 and digit 0 instead of 10 and 2 → Alzheimer's specific
- No hands drawn at all
- Numbers written outside the circle
- Numbers going counterclockwise
- Severe number clustering in one region
- Missing numbers (fewer than 7)

If the image appears blank or has no clock drawing visible, score everything 0 and add a red flag titled "No drawing detected"."""


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/analyze-clock", methods=["POST"])
def analyze_clock():
    try:
        data = request.json
        if not data or "image" not in data:
            return jsonify({"error": "No image data provided"}), 400

        image_b64 = data["image"]
        # Strip data URL prefix if present
        if "," in image_b64:
            image_b64 = image_b64.split(",")[1]

        image_data = base64.b64decode(image_b64)
        image = PIL.Image.open(io.BytesIO(image_data))

        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            system_instruction=SYSTEM_PROMPT,
            generation_config={"response_mime_type": "application/json"}
        )
        
        response = model.generate_content([
            "Analyze this clock drawing and return scores as JSON only.",
            image
        ])

        raw = response.text
        clean = re.sub(r"```json|```", "", raw).strip()
        result = json.loads(clean)
        return jsonify(result)

    except json.JSONDecodeError as e:
        return jsonify({"error": f"Failed to parse AI response: {str(e)}"}), 500

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    key = os.environ.get("GOOGLE_API_KEY")
    if not key:
        print("\nWARNING: GOOGLE_API_KEY not set!")
        print("   Run: set GOOGLE_API_KEY=your_api_key\n")
    else:
        print(f"\nAPI key loaded ({key[:12]}...)\n")
    app.run(debug=True, port=5000)
