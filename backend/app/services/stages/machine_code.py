# Machine code generation + disassembly
# Produces object file and disassembled instructions.
# dual code generation for linux and windows targets
# targeting host os -> windows: .obj + llvm-objdump
# targeting host os -> linux: .o + objdump
# THEN disassemble using appropriate tool
# Outputs disassembly text.
# ===============================================================================

from pathlib import Path
from app.sandbox.docker_runner import run_in_sandbox
import platform
import re

INSTR_RE = re.compile(
    r"""
    ^\s*
    (?P<addr>[0-9a-fA-F]+):         # Address (hex)
    \s+
    (?P<bytes>(?:[0-9a-fA-F]{2}\s)+) # Bytes (hex pairs followed by space)
    \s*                             # Optional extra whitespace (tabs/spaces)
    (?P<mnemonic>[a-z0-9]+)         # Mnemonic (alphanumeric)
    (?:\s+(?P<operands>.+))?        # Optional operands
    $
    """,
    re.VERBOSE | re.IGNORECASE,
)


def generate_machine_code(source_path: Path) -> dict:

    system = platform.system()

    # decide target based host os
    if system == "Windows":
        obj_path = source_path.with_suffix(".obj")
        disassembler = "llvm-objdump"

    else:

        obj_path = source_path.with_suffix(".o")
        disassembler = "objdump"

    compile_cmd = f'clang -c "{source_path.name}" -o "{obj_path.name}"'
    compile_result = run_in_sandbox(
        command=compile_cmd,
        working_dir=str(source_path.parent),
    )

    if compile_result["exit_code"] != 0:
        return {
            "order": 7,
            "stage": "machine_code",
            "status": "error",
            "output": {"disassembly": None},
            "diagnostics": {
                "errors": [compile_result["stderr"]],
                "warnings": [],
            },
        }

    disassembler_cmd = f'{disassembler} -d "{obj_path.name}"'
    disassembler_result = run_in_sandbox(
        command=disassembler_cmd,
        working_dir=str(source_path.parent),
    )
    parsed_disassembly_code = parse_disassembly(disassembler_result["stdout"])
    if disassembler_result["exit_code"] != 0:
        return {
            "order": 7,
            "stage": "machine_code",
            "status": "error",
            "output": {"disassembly": None},
            "diagnostics": {
                "errors": [disassembler_result["stderr"]],
                "warnings": [],
            },
        }

    return {
        "order": 7,
        "stage": "machine_code",
        "status": "ok",
        "output": {
            "disassembly": disassembler_result["stdout"],
            "parsed_dissembley_code": parsed_disassembly_code,
        },
        "diagnostics": {
            "errors": [],
            "warnings": [],
        },
    }


def parse_disassembly(text: str) -> dict:
    result = {"file": None, "format": None, "section": None, "functions": []}

    current_fn = None

    for line in text.splitlines():
        line = line.rstrip()

        # file header
        if "file format" in line:
            parts = line.split(":", 1)
            if len(parts) == 2:
                result["file"] = parts[0].strip()
                fmt = parts[1].strip()
                if fmt.startswith("file format"):
                    fmt = fmt.replace("file format", "").strip()
                result["format"] = fmt
            continue

        # section
        if line.startswith("Disassembly of section"):
            result["section"] = line.split()[-1].strip(":")
            continue

        # function label
        if re.match(r"^[0-9a-f]+ <.+>:$", line):
            addr, rest = line.split(" ", 1)
            name = rest.strip("<>:")
            current_fn = {"name": name, "address": f"0x{addr}", "instructions": []}
            result["functions"].append(current_fn)
            continue

        # instruction
        m = INSTR_RE.match(line)
        if m and current_fn:
            instr = {
                "address": f"0x{m.group('addr')}",
                "bytes": m.group("bytes").strip().split(),
                "mnemonic": m.group("mnemonic"),
                "operands": (
                    [op.strip() for op in m.group("operands").split(",")]
                    if m.group("operands")
                    else []
                ),
            }
            current_fn["instructions"].append(instr)

    return result
