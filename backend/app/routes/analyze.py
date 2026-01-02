from fastapi import APIRouter

# importing necessary schemas

from pydantic import BaseModel
from app.services.pipeline import run_lexical_pipeline


router = APIRouter()


class LexicalRequest(BaseModel):
        code: str


@router.post("/analyze/lexical")
def lexical(req: LexicalRequest):
        return run_lexical_pipeline(req.code)
