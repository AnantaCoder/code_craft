from app.services.stages.semantlic_analyzer import semantic_analyzer
from app.utils.temp import create_temp_file, cleanup_temp
from app.services.stages.lexical_analyzer import run_lexical_analysis
from app.services.stages.syntax_analyzer import syntax_analyzer
from app.services.stages.intermediate_code_generator import generate_ir
from app.services.stages.code_optimiser import optimizer_ir
from app.services.stages.assembly import generate_assembly
from app.services.stages.machine_code import generate_machine_code
import platform


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


def run_semantic_pipeline(code: str) -> dict:
    source_path = create_temp_file(code)
    try:
        return semantic_analyzer(source_path)
    finally:
        cleanup_temp(source_path)


def run_ir_pipeline(code: str) -> dict:
    source_path = create_temp_file(code)
    try:
        return generate_ir(source_path)
    finally:
        cleanup_temp(source_path)


def run_pipeline(code: str) -> dict:
    source_path = create_temp_file(code)

    system = {
        "os": platform.system(),
        "release": platform.release(),
        "machine": platform.machine(),
        "processor": platform.processor(),
        "python_version": platform.python_version(),
    }

    try:
        lexical_result = run_lexical_analysis(source_path)
        syntax_result = syntax_analyzer(source_path)

        if syntax_result["status"] == "error":
            return {
                "status": "error",
                "stages": {
                    "lexical": lexical_result,
                    "syntax": syntax_result,
                },
            }

        semantic_result = semantic_analyzer(source_path)

        if semantic_result["status"] == "error":
            return {
                "status": "error",
                "stages": {
                    "lexical": lexical_result,
                    "syntax": syntax_result,
                    "semantic": semantic_result,
                },
            }

        ir_result = generate_ir(source_path)

        if ir_result["status"] == "error":
            return {
                "status": "error",
                "stages": {
                    "lexical": lexical_result,
                    "syntax": syntax_result,
                    "semantic": semantic_result,
                    "ir": ir_result,
                },
            }

        optimizer_ir_result = optimizer_ir(source_path)

        if optimizer_ir_result["status"] == "error":
            return {
                "status": "error",
                "stages": {
                    "lexical": lexical_result,
                    "syntax": syntax_result,
                    "semantic": semantic_result,
                    "ir": ir_result,
                    "optimization": optimizer_ir_result,
                },
            }

        assembly_result = generate_assembly(source_path)

        if assembly_result["status"] == "error":
            return {
                "status": "error",
                "stages": {
                    "lexical": lexical_result,
                    "syntax": syntax_result,
                    "semantic": semantic_result,
                    "ir": ir_result,
                    "optimization": optimizer_ir_result,
                    "assembly": assembly_result,
                },
            }

        machine_code_result = generate_machine_code(source_path)

        if machine_code_result["status"] == "error":
            return {
                "status": "error",
                "environment": system,
                "stages": {
                    "lexical": lexical_result,
                    "syntax": syntax_result,
                    "semantic": semantic_result,
                    "ir": ir_result,
                    "optimization": optimizer_ir_result,
                    "assembly": assembly_result,
                    "machine_code": machine_code_result,
                },
            }

        return {
            "status": "ok",
            "environment": system,
            "stages": {
                "lexical": lexical_result,
                "syntax": syntax_result,
                "semantic": semantic_result,
                "ir": ir_result,
                "optimization": optimizer_ir_result,
                "assembly": assembly_result,
                "machine_code": machine_code_result,
            },
        }

    finally:
        cleanup_temp(source_path)
