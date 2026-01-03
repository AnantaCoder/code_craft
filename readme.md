## Code Craft: A Multi-Stage C Compiler API

**Code Craft** is a high-performance **FastAPI-based compiler backend** designed to break down the C compilation process into modular, analyzable stages. Built for educational and analytical purposes, it allows users to visualize how source code transforms from text into a structured program.

The project includes a **React-based frontend** for interacting with the API and visualizing the compilation process.

---

### 🚀 Key Features

- **Sequential Pipeline:** Implements distinct stages for Lexical, Syntax, and Semantic analysis.
- **Deep Diagnostics:** Provides detailed error and warning reporting with precise line and column numbers.
- **Sandboxed Execution:** Utilizes `subprocess` isolation (with planned Docker integration) and 5-second timeouts to handle untrusted code safely.
- **AST Visualization:** Generates a complete Abstract Syntax Tree (AST) in JSON format via Clang integration.

---

### 🏗️ Project Structure

- **`backend/`**: FastAPI application handling the compilation pipeline.
- **`frontend/`**: Bun + React application for the user interface.

---

### 🔄 Compilation Pipeline

1. **Lexical Analysis:** Tokenizes raw C code into symbols using Clang's `-dump-tokens`.
2. **Syntax Analysis:** Constructs an AST to verify the grammatical structure of the code.
3. **Semantic Analysis:** Validates type correctness, scope resolution, and variable declarations.
4. **IR Generation (In Progress):** Transitioning from Clang-based wrappers to native **LLVM IR** generation using `llvmlite`.
5. **Code Optimization (Planned):** Optimization passes on the IR.
6. **Assembly & Machine Code (Planned):** Final code generation stages.

---

### 🛠️ Technology Stack

**Backend:**

- **Framework:** FastAPI
- **Compiler Infrastructure:** LLVM / Clang
- **Validation:** Pydantic
- **Language:** Python 3.10+

**Frontend:**

- **Runtime:** Bun
- **Framework:** React
- **Styling:** Tailwind CSS
- **Visualization:** Three.js

---

### 📈 Future Roadmap

The project is currently evolving from a **Clang tool** into a **native LLVM compiler**. Planned enhancements include custom Intermediate Code Generation, optimization passes, and assembly output.

Current phase: **Clang Integration**
