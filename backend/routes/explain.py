from fastapi import APIRouter, Response

from ai.groq_client import explain_error
from models.schemas import ExplainRequest, ExplainResponse

router = APIRouter()


@router.options("/explain", include_in_schema=False)
async def explain_options() -> Response:
    # Empty 204 response for CORS preflight; CORSMiddleware will add headers.
    return Response(status_code=204)


@router.post("/explain", response_model=ExplainResponse)
def explain(req: ExplainRequest):
    """
    Explain a code error using Groq LLM.
    Response format is fixed for the frontend:
    {
      explanation: string,
      corrected_code: string,
      learning_tip: string
    }
    """
    result = explain_error(req.language, req.code, req.error or "")

    # Ensure keys exist and keep response shape stable.
    return {
        "explanation": result.get("explanation", "No explanation available."),
        "corrected_code": result.get("corrected_code", req.code),
        "learning_tip": result.get(
            "learning_tip",
            "Try to understand each change in the corrected code and why it fixes the error.",
        ),
    }
