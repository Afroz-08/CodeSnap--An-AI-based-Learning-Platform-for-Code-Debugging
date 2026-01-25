from pydantic import BaseModel

class ExplainRequest(BaseModel):
    language: str
    code: str
    error: str | None = None

class ExplainResponse(BaseModel):
    explanation: str
    corrected_code: str
    learning_tip: str

class RunRequest(BaseModel):
    language: str
    code: str

class RunResponse(BaseModel):
    output: str | None = None
    error: str | None = None