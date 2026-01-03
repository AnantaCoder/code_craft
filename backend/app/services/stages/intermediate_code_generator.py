from pathlib import Path
import re
from app.sandbox.docker_runner import run_in_sandbox


# =========================
# Regex definitions
# =========================

# FIXED: works for both single-line and multi-line attribute blocks
ATTRIBUTE_BLOCK_RE = re.compile(
    r"attributes\s+(#\d+)\s*=\s*\{([\s\S]*?)\}",
    re.DOTALL
)

SOURCE_FILENAME_RE = re.compile(r'source_filename\s*=\s*"([^"]+)"')
TARGET_TRIPLE_RE = re.compile(r'target triple\s*=\s*"([^"]+)"')

DI_COMPILE_UNIT_RE = re.compile(
    r"!DICompileUnit\(([\s\S]*?)\)",
    re.DOTALL
)


# =========================
# Stage 4 Entry Point
# =========================

def generate_ir(source_path: Path) -> dict:
    ir_path = source_path.with_suffix(".ll")

    command = f'clang -S -emit-llvm "{source_path.name}" -o "{ir_path.name}"'
    result = run_in_sandbox(
        command=command,
        working_dir=str(source_path.parent)
    )

    if result["exit_code"] != 0:
        return {
            "order": 4,
            "stage": "ir",
            "status": "error",
            "output": {"ir": None},
            "diagnostics": {
                "errors": [result["stderr"]],
                "warnings": [],
            },
        }

    try:
        ir_code = ir_path.read_text()
    except Exception as e:
        return {
            "order": 4,
            "stage": "ir",
            "status": "error",
            "output": {"ir": None},
            "diagnostics": {
                "errors": [f"Failed to read IR file: {str(e)}"],
                "warnings": [],
            },
        }

    return {
        "order": 4,
        "stage": "ir",
        "status": "ok",
        "output": {
            "ir": ir_code,                                # raw IR (ground truth)
            "module": parse_module_metadata(ir_code),    # module-level info
            "attributes": parse_ir_attributes(ir_code),  # LLVM attribute blocks
            "debug": parse_debug_metadata(ir_code),      # DI metadata
        },
        "diagnostics": {
            "errors": [],
            "warnings": [],
        },
    }


# =========================
# Parsers
# =========================

def parse_ir_attributes(ir_code: str) -> dict:
    """
    Parse LLVM attribute blocks (attributes #0 = {...})
    into structured JSON.
    """
    attributes = {}

    for match in ATTRIBUTE_BLOCK_RE.finditer(ir_code):
        attr_id = match.group(1)   # "#0"
        body = match.group(2)

        flags = []
        key_values = {}

        # Tokenize safely (works for single-line & multi-line)
        tokens = re.findall(r'"[^"]+"=[^ ]+|[^\s]+', body)

        for token in tokens:
            if "=" in token:
                key, value = token.split("=", 1)
                key_values[key.strip('"')] = value.strip('"')
            else:
                flags.append(token)

        attributes[attr_id] = {
            "flags": flags,
            "key_values": key_values,
        }

    return attributes


def parse_module_metadata(ir_code: str) -> dict:
    """
    Extract module-level LLVM metadata.
    """
    module = {}

    sf_match = SOURCE_FILENAME_RE.search(ir_code)
    if sf_match:
        module["source_filename"] = sf_match.group(1)

    tt_match = TARGET_TRIPLE_RE.search(ir_code)
    if tt_match:
        module["target_triple"] = tt_match.group(1)

    return module


def parse_debug_metadata(ir_code: str) -> dict:
    """
    Best-effort parsing of DICompileUnit debug metadata.
    """
    debug = {}

    di_match = DI_COMPILE_UNIT_RE.search(ir_code)
    if not di_match:
        return debug

    content = di_match.group(1)

    lang_match = re.search(r"language:\s*([^,]+)", content)
    if lang_match:
        debug["language"] = lang_match.group(1).strip()

    prod_match = re.search(r'producer:\s*"([^"]+)"', content)
    if prod_match:
        debug["producer"] = prod_match.group(1)

    return debug
