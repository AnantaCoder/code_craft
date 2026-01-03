from fastapi import APIRouter
from pydantic import BaseModel
from app.services.pipeline import run_pipeline,run_lexical_pipeline , run_syntax_pipeline , run_semantic_pipeline


router = APIRouter()


class CodeRequest(BaseModel):
        code: str


@router.post("/analyze/full")
def full(req: CodeRequest):
        return run_pipeline(req.code)


@router.post("/analyze/lexical")
def lexical(req: CodeRequest):
        return run_lexical_pipeline(req.code)


@router.post("/analyze/syntax")
def syntax(req: CodeRequest):
        return run_syntax_pipeline(req.code)

@router.post("/analyze/semantic")
def semantic(req: CodeRequest):
        return run_semantic_pipeline(req.code)



