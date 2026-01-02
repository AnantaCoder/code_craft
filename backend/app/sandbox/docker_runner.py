import subprocess


def run_in_sandbox(command: str | list[str], working_dir: str) -> dict:
    # Run the command in a Docker container as a sandboxed environment

    try:
        result = subprocess.run(
            command,
            shell=True,
            cwd=working_dir,
            capture_output=True,
            text=True,
            timeout=5,  # seconds
        )

        return {
            "exit_code": result.returncode,
            "stdout": result.stdout,
            "stderr": result.stderr,
        }
    except subprocess.TimeoutExpired:
        return {"exit_code": -1, "stdout": "", "stderr": "Execution timed out."}


"""subprocess:module in Python is a built-in library used to run external programs, command-line tools, or other scripts by creating new processes (child processes) from within your Python code. This module is the recommended way to interact with the underlying operating system and replaces older functions like os.system.   """
