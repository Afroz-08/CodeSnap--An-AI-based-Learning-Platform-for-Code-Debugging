from fastapi import APIRouter
from pydantic import BaseModel
from ai import groq_client

router = APIRouter()


class TutorRequest(BaseModel):
    message: str
    language: str = "general"


@router.post("/tutor")
def tutor_chat(req: TutorRequest):
    """
    Conversational AI tutor endpoint.
    - Accepts only free-text message + language
    - Returns plain text in a JSON envelope { "reply": "..." }
    - Does NOT reuse explain_error logic
    """
    if not groq_client.GROQ_API_KEY or groq_client.client is None:
        return {"reply": "AI tutor is unavailable because GROQ_API_KEY is not configured."}

    system_prompt = f"""You are a friendly programming tutor for beginners.
- Be clear and concise; avoid jargon.
- Support Python, JavaScript, Java, and C.
- Explain concepts, syntax, logic, common errors, and best practices.
- Give short examples when helpful.
- Encourage and keep a positive tone.
Current language focus: {req.language}
If the user asks something unrelated to programming, briefly steer them back to coding topics."""

    try:
        completion = groq_client.client.chat.completions.create(
            model=groq_client.MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": req.message},
            ],
            temperature=0.6,
            max_tokens=600,
            stream=False,
        )
        reply_text = completion.choices[0].message.content.strip()
        return {"reply": reply_text}
    except Exception as exc:
        return {
            "reply": "The AI tutor encountered a problem. Please try again in a moment.",
        }