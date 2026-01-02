from app.utils.temp import create_temp_file , cleanup_temp
from app.services.stages.lexical_analyzer import run_lexical_analysis
from app.services.stages.syntax_analyzer import syntax_analyzer

def run_lexical_pipeline(code: str) -> dict:
    source_path = create_temp_file(code)
    try:
        return run_lexical_analysis(source_path)
    finally:
        cleanup_temp(source_path)


def run_syntax_pipeline(code: str) -> dict:
    source_path = create_temp_file(code)
    try:
        return syntax_analyzer(source_path)
    finally:
        cleanup_temp(source_path)



def run_pipeline(code:str)->dict:
    
    source_path = create_temp_file(code)
    
    try:
        
        lexical_analyzer_result = run_lexical_analysis(source_path)
        syntax_analyzer_result = syntax_analyzer(source_path)
        
        if syntax_analyzer_result["status"] == "error":
            return {
                "status": "error",
                "stages": {
                    "lexical": lexical_analyzer_result,
                    "syntax": syntax_analyzer_result,
                },
            }

        return {
            "status": "ok",
            "stages": {
                "lexical": lexical_analyzer_result,
                "syntax": syntax_analyzer_result,
            },
        }
    except Exception:
        raise
        
    finally:
        cleanup_temp(source_path)