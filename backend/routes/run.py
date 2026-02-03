import subprocess
import tempfile
import io
import json
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

    # Handle disabled languages
    if req.language == "java":
        return RunResponse(
            error="Java execution is disabled in this demo environment. Please use Python or JavaScript."
        )
    elif req.language == "c":
        return RunResponse(
            error="C execution is disabled in this demo environment (gcc not installed). Please use Python or JavaScript."
        )

    # Create temporary directory for execution
    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            if req.language == "python":
                return _run_python(req.code, temp_dir, req.inputText)
            elif req.language == "javascript":
                return _run_javascript(req.code, temp_dir, req.inputText)
        except Exception as e:
            return RunResponse(error=f"Execution failed: {str(e)}")


def _run_python(code: str, temp_dir: str, input_text: str | None = None) -> RunResponse:
    """Execute Python code with robust input handling"""
    try:
        # Split input by newline into a list
        input_lines = []
        if input_text and input_text.strip():
            input_lines = [line.rstrip('\r') for line in input_text.split('\n')]
            # Remove empty trailing lines
            while input_lines and input_lines[-1].strip() == '':
                input_lines.pop()
        else:
            input_lines = ['']

        wrapper_code = f"""import sys
import io
import builtins

# Prepare input lines
input_lines = {json.dumps(input_lines)}
input_index = [0]  # Use list to make it mutable in nested functions

# Create input buffer
input_buffer = '\\n'.join(input_lines) + '\\n'
sys.stdin = io.StringIO(input_buffer)

# Override builtin input() function to handle EOF gracefully
def safe_input(prompt=''):
    try:
        return builtins.input(prompt)
    except EOFError:
        if input_index[0] >= len(input_lines):
            print("\\nError: Not enough input values provided. Please add more inputs.", file=sys.stderr)
            sys.exit(1)
        # This shouldn't happen with our StringIO setup, but fallback
        raise

builtins.input = safe_input

# Execute user code
try:
{_indent_code(code)}
except EOFError:
    print("\\nError: Not enough input values provided. Please add more inputs.", file=sys.stderr)
    sys.exit(1)
except Exception as e:
    # Re-raise other exceptions normally
    raise
"""

        # Write wrapper code to temporary file
        py_file = Path(temp_dir) / "temp.py"
        py_file.write_text(wrapper_code, encoding='utf-8')

        # Execute using subprocess
        process = subprocess.Popen(
            ["python", "temp.py"],
            cwd=temp_dir,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            shell=False
        )

        try:
            # Communicate with timeout
            stdout, stderr = process.communicate(timeout=8)  # Slightly longer timeout

            # Check exit code
            if process.returncode and process.returncode != 0:
                # Check if it's our friendly EOF error
                if stderr and "Not enough input values provided" in stderr:
                    return RunResponse(
                        output=stdout if stdout else None,
                        error="Not enough input values provided. Please add more inputs."
                    )
                # Other errors
                return RunResponse(
                    output=stdout if stdout else None,
                    error=stderr.strip() if stderr else "Execution failed"
                )

            return RunResponse(
                output=stdout if stdout else None,
                error=stderr if stderr else None
            )
        except subprocess.TimeoutExpired:
            process.kill()
            process.wait()
            return RunResponse(error="Execution timed out (8 seconds). If your program uses input(), make sure to provide input in the 'Program Input' field.")
    except FileNotFoundError:
        return RunResponse(error="Python is not installed")
    except Exception as e:
        return RunResponse(error=f"Python execution failed: {str(e)}")


def _indent_code(code: str) -> str:
    """Indent user code for insertion into wrapper"""
    lines = code.split('\n')
    # Indent each line with 4 spaces
    indented = '\n'.join('    ' + line if line.strip() else line for line in lines)
    return indented


