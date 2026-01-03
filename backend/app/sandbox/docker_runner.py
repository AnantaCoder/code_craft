import subprocess
import logging
import os
import platform
from pathlib import Path
from app.sandbox.limits import SandboxLimits

logger = logging.getLogger(__name__)


def run_in_sandbox(command: str | list[str], working_dir: str) -> dict:
    """
    Runs a command inside a secured Docker container.

    DEV MODE: If SANDBOX_MODE env var is set to 'local', runs on host.
    """

    # 1. Check for Local Dev Mode
    # Set SANDBOX_MODE=local in your .env or terminal to bypass Docker
    if os.getenv("SANDBOX_MODE", "docker").lower() == "local":
        return _run_locally(command, working_dir)

    # 2. Docker Execution (Production/Secure Mode)
    # Ensure command is a string for shell execution inside container
    if isinstance(command, str):
        command = ["/bin/sh", "-c", command]

    # Resolve absolute path for volume mounting
    abs_working_dir = str(Path(working_dir).resolve())

    docker_cmd = [
        "docker",
        "run",
        "--rm",  # Remove container after exit
        "--network",
        "none",  # Disable network access
        f"--memory={SandboxLimits.MEMORY}",  # Limit memory
        f"--cpus={SandboxLimits.CPU}",  # Limit CPU
        f"--pids-limit={SandboxLimits.PIDS}",  # Limit processes
        "--cap-drop=ALL",  # Drop all capabilities
        "--security-opt=no-new-privileges",  # Prevent privilege escalation
        "--user",
        SandboxLimits.USER,  # Run as non-root user
        "-v",
        f"{abs_working_dir}:/workspace",  # Mount working directory
        "-w",
        "/workspace",  # Set working directory
        SandboxLimits.IMAGE_NAME,  # Image name
    ]

    # Append the command arguments
    docker_cmd.extend(command)

    try:
        logger.info(f"Running in sandbox: {command}")
        result = subprocess.run(
            docker_cmd,
            capture_output=True,
            text=True,
            timeout=SandboxLimits.TIMEOUT_SECONDS,
        )

        # Check if Docker itself failed to run (e.g. daemon not running)
        if result.returncode != 0 and "Is the docker daemon running" in result.stderr:
            return {
                "exit_code": -1,
                "stdout": "",
                "stderr": "Docker Daemon is not running. Start Docker Desktop or use SANDBOX_MODE=local.",
            }

        return {
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }
    except subprocess.TimeoutExpired:
        return {
            "exit_code": -1,
            "stdout": "",
            "stderr": f"Execution timed out after {SandboxLimits.TIMEOUT_SECONDS}s.",
        }
    except Exception as e:
        return {
            "exit_code": -1,
            "stdout": "",
            "stderr": f"Sandbox execution failed: {str(e)}",
        }


def _run_locally(command: str | list[str], working_dir: str) -> dict:
    """
    Runs command directly on the host machine.
    NOTE: This offers NO isolation and limited resource control.
    Only use for trusted code during development.
    """
    try:
        is_windows = platform.system() == "Windows"
        if isinstance(command, list) and is_windows:
            command = " ".join(command)
            logger.warning(f"Running LOCALLY (No Sandbox): {command}")

        result = subprocess.run(
            command,
            cwd=working_dir,
            capture_output=True,
            text=True,
            shell=True if is_windows else False,
            timeout=SandboxLimits.TIMEOUT_SECONDS,
        )

        return {
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }
    except subprocess.TimeoutExpired:
        return {
            "exit_code": -1,
            "stdout": "",
            "stderr": f"Execution timed out after {SandboxLimits.TIMEOUT_SECONDS}s.",
        }
    except Exception as e:
        return {
            "exit_code": -1,
            "stdout": "",
            "stderr": f"Local execution failed: {str(e)}",
        }
