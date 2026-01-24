from pathlib import Path
from app.sandbox.docker_runner import run_in_sandbox
from app.core.config import get_clang_include_flags_str


def optimizer_ir(source_path: Path) -> dict:

    optimized_ir_path = source_path.with_suffix(".opt.ll")
    
    include_flags = get_clang_include_flags_str()
    command = (
        f"clang {include_flags} -S -emit-llvm -O2 "
        f'"{source_path.name}" -o "{optimized_ir_path.name}"'
    )

    result = run_in_sandbox(command=command, working_dir=str(source_path.parent))

    if result["exit_code"] != 0:
        return {
            "order": 5,
            "stage": "optimization",
            "status": "error",
            "output": {"ir_optimized": None},
            "diagnostics": {
                "errors": [result["stderr"]],
                "warnings": [],
            },
        }
    try:
        optimized_ir = optimized_ir_path.read_text()
    except Exception as e:
        return {
            "order": 5,
            "stage": "optimization",
            "status": "error",
            "output": {"ir_optimized": None},
            "diagnostics": {
                "errors": [f"Failed to read optimized IR: {str(e)}"],
                "warnings": [],
            },
        }

    return {
        "order": 5,
        "stage": "optimization",
        "status": "ok",
        "output": {
            "ir_optimized": optimized_ir,
        },
        "diagnostics": {
            "errors": [],
            "warnings": [],
        },
    }