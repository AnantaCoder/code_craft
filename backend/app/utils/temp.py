import tempfile

from pathlib import Path


def create_temp_file(code:str)-> Path :
    temp_dir = Path(tempfile.mkdtemp(prefix="lex_"))
    source_file = temp_dir / "temp_source_code.c"
    source_file.write_text(code)
    return source_file