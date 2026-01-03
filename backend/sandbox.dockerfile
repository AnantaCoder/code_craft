FROM ubuntu:22.04

# -----------------------------
# 1. Base hardening
# -----------------------------
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    clang \
    llvm \
    binutils \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# -----------------------------
# 2. Create non-root user
# -----------------------------
RUN useradd -m compiler
USER compiler
WORKDIR /workspace

# -----------------------------
# 3. Lock environment
# -----------------------------
ENV HOME=/workspace
ENV TMPDIR=/workspace

