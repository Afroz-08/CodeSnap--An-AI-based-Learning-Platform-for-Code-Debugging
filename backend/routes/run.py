import os
import subprocess
import tempfile
import shutil
import re
from pathlib import Path
from fastapi import APIRouter, Response

from models.schemas import RunRequest, RunResponse

router = APIRouter()


@router.options("/run", include_in_schema=False)
async def run_options() -> Response:
    return Response(status_code=204)


@router.post("/run", response_model=RunResponse)
def run_code(req: RunRequest):
    """
    Secure code execution sandbox for multiple languages.
    Runs code in a temporary directory with strict timeouts and cleanup.
    """
    if req.language not in ["python", "javascript", "java", "c"]:
        return RunResponse(error=f"Unsupported language: {req.language}")

    # Create temporary directory for execution
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            if req.language == "python":
                return _run_python(req.code, temp_dir)
            elif req.language == "javascript":
                return _run_javascript(req.code, temp_dir)
            elif req.language == "java":
                return _run_java(req.code, temp_dir)
            elif req.language == "c":
                return _run_c(req.code, temp_dir)
        except Exception as e:
            return RunResponse(error=f"Execution failed: {str(e)}")


def _run_python(code: str, temp_dir: str) -> RunResponse:
    """Execute Python code using python -c"""
    try:
        result = subprocess.run(
            ["python", "-c", code],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            timeout=2,
            shell=False
        )
        return RunResponse(
            output=result.stdout if result.stdout else None,
            error=result.stderr if result.stderr else None
        )
    except subprocess.TimeoutExpired:
        return RunResponse(error="Execution timed out (2 seconds)")
    except FileNotFoundError:
        return RunResponse(error="Python is not installed")


def _run_javascript(code: str, temp_dir: str) -> RunResponse:
    """Execute JavaScript code using node"""
    try:
        result = subprocess.run(
            ["node", "-e", code],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            timeout=2,
            shell=False
        )
        return RunResponse(
            output=result.stdout if result.stdout else None,
            error=result.stderr if result.stderr else None
        )
    except subprocess.TimeoutExpired:
        return RunResponse(error="Execution timed out (2 seconds)")
    except FileNotFoundError:
        return RunResponse(error="Node.js is not installed")


def _extract_java_class_name(code: str) -> str:
    """Extract the public class name from Java code"""
    # Look for public class ClassName pattern
    match = re.search(r'public\s+class\s+(\w+)', code)
    if match:
        return match.group(1)
    # Fallback: look for any class declaration
    match = re.search(r'class\s+(\w+)', code)
    if match:
        return match.group(1)
    # Last resort: use Main
    return "Main"

def _run_java(code: str, temp_dir: str) -> RunResponse:
    """Execute Java code by extracting class name, compiling, and running"""
    try:
        # Extract class name from code
        class_name = _extract_java_class_name(code)
        filename = f"{class_name}.java"

        # Write code to the appropriate filename
        java_file = Path(temp_dir) / filename
        java_file.write_text(code, encoding='utf-8')

        # Compile
        compile_result = subprocess.run(
            ["javac", filename],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            timeout=2,
            shell=False
        )

        if compile_result.returncode != 0:
            return RunResponse(error=compile_result.stderr or "Compilation failed")

        # Execute
        run_result = subprocess.run(
            ["java", class_name],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            timeout=2,
            shell=False
        )

        return RunResponse(
            output=run_result.stdout if run_result.stdout else None,
            error=run_result.stderr if run_result.stderr else None
        )

    except subprocess.TimeoutExpired:
        return RunResponse(error="Execution timed out (2 seconds)")
    except FileNotFoundError:
        return RunResponse(error="Java is not installed")


def _run_c(code: str, temp_dir: str) -> RunResponse:
    """Execute C code by writing to temp.c, compiling, and running"""
    try:
        # Write code to temp.c
        c_file = Path(temp_dir) / "temp.c"
        c_file.write_text(code, encoding='utf-8')

        # Compile
        compile_result = subprocess.run(
            ["gcc", "temp.c", "-o", "temp"],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            timeout=2,
            shell=False
        )

        if compile_result.returncode != 0:
            return RunResponse(error=compile_result.stderr or "Compilation failed")

        # Execute
        run_result = subprocess.run(
            ["./temp"],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            timeout=2,
            shell=False
        )

        return RunResponse(
            output=run_result.stdout if run_result.stdout else None,
            error=run_result.stderr if run_result.stderr else None
        )

    except subprocess.TimeoutExpired:
        return RunResponse(error="Execution timed out (2 seconds)")
    except FileNotFoundError:
        return RunResponse(error="GCC is not installed")