# Code Craft

A web-based C compiler visualization tool that breaks down the compilation process into interactive steps.

![Code Craft Demo](demo.png)

## Core Engine (Backend)

The backend is the heart of Code Craft, powered by Python and FastAPI. It orchestrates the entire compilation pipeline, providing a detailed look into how C code is transformed into machine instructions.

**Key Features:**

- **Full Compilation Pipeline**: Implements custom stages for:
  - Lexical Analysis (Tokenization)
  - Syntax Analysis (Parsing)
  - Semantic Analysis
  - Intermediate Code Generation
  - Code Optimization
  - Assembly Generation
- **Sandboxed Execution**: Safely compiles and runs user-submitted C code using isolated environments.
- **Detailed Analysis**: Returns structured data for every step of the compilation process, allowing for granular visualization.

## Frontend

A lightweight React application built with Bun that serves as the visual interface for the backend's analysis.

## Requirements

To run Code Craft locally, you need one of the following:

- **Docker** — For sandboxed code execution (recommended)
- **LLVM/Clang** — For local compilation without containerization
