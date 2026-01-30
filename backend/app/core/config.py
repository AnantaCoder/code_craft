"""
Configuration for the Code Craft backend.

This module provides platform-aware configuration for the clang toolchain,
including include paths for Windows (MinGW) and Linux systems.
"""

import os
import platform
from pathlib import Path
import logging

logger = logging.getLogger(__name__)


def get_clang_include_flags() -> list[str]:
    """
    Returns clang include flags based on platform and environment.
    
    - In Docker (SANDBOX_MODE != 'local'): No extra flags needed (system headers available)
    - On Windows local: Returns MinGW include path flags
    - On Linux local: Returns empty list (system headers usually available)
    """
    sandbox_mode = os.getenv("SANDBOX_MODE", "docker").lower()
    logger.info(f"SANDBOX_MODE detected: '{sandbox_mode}'")
    
    # In Docker mode, system headers are available via libc6-dev
    if sandbox_mode != "local":
        logger.info("Using Docker mode - no extra include flags needed")
        return []
    
    system = platform.system()
    logger.info(f"Platform detected: {system}")
    
    if system == "Windows":
        # MinGW include paths (adjust if your MinGW is installed elsewhere)
        mingw_include = Path(r"C:\MinGW\include")
        mingw_lib_include = Path(r"C:\MinGW\lib\gcc\mingw32\6.3.0\include")
        
        flags = []
        if mingw_include.exists():
            flags.extend(["-I", str(mingw_include)])
            logger.info(f"Added MinGW include path: {mingw_include}")
        else:
            logger.warning(f"MinGW include path not found: {mingw_include}")
            
        if mingw_lib_include.exists():
            flags.extend(["-I", str(mingw_lib_include)])
            logger.info(f"Added MinGW lib include path: {mingw_lib_include}")
        
        # Use MinGW target instead of MSVC
        flags.extend(["--target=x86_64-w64-mingw32"])
        
        logger.info(f"Final clang flags: {flags}")
        return flags
    
    # Linux/macOS: system headers should be available
    return []


def get_clang_include_flags_str() -> str:
    """
    Returns clang include flags as a string for use in shell commands.
    """
    flags = get_clang_include_flags()
    result = " ".join(flags) if flags else ""
    logger.info(f"Clang include flags string: '{result}'")
    return result

