"""Given raw source code, what are the smallest meaningful symbols (tokens)?"""

"""
int a = 5;
becomes :
['INT_KEYWORD',
'IDENTIFIER(a)',
'ASSIGNMENT_OPERATOR(=)', 
'INTEGER_LITERAL(5)', 
'SEMICOLON(;)']
"""
import re
from typing import List, Dict
from pathlib import Path
from app.sandbox.docker_runner import run_in_sandbox
from app.core.config import get_clang_include_flags
import logging

logger = logging.getLogger(__name__)

TOKEN_REGEX = re.compile(
    r"(?P<kind>\w+)\s+'(?P<value>[^']*)'.*Loc=<.*:(?P<line>\d+):(?P<col>\d+)>"
)


# helper for toolchain messages extraction 
def extract_toolchain_messages(raw: str) -> List[str]:
    messages = []
    for line in raw.splitlines():
        if not line.startswith("clang:"):
            continue
        if "linker" in line or "link" in line:
            continue
        if "error:" in line:
            continue
        messages.append(line)
    return messages




def parse_tokens(raw: str) -> List[Dict]:
    tokens = []

    for line in raw.splitlines():
        match = TOKEN_REGEX.search(line)
        if not match:
            continue

        tokens.append(
            {
                "kind": match.group("kind"),
                "value": match.group("value"),
                "line": int(match.group("line")),
                "column": int(match.group("col")),
            }
        )

    return tokens


def run_lexical_analysis(source_path: Path, include_raw: bool = False) -> Dict:
    
    command = ["clang"] + get_clang_include_flags() + ["-Xclang", "-dump-tokens", str(source_path)]

    result = run_in_sandbox(command=command, working_dir=str(source_path.parent))

    raw_output = result["stdout"] + result["stderr"]
    tokens = parse_tokens(raw_output)
    # print("Raw lexical output:\n%s", tokens)
    
    diagnostics = {
        "errors":[],
        "warnings":[]
    }
    
    status = "ok" if tokens else "error"
    
    toolchain_messages = extract_toolchain_messages(raw_output)
    
    for msg in toolchain_messages:
        diagnostics["warnings"].append({"message": msg})
        
    if status == "error":
        diagnostics["errors"].append({"message": "No tokens were extracted from the source code."})

    response = {
        "order": 1,
        "stage": "lexical",
        "status": status,
            "token_count": len(tokens),
        "output": {
            "tokens": tokens}
        ,
        "diagnostics": diagnostics
    }
    if include_raw:
        response["raw"] = raw_output
    return response
