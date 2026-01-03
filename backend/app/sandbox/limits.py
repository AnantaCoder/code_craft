class SandboxLimits:
    # Resource limits
    MEMORY = "128m"
    CPU = 0.5
    PIDS = 64

    # Execution limits
    TIMEOUT_SECONDS = 5
    MAX_OUTPUT_SIZE = 1024 * 100 # 100KB

    # Security
    NETWORK_DISABLED = True
    READ_ONLY_ROOT = True
    DROP_CAPABILITIES = ["ALL"]
    USER = "compiler"

    # Docker Image
    IMAGE_NAME = "code_craft_sandbox"
