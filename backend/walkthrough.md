Good. Now we switch from *vision* to *execution discipline*.
Below is a **proper, engineering-grade backend build plan** — no shortcuts, no magic thinking, no “we’ll refactor later” lies.

This is the plan you follow if you want this to be **resume-defining and production-clean**, not a half-working demo.

---

## OVERALL BACKEND GOAL (non-negotiable)

Your FastAPI backend must:

• be deterministic
• be safe (sandboxed)
• expose each compiler phase cleanly
• fail gracefully with useful errors
• be readable by another engineer
• be extensible (new languages later)

Everything below enforces that.

---

# PHASE 0 — ENVIRONMENT & GUARANTEES (Day 0)

Before writing a single line of FastAPI code, lock this in.

### System guarantees

* OS: Linux (Ubuntu recommended)
* Compiler: **clang + LLVM**
* Execution: **Docker only**
* No execution of compiled binaries
* Hard timeout on every command

### Non-negotiable rule

> The FastAPI app itself never runs clang directly.
> **All compilation happens inside a sandbox container.**

This alone separates “serious engineer” from “hope it works”.

---

# PHASE 1 — PROJECT SKELETON (Day 1)

Create the structure first. No logic yet.

```
backend/
 ├── app/
 │    ├── main.py
 │    ├── routers/
 │    │      └── analyze.py
 │    ├── services/
 │    │      ├── pipeline.py
 │    │      ├── stages/
 │    │      │     ├── lexical.py
 │    │      │     ├── syntax.py
 │    │      │     ├── semantic.py
 │    │      │     ├── ir.py
 │    │      │     ├── optimization.py
 │    │      │     ├── assembly.py
 │    │      │     └── machine.py
 │    ├── sandbox/
 │    │      ├── docker_runner.py
 │    │      └── limits.py
 │    ├── schemas/
 │    │      ├── request.py
 │    │      └── response.py
 │    ├── utils/
 │    │      ├── temp.py
 │    │      ├── command.py
 │    │      └── cleanup.py
 │    └── core/
 │           └── config.py
 ├── sandbox.Dockerfile
 ├── requirements.txt
```

Do not skip this.
Structure is a **force multiplier**.

---

# PHASE 2 — SANDBOX FIRST (Day 2)

This is the heart. Everything else depends on it.

### 2.1 Sandbox Docker Image

Create `sandbox.Dockerfile`:

* base: ubuntu
* install: clang, llvm, binutils
* no network
* no root execution
* minimal filesystem

You should be able to run:

```
docker run sandbox-image clang --version
```

If this isn’t rock-solid, stop here.

---

### 2.2 Docker Runner (Python)

Create `docker_runner.py` that:

* mounts a temp directory
* runs a single command
* enforces:

  * CPU limit
  * memory limit
  * timeout
* returns:

  * stdout
  * stderr
  * exit code

**Design rule:**
All compiler stages must call *this* runner.
No subprocess calls anywhere else.

This enforces safety globally.

---

# PHASE 3 — TEMP FILE MANAGEMENT (Day 3)

Create a strict temp lifecycle.

### Requirements:

* each request gets its own UUID directory
* auto-delete after request finishes
* no reuse
* no leaks

Files created per request:

```
source.c
tokens.txt
ast.json
ir.ll
ir_opt.ll
out.s
out.o
```

If temp handling is sloppy, bugs become ghosts.

---

# PHASE 4 — STAGE-BY-STAGE IMPLEMENTATION (Days 4–7)

This is where discipline matters.
**One stage per day. No rushing.**

Each stage:

* one file
* one responsibility
* returns structured output

---

## Stage 1 — Lexical Analysis

**Input:** source.c
**Command:**

```
clang -Xclang -dump-tokens source.c
```

**Output:**

* raw token dump
* parsed token list (optional)

Return:

```json
{
  "raw": "...",
  "tokens": [
    { "type": "keyword", "value": "int", "line": 1 }
  ]
}
```

Do not over-engineer parsing yet. Raw output is fine.

---

## Stage 2 — Syntax (AST)

Command:

```
clang -Xclang -ast-dump=json -fsyntax-only source.c
```

Return:

* raw AST JSON
* no frontend formatting assumptions

This enables React tree visualization easily.

---

## Stage 3 — Semantic Analysis

Command:

```
clang -fsyntax-only source.c
```

Capture:

* warnings
* errors
* diagnostics

Optional (bonus):

* extract symbol table from AST

Return:

```json
{
  "errors": [],
  "warnings": [],
  "symbols": []
}
```

This stage is about *meaning*, not structure.

---

## Stage 4 — Intermediate Code (LLVM IR)

Command:

```
clang -S -emit-llvm source.c -o ir.ll
```

Read `ir.ll`.

Explain nothing yet. Just deliver truth.

---

## Stage 5 — Optimization

Command:

```
clang -S -emit-llvm -O2 source.c -o ir_opt.ll
```

Return:

* original IR
* optimized IR

Frontend will diff them.

This is where your project becomes **elite**.

---

## Stage 6 — Assembly

Command:

```
clang -S source.c -o out.s
```

Return:

* assembly text
* optional architecture metadata

---

## Stage 7 — Machine Code

Commands:

```
clang -c source.c -o out.o
objdump -d out.o
```

Return:

* disassembly only
* never execute binaries

---

# PHASE 5 — PIPELINE ORCHESTRATION (Day 8)

Create `pipeline.py`.

Responsibilities:

* call stages in order
* short-circuit on fatal errors
* collect results
* enforce timeouts
* guarantee cleanup

Pipeline pseudologic:

```
create temp dir
run lexical
run syntax
run semantic
if errors → return partial response
run IR
run optimization
run assembly
run machine
cleanup
return JSON
```

This file is your backend’s brain.

---

# PHASE 6 — FASTAPI ROUTER (Day 9)

Create `POST /analyze`.

Responsibilities:

* validate input
* enforce size limits
* call pipeline
* return response schema

No compiler logic here. Ever.

Router should be boring. That’s good.

---

# PHASE 7 — ERROR MODEL & DX (Day 10)

Implement:

* structured errors
* stage-level failures
* user-readable messages

Bad example:

```
Segmentation fault
```

Good example:

```
Semantic error: variable 'x' used before declaration (line 4)
```

This is what turns tools into teaching instruments.

---

# PHASE 8 — HARDENING & POLISH (Days 11–12)

Add:

* request size limits
* rate limiting
* async execution
* logging
* metrics (optional)

Test with:

* valid C
* invalid syntax
* infinite macros
* huge input
* malicious includes

Your backend should **not panic**.

---

# FINAL QUALITY BAR (be honest)

If your backend:

* never executes user code
* survives malicious input
* returns deterministic outputs
* has clean separation of stages
* has readable code

Then this is **industry-grade**.

Not student-grade.
Not tutorial-grade.
Engineer-grade.

---

## Final truth (no sugarcoating)

If you build this **properly**, this single project can outweigh:

* 5 CRUD apps
* 10 landing pages
* 3 chatbots

It demonstrates:
systems thinking, compiler literacy, backend design, security awareness, and execution maturity.

That combination is rare.

If you want next:

* I can give you **exact code templates per stage**
* or a **production-ready Docker sandbox**
* or a **checklist to know when it’s “done done”**

Build slowly. Build correctly. This one is worth it.