def _run_javascript(code: str, temp_dir: str, input_text: str | None = None) -> RunResponse:
    """Execute JavaScript code with prompt() support"""
    try:
        # Check if code uses prompt() or similar input functions
        uses_prompt = 'prompt(' in code or 'readline' in code or 'process.stdin' in code

        # Prepare input file for JavaScript
        input_lines = []
        if input_text and input_text.strip():
            input_lines = [line.rstrip('\r') for line in input_text.split('\n')]
            # Remove empty trailing lines
            while input_lines and input_lines[-1].strip() == '':
                input_lines.pop()
        else:
            input_lines = ['']

        # Write input to file for JavaScript to read
        input_file = Path(temp_dir) / "input.txt"
        input_content = '\n'.join(input_lines)
        input_file.write_text(input_content, encoding='utf-8')

        if uses_prompt:
            # Wrap code to handle prompt() calls
            wrapper_code = _create_js_wrapper(code)
        else:
            wrapper_code = code

        # Write code to temporary file
        js_file = Path(temp_dir) / "temp.js"
        js_file.write_text(wrapper_code, encoding='utf-8')

        result = subprocess.run(
            ["node", "temp.js"],
            cwd=temp_dir,
            capture_output=True,
            text=True,
            timeout=8,  # Slightly longer timeout for JS
            shell=False
        )

        # Clean up the output - remove our wrapper messages
        stdout = result.stdout.strip() if result.stdout else None
        stderr = result.stderr.strip() if result.stderr else None

        # Check for our custom error messages
        if stderr and "Not enough input values provided" in stderr:
            return RunResponse(
                output=stdout,
                error="Not enough input values provided. Please add more inputs."
            )

        return RunResponse(
            output=stdout,
            error=stderr
        )
    except subprocess.TimeoutExpired:
        return RunResponse(error="Execution timed out (8 seconds)")
    except FileNotFoundError:
        return RunResponse(error="Node.js is not installed")
    except Exception as e:
        return RunResponse(error=f"JavaScript execution failed: {str(e)}")


def _create_js_wrapper(user_code: str) -> str:
    """Create wrapper code for JavaScript with prompt() support"""
    wrapper = """// Input handling for JavaScript
const fs = require('fs');
const path = require('path');

// Read input from file if it exists (will be created by backend)
const inputFile = path.join(__dirname, 'input.txt');
let inputLines = [];
let inputIndex = 0;

try {
    if (fs.existsSync(inputFile)) {
        const inputContent = fs.readFileSync(inputFile, 'utf8').trim();
        inputLines = inputContent.split('\\n').map(line => line.trim());
        // Remove empty trailing lines
        while (inputLines.length > 0 && inputLines[inputLines.length - 1] === '') {
            inputLines.pop();
        }
        if (inputLines.length === 0) {
            inputLines = [''];
        }
    } else {
        inputLines = [''];
    }
} catch (e) {
    inputLines = [''];
}

// Override global prompt function
global.prompt = function(message = '') {
    if (inputIndex < inputLines.length) {
        const value = inputLines[inputIndex];
        inputIndex++;
        return value;
    } else {
        console.error('Error: Not enough input values provided. Please add more inputs.');
        process.exit(1);
    }
};

// Override process.stdout.write for some input methods
const originalStdoutWrite = process.stdout.write;
let outputBuffer = '';

process.stdout.write = function(chunk, encoding, callback) {
    outputBuffer += chunk.toString();
    return originalStdoutWrite.call(process.stdout, chunk, encoding, callback);
};

// Execute user code
try {
"""

    # Indent user code and add to wrapper
    indented_code = _indent_js_code(user_code)
    wrapper += indented_code

    wrapper += """
} catch (error) {
    console.error('JavaScript Error:', error.message);
    process.exit(1);
}
"""

    return wrapper


def _indent_js_code(code: str) -> str:
    """Indent JavaScript code for insertion into wrapper"""
    lines = code.split('\n')
    # Indent each line with 4 spaces, but preserve empty lines
    indented = '\n'.join('    ' + line if line.strip() else '' for line in lines)
    return indented


# Java and C execution functions removed - disabled for demo