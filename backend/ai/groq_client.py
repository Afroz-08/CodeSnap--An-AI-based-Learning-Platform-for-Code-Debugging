import json
import os

from dotenv import load_dotenv
from groq import Groq

# Load env here (CRITICAL)
load_dotenv(".env.local")

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# ✅ Use a VERIFIED Groq model
MODEL = "llama-3.1-8b-instant"

client: Groq | None = None
if GROQ_API_KEY:
  client = Groq(api_key=GROQ_API_KEY)


def explain_error(language: str, code: str, error: str):
    """
    Call Groq via the official Python SDK to explain an error and provide a fix.
    Always returns a dict with: explanation, corrected_code, learning_tip.
    """
    if not GROQ_API_KEY or client is None:
        return {
            "explanation": "Groq API key not configured.",
            "corrected_code": code,
            "learning_tip": "Set your GROQ_API_KEY environment variable.",
        }

    prompt = f"""
Return ONLY valid JSON. No markdown. No extra text.

{{
  "explanation": "Explain the error clearly for a beginner",
  "corrected_code": "Provide corrected full code",
  "learning_tip": "One short learning tip"
}}

Language: {language}

Code:
{code}

Error:
{error}
"""

    try:
        chat_completion = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a strict JSON-only API. Respond ONLY with valid JSON.",
                },
                {
                    "role": "user",
                    "content": prompt,
                },
            ],
            temperature=0.2,
            max_tokens=512,
            stream=False,
        )

        content = chat_completion.choices[0].message.content

        # SAFE JSON extraction (Groq may add whitespace around JSON)
        start = content.find("{")
        end = content.rfind("}") + 1
        json_text = content[start:end]

        data = json.loads(json_text)

        # Ensure all expected keys are present
        return {
            "explanation": data.get(
                "explanation", "The AI did not return an explanation."
            ),
            "corrected_code": data.get("corrected_code", code),
            "learning_tip": data.get(
                "learning_tip", "Try to understand why this error happened and how the fix works."
            ),
        }

    except Exception as e:
        # Safe fallback to avoid breaking the frontend
        return {
            "explanation": "Internal AI processing error.",
            "corrected_code": code,
            "learning_tip": str(e),
        }
