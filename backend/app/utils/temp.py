import tempfile
import shutil
import os
from pathlib import Path


def create_temp_file(code: str) -> Path:
   
    temp_dir = Path(tempfile.mkdtemp(prefix="lex_"))
    os.chmod(temp_dir, 0o777)
    # print("Created temporary directory at:", temp_dir)
    source_file = temp_dir / "temp_source_code.c"
    source_file.write_text(code)
    os.chmod(source_file, 0o666)
    return source_file


def cleanup_temp(source_path: Path) -> None:
   
    try:
        temp_dir = source_path.parent
        if temp_dir.exists() and temp_dir.is_dir():
            shutil.rmtree(temp_dir)
        # print("Cleaned up temporary directory at:", temp_dir)
    except Exception:
        pass
