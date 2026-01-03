"""Finding the real meaning of code through analysis even when its syntax is correct.

The main goal of semantic analysis is to ensure that the code makes sense in the
context of the programming language's rules and the program's logic. This stage
checks for type correctness, variable declarations, scope resolution, and other
semantic rules. If everything is correct, the compiler can proceed to generate
intermediate code or machine code, knowing that the program behaves as intended.
"""

import re
from pathlib import Path
from typing import Dict, Any, List

from app.sandbox.docker_runner import run_in_sandbox

# Pattern to parse clang diagnostic messages
DIAGNOSTIC_REGEX = re.compile(
    r"^.+?:(?P<line>\d+):(?P<col>\d+):\s*(?P<type>error|warning):\s*(?P<message>.+?)(?:\s*\[.+\])?$"
)


def parse_diagnostics(stderr: str) -> Dict[str, List[Dict[str, Any]]]:
    errors: List[Dict[str, Any]] = []
    warnings: List[Dict[str, Any]] = []

    for line in stderr.splitlines():
        match = DIAGNOSTIC_REGEX.match(line.strip())
        if not match:
            continue

        diagnostic = {
            "message": match.group("message"),
            "line": int(match.group("line")),
            "column": int(match.group("col")),
        }

        if match.group("type") == "error":
            errors.append(diagnostic)
        else:
            warnings.append(diagnostic)

    return {"errors": errors, "warnings": warnings}


def semantic_analyzer(source_code_path: Path) -> Dict[str, Any]:

    command = [
        "clang",
        "-fsyntax-only",
        "-Wall",  # Enable all common warnings
        "-Wextra",  # Enable extra warnings
        "-pedantic",  # Issue warnings for strict ISO compliance
        str(source_code_path),
    ]

    result = run_in_sandbox(command=command, working_dir=str(source_code_path.parent))
    
    print("result stderr:", result)

    diagnostics = parse_diagnostics(result["stderr"])
    has_errors = len(diagnostics["errors"]) > 0

    if has_errors:
        return {
            "order": 3,
            "stage": "semantic",
            "status": "error",
            "output": {
                "valid": False,
                "summary": f"Semantic analysis failed with {len(diagnostics['errors'])} error(s)",
            },
            "diagnostics": diagnostics,
        }

    return {
        "order": 3,
        "stage": "semantic",
        "status": "ok",
        "output": {
            "valid": True,
            "summary": "Semantic analysis completed successfully",
        },
        "diagnostics": diagnostics,
    }
