# Code Craft Backend api

## What problem this solves

Code Craft provides a safe, interactive, and visual way to understand how compilers work. Instead of treating the compiler as a "black box" that turns code into an executable, this backend exposes every step of the transformation process—from raw source code to tokens, syntax trees, intermediate representation, and finally machine code. It solves the problem of opacity in learning compiler design and provides a platform for analyzing code structure and optimization without the risks of running untrusted code locally.

## Why LLVM?

We chose LLVM (Low Level Virtual Machine) because it is the industry standard for modern compiler infrastructure.

- **Modularity**: LLVM breaks down the compilation process into distinct, observable stages (Frontend -> Optimizer -> Backend).
- **Intermediate Representation (IR)**: LLVM IR is a powerful, language-independent code representation that allows us to demonstrate optimization passes (like constant folding and dead code elimination) clearly.
- **Real-world relevance**: By using Clang/LLVM, users are learning the same tools used to build major software like Chrome, Swift, and Rust.

## Why Sandboxing?

Compilers are complex pieces of software that parse untrusted input.

- **Security**: Running a compiler on arbitrary user code can expose the host system to resource exhaustion attacks (infinite loops in macros) or exploits in the compiler itself.
- **Isolation**: We use Docker containers to ensure that every analysis request runs in a clean, isolated environment with strict resource limits (CPU, Memory, PIDs), preventing one user's bad code from crashing the server for everyone else.

## Why not execute binaries?

This project focuses on **static analysis** and **compilation**, not execution.

- **Safety**: Executing arbitrary user code (Remote Code Execution) is inherently dangerous and requires a different class of security (like gVisor or Firecracker).
- **Focus**: The goal is to teach _how_ code is built, not to run it. We stop at generating the machine code (object file) to show what the CPU _would_ execute, which is sufficient for understanding the compilation pipeline.

## How each stage maps to a real compiler

The pipeline mirrors a standard compiler architecture:

1.  **Lexical Analysis**: Breaks source code into atomic units called tokens (Keywords, Identifiers, Literals).
2.  **Syntax Analysis**: Arranges tokens into a hierarchical Abstract Syntax Tree (AST) to validate grammar.
3.  **Semantic Analysis**: Checks for logical errors (type mismatches, undeclared variables) that syntax ignores.
4.  **Intermediate Code Generation**: Translates the AST into LLVM IR, a portable assembly-like language.
5.  **Optimization**: Improves the IR (e.g., pre-calculating math) without changing the program's output.
6.  **Assembly Generation**: Converts optimized IR into human-readable assembly instructions for the target architecture (x86_64).
7.  **Machine Code**: The final binary instructions (0s and 1s) that the processor understands.

## Upcoming LLVM Features

We are actively working on expanding the LLVM integration:

- **Custom Optimization Passes**: Allowing users to toggle specific LLVM passes (e.g., `-mem2reg`, `-loop-unroll`) to see their individual effects.
- **Control Flow Graphs (CFG)**: Visualizing the flow of the program based on the IR basic blocks.
- **Cross-Compilation**: Demonstrating how LLVM can generate machine code for different architectures (ARM, WASM) from the same source.
