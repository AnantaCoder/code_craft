# Compiler Toolchain Architecture

This document explains how Code Craft uses the Clang compiler with GCC/MinGW header files to compile C code in both **local development** and **Dockerized production** environments.

---

## Table of Contents

- [Overview](#overview)
- [Why Clang + GCC Headers?](#why-clang--gcc-headers)
- [Architecture Diagram](#architecture-diagram)
- [Local Development (Windows)](#local-development-windows)
- [Docker Environment (Linux)](#docker-environment-linux)
- [How the Code Works](#how-the-code-works)
- [Troubleshooting](#troubleshooting)

---

## Overview

Code Craft analyzes C code through a complete compilation pipeline. To compile C code, we need:

1. **A compiler** → We use **Clang** (from the LLVM project)
2. **C standard library headers** → Files like `stdio.h`, `stdlib.h`, `string.h`
3. **A runtime library** → To link the final executable

The challenge: Clang is a compiler, but it doesn't ship with its own C standard library. It needs to use headers from another source—either **MSVC (Microsoft)**, **GCC/MinGW**, or **glibc (Linux)**.

---

## Why Clang + GCC Headers?

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLANG COMPILER                              │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────────┐    │
│  │   Parser    │ → │ IR Generator│ → │ Machine Code Gen    │    │
│  └─────────────┘   └─────────────┘   └─────────────────────┘    │
│         ↑                                                       │
│         │  #include <stdio.h>                                   │
│         │                                                       │
└─────────┼───────────────────────────────────────────────────────┘
          │
          ↓
┌─────────────────────────────────────────────────────────────────┐
│             STANDARD LIBRARY HEADERS (from GCC/MinGW)           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐            │
│  │ stdio.h  │ │ stdlib.h │ │ string.h │ │ math.h   │ ...        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘            │
└─────────────────────────────────────────────────────────────────┘
```

**Why this combination?**

| Feature | Clang | GCC/MinGW Headers |
|---------|-------|-------------------|
| Modern diagnostics | ✅ Rich error messages | — |
| AST dump (JSON) | ✅ `-ast-dump=json` | — |
| Token dump | ✅ `-dump-tokens` | — |
| LLVM IR output | ✅ `-emit-llvm` | — |
| Standard headers | ❌ Not included | ✅ Complete libc |
| Cross-platform | ✅ Works everywhere | ✅ Available on Windows (MinGW) |

**Result:** Clang provides the powerful analysis features we need, while GCC/MinGW provides the standard library headers that Clang requires.

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────────┐
│                           CODE CRAFT BACKEND                               │
│                                                                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         app/core/config.py                          │   │
│  │  ┌───────────────────────────────────────────────────────────────┐  │   │
│  │  │  get_clang_include_flags()                                    │  │   │
│  │  │                                                               │  │   │
│  │  │  if SANDBOX_MODE == "local" and Windows:                      │  │   │
│  │  │      return ["-I", "C:\MinGW\include",                        │  │   │
│  │  │              "--target=x86_64-w64-mingw32"]                   │  │   │
│  │  │  else:                                                        │  │   │
│  │  │      return []  # Docker has headers installed                │  │   │
│  │  └───────────────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                       │
│                    ┌───────────────┼───────────────┐                       │
│                    ▼               ▼               ▼                       │
│  ┌─────────────────────┐ ┌─────────────────┐ ┌─────────────────────┐       │
│  │  lexical_analyzer   │ │ syntax_analyzer │ │ semantic_analyzer   │       │
│  │  clang + flags      │ │ clang + flags   │ │ clang + flags       │       │
│  └─────────────────────┘ └─────────────────┘ └─────────────────────┘       │
│                    │               │               │                       │
│                    ▼               ▼               ▼                       │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      app/sandbox/docker_runner.py                   │   │
│  │                                                                     │   │
│  │  if SANDBOX_MODE == "local":                                        │   │
│  │      subprocess.run(command)  ──────────────────▶ [LOCAL CLANG]    │    |
│  │  else:                                                              │   │
│  │      docker run ... command  ───────────────────▶ [DOCKER CLANG]   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘

                    │                               │
                    ▼                               ▼
    ┌───────────────────────────┐   ┌───────────────────────────────────┐
    │    LOCAL WINDOWS ENV      │   │       DOCKER CONTAINER            │
    │                           │   │                                   │
    │  C:\Program Files\LLVM\   │   │  /usr/bin/clang                   │
    │  └── bin\clang.exe        │   │                                   │
    │                           │   │  /usr/include/                    │
    │  C:\MinGW\                │   │  └── stdio.h  (from libc6-dev)    │
    │  └── include\             │   │  └── stdlib.h                     │
    │      └── stdio.h          │   │  └── string.h                     │
    │      └── stdlib.h         │   │                                   │
    │      └── string.h         │   │  Installed via:                   │
    │                           │   │  apt-get install libc6-dev        │
    │  Clang flag needed:       │   │                    build-essential│
    │  --target=x86_64-w64-     │   │                                   │
    │          mingw32          │   │  No extra flags needed!           │
    └───────────────────────────┘   └───────────────────────────────────┘
```

---

## Local Development (Windows)

### Prerequisites

1. **LLVM/Clang** installed at `C:\Program Files\LLVM\`
   - Download from [llvm.org/releases](https://releases.llvm.org/)
   - Or install via: `winget install LLVM.LLVM`

2. **MinGW** installed at `C:\MinGW\`
   - Download from [mingw.org](https://mingw.org/) or [mingw-w64.org](https://mingw-w64.org/)
   - Ensure `C:\MinGW\include\stdio.h` exists

### How It Works

When you run the backend with `$env:SANDBOX_MODE='local'`:

```powershell
# Start the backend in local mode
$env:SANDBOX_MODE='local'; uvicorn app.main:app --reload
```

The `config.py` module detects the environment and returns appropriate flags:

```python
# app/core/config.py

def get_clang_include_flags() -> list[str]:
    # In Docker mode, no extra flags needed
    if os.getenv("SANDBOX_MODE", "docker").lower() != "local":
        return []
    
    if platform.system() == "Windows":
        # Point Clang to MinGW headers
        return [
            "-I", "C:\\MinGW\\include",
            "-I", "C:\\MinGW\\lib\\gcc\\mingw32\\6.3.0\\include",
            "--target=x86_64-w64-mingw32"  # Use MinGW ABI, not MSVC
        ]
    
    return []  # Linux has headers in standard locations
```

### The `--target` Flag Explained

By default, Clang on Windows targets **MSVC** (`x86_64-pc-windows-msvc`), meaning it expects Microsoft Visual Studio headers. Since we're using MinGW headers, we must tell Clang to use the **MinGW/GCC calling conventions**:

```
--target=x86_64-w64-mingw32
         │       │  └── MinGW (GCC-compatible) ABI
         │       └── Windows environment
         └── 64-bit x86 architecture
```

This flag tells Clang:
- Use GCC-style headers (from MinGW)
- Use GCC-style name mangling for C++ (if applicable)
- Link against MinGW runtime libraries

---

## Docker Environment (Linux)

### Dockerfile Configuration

The sandboxed container uses a Debian-based image with all necessary compilers:

```dockerfile
# sandbox.dockerfile

FROM debian:bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    clang \
    llvm \
    binutils \
    libc6-dev \        # ← Standard C library headers (stdio.h, etc.)
    build-essential \  # ← GCC toolchain + additional headers
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*
```

### How Headers Work in Docker

In Linux (Docker container), the standard headers are installed to system paths that Clang automatically searches:

```
/usr/include/
├── stdio.h      ← #include <stdio.h>
├── stdlib.h     ← #include <stdlib.h>
├── string.h     ← #include <string.h>
├── math.h       ← #include <math.h>
└── ...

/usr/lib/x86_64-linux-gnu/
├── libc.so      ← C runtime library
├── libm.so      ← Math library
└── ...
```

**No extra flags needed!** Clang on Linux automatically finds these paths.

### Building the Docker Image

```bash
# Build the sandbox image
docker build -t code-craft-sandbox -f sandbox.dockerfile .

# The image is used by docker_runner.py for secure compilation
```

---

## How the Code Works

### 1. Configuration Layer (`app/core/config.py`)

```python
def get_clang_include_flags() -> list[str]:
    """Returns clang flags based on platform and environment."""
    
    # Docker mode: headers already available via libc6-dev
    if os.getenv("SANDBOX_MODE", "docker").lower() != "local":
        return []
    
    # Windows local mode: need MinGW headers
    if platform.system() == "Windows":
        mingw_include = Path(r"C:\MinGW\include")
        flags = []
        if mingw_include.exists():
            flags.extend(["-I", str(mingw_include)])
            flags.extend(["--target=x86_64-w64-mingw32"])
        return flags
    
    # Linux local: system headers available
    return []


def get_clang_include_flags_str() -> str:
    """Returns flags as a space-separated string for shell commands."""
    flags = get_clang_include_flags()
    return " ".join(flags) if flags else ""
```

### 2. Compiler Stages (Example: IR Generation)

```python
# app/services/stages/intermediate_code_generator.py

from app.core.config import get_clang_include_flags_str

def generate_ir(source_path: Path) -> dict:
    ir_path = source_path.with_suffix(".ll")
    
    # Include flags are automatically added based on environment
    include_flags = get_clang_include_flags_str()
    command = f'clang {include_flags} -S -emit-llvm "{source_path.name}" -o "{ir_path.name}"'
    
    # Runs locally or in Docker based on SANDBOX_MODE
    result = run_in_sandbox(command=command, working_dir=str(source_path.parent))
    ...
```

### 3. Execution Layer (`app/sandbox/docker_runner.py`)

```python
def run_in_sandbox(command: str | list[str], working_dir: str) -> dict:
    """Routes execution to local or Docker based on environment."""
    
    # Local mode: run directly on host
    if os.getenv("SANDBOX_MODE", "docker").lower() == "local":
        return _run_locally(command, working_dir)
    
    # Docker mode: run in isolated container
    docker_cmd = [
        "docker", "run", "--rm",
        "--network", "none",        # No network access
        "--memory", "256m",         # Memory limit
        "--cpus", "1",              # CPU limit
        "-v", f"{working_dir}:/workspace",
        "-w", "/workspace",
        "code-craft-sandbox",
        ...
    ]
    return subprocess.run(docker_cmd, ...)
```

---

## Complete Flow Example

When a user submits this C code:

```c
#include <stdio.h>

int main() {
    printf("Hello, World!\n");
    return 0;
}
```

### Flow on Local Windows:

```
1. User submits code
           ↓
2. Backend receives code, creates temp file
           ↓
3. lexical_analyzer.py:
   clang -I C:\MinGW\include --target=x86_64-w64-mingw32 -Xclang -dump-tokens hello.c
   → Clang finds stdio.h at C:\MinGW\include\stdio.h
   → Returns tokens
           ↓
4. syntax_analyzer.py:
   clang -I C:\MinGW\include --target=x86_64-w64-mingw32 -Xclang -ast-dump=json hello.c
   → Returns AST as JSON
           ↓
5. ... (semantic, IR, optimization, assembly, machine code stages)
           ↓
6. Response sent to frontend with all compilation stages
```

### Flow on Docker:

```
1. User submits code
           ↓
2. Backend receives code, creates temp file
           ↓
3. lexical_analyzer.py:
   docker run code-craft-sandbox clang -Xclang -dump-tokens hello.c
   → Container's clang finds stdio.h at /usr/include/stdio.h
   → Returns tokens
           ↓
4. ... (same stages, but inside container)
           ↓
5. Response sent to frontend
```

---

## Troubleshooting

### "fatal error: 'stdio.h' file not found" (Local Windows)

**Problem:** Clang can't find standard headers.

**Solutions:**
1. Verify MinGW is installed at `C:\MinGW\`:
   ```powershell
   Test-Path "C:\MinGW\include\stdio.h"
   # Should return True
   ```

2. If MinGW is elsewhere, update `config.py`:
   ```python
   mingw_include = Path(r"D:\your\path\MinGW\include")
   ```

3. Alternatively, install Visual Studio Build Tools and remove the `--target` flag.

### "unable to find Visual Studio" (Local Windows)

**Problem:** You're using MSVC target without Visual Studio installed.

**Solution:** The `--target=x86_64-w64-mingw32` flag should bypass this. Ensure:
```python
flags.extend(["--target=x86_64-w64-mingw32"])
```

### "Docker daemon not running"

**Problem:** Docker Desktop isn't started.

**Solutions:**
1. Start Docker Desktop, OR
2. Use local mode:
   ```powershell
   $env:SANDBOX_MODE='local'; uvicorn app.main:app --reload
   ```

### Headers work locally but not in Docker

**Problem:** Docker image missing `libc6-dev`.

**Solution:** Rebuild the Docker image:
```bash
docker build --no-cache -t code-craft-sandbox -f sandbox.dockerfile .
```

---

## Summary

| Environment | Headers Source | Clang Flags Needed | Managed By |
|-------------|---------------|-------------------|------------|
| **Windows Local** | MinGW (`C:\MinGW\include`) | `-I C:\MinGW\include --target=x86_64-w64-mingw32` | `config.py` |
| **Linux Local** | System (`/usr/include`) | None | N/A |
| **Docker (Linux)** | `libc6-dev` (`/usr/include`) | None | `sandbox.dockerfile` |

The `config.py` module acts as the **single source of truth** for platform-specific compiler configuration, ensuring consistent behavior across all environments.
