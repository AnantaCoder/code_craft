from app.utils.temp import create_temp_file
from app.services.stages.lexical_analyzer import run_lexical_analysis


def run_lexical_pipeline(code: str) -> dict:
    source_path = create_temp_file(code)
    return run_lexical_analysis(source_path)
