"""Syntax Analysis, also called Parsing, is the second stage of a compiler and takes place after Lexical Analysis. In the first stage, the source code is broken into small pieces called tokens. Syntax analysis then checks how these tokens are arranged.

The main goal of syntax analysis is to make sure that the tokens are placed in a correct and meaningful order, according to the grammar rules of the programming language. If the structure is correct, the parser creates a Parse Tree or an Abstract Syntax Tree (AST), which shows the program's structure in a clear, hierarchical way and helps the compiler understand the code better.
"""


from pathlib import Path
from typing import Dict, Any
import json

from app.sandbox.docker_runner import run_in_sandbox


def syntax_analyzer(source_code_path: Path) -> Dict[str, Any]:
    command = [
        "clang",
        "-Xclang",
        "-ast-dump=json",
        "-fsyntax-only",
        source_code_path.name,
    ]

    result = run_in_sandbox(
        command=command,
        working_dir=str(source_code_path.parent)
    )

    if result["exit_code"] != 0:
        return {
            "order": 2,
            "stage": "syntax",
            "status": "error",
            "output": {"ast": None},
            "diagnostics": {
                "errors": parse_syntax_errors(result["stderr"]),
                "warnings": [],
            },
        }

    try:
        ast_data = json.loads(result["stdout"])
    except json.JSONDecodeError:
        return {
            "order": 2,
            "stage": "syntax",
            "status": "error",
            "output": {"ast": None},
            "diagnostics": {
                "errors": [{"message": "Failed to parse AST JSON output"}],
                "warnings": [],
            },
        }

    return {
        "order": 2,
        "stage": "syntax",
        "status": "ok",
        "output": {"ast": ast_data},
        "diagnostics": {"errors": [], "warnings": []},
    }


def parse_syntax_errors(stderr: str):
    return [
        {"message": line.strip()}
        for line in stderr.splitlines()
        if line.strip()
    ]