from pathlib import Path
from app.sandbox.docker_runner import run_in_sandbox


def generate_assembly(source_path: Path) -> dict:
    
    asm_path = source_path.with_suffix(".s")
    command = f'clang -S "{source_path.name}" -o "{asm_path.name}"'
    result = run_in_sandbox(
        command=command,
        working_dir=str(source_path.parent),
    )

    if result["exit_code"] != 0:
        return {
            "order": 6,
            "stage": "assembly",
            "status": "error",
            "output": {"assembly": None},
            "diagnostics": {
                "errors": [result["stderr"]],
                "warnings": [],
            },
        }

    try:
        assembly_code = asm_path.read_text()
    except Exception as e:
        return {
            "order": 6,
            "stage": "assembly",
            "status": "error",
            "output": {"assembly": None},
            "diagnostics": {
                "errors": [f"Failed to read assembly file: {str(e)}"],
                "warnings": [],
            },
        }

    return {
        "order": 6,
        "stage": "assembly",
        "status": "ok",
        "output": {
            "assembly": assembly_code,
        },
        "diagnostics": {
            "errors": [],
            "warnings": [],
        },
    }
