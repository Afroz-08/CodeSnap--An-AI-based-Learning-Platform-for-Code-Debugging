import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, FolderOpen, FolderClosed, Sparkles, Download, FileJson, CheckCircle, XCircle, AlertCircle, Terminal } from "lucide-react";
import CodeEditor from "../components/CodeEditor";
import FileExplorer from "../components/FileExplorer";
import LearningAnalytics from "../components/LearningAnalytics";
import MCQQuiz from "../components/MCQQuiz";
import Accordion from "../components/Accordion";
import { explainCode, runCode, downloadReport } from "../services/api";
import { useWorkspace } from "../contexts/WorkspaceContext";
import { useEditor } from "../contexts/EditorContext";
import activityTracker from "../utils/ActivityTracker";

export default function EditorPage() {
  // Workspace state
  const { currentFile, language, setLanguage, updateFileContent } = useWorkspace();
  const { updateEditorState } = useEditor();

  // Editor content state
  const [code, setCode] = useState("");

  // Original user code for report (immutable after run)
  const [originalUserCode, setOriginalUserCode] = useState(null);

  // Program input state (for Python input())
  const [programInput, setProgramInput] = useState("");

  // Error state
  const [error, setError] = useState("");

  // API states
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);

  // Learning Analytics State
  const [analytics, setAnalytics] = useState({
    errorCount: 0,
    fixStatus: 'not_started',
    attempts: 0,
    sessionProgress: 0
  });

  // Quiz State
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [showQuiz, setShowQuiz] = useState(false);

  // Workspace visibility (hidden by default)
  const [showWorkspace, setShowWorkspace] = useState(false);
  const workspaceRef = useRef(null);

  // Click outside handler for workspace
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showWorkspace && workspaceRef.current && !workspaceRef.current.contains(event.target)) {
        const folderButton = event.target.closest('[data-folder-button]');
        if (!folderButton) {
          setShowWorkspace(false);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showWorkspace]);

  // Sync code with current file
  useEffect(() => {
    if (currentFile) {
      setCode(currentFile.content);
      setLanguage(currentFile.language);
    }
  }, [currentFile, setLanguage]);

  // Update global editor state for AI tutor
  useEffect(() => {
    updateEditorState({ language });
  }, [language, updateEditorState]);

  // Reset AI explanation state when language or file changes
  useEffect(() => {
    setResult(null);
    setError("");
    setOriginalUserCode(null); // Reset original code when file/language changes
    setProgramInput(""); // Reset program input when language changes
    setQuizQuestions([]); // Reset quiz when language changes
    setShowQuiz(false); // Hide quiz when language changes
    setAnalytics(prev => ({
      ...prev,
      errorCount: 0,
      fixStatus: 'not_started',
      attempts: 0,
      sessionProgress: 0
    }));
  }, [language, currentFile?.id]);

  const handleApplyFixedCode = () => {
    if (result?.corrected_code && result.corrected_code !== code) {
      setCode(result.corrected_code);
      updateFileContent(currentFile.id, result.corrected_code);

      setAnalytics(prev => ({
        ...prev,
        fixStatus: 'fixed',
        sessionProgress: Math.min(prev.sessionProgress + 25, 100)
      }));

      activityTracker.trackFixApplied();
    }
  };

  // Generate MCQ questions - language-dependent
  useEffect(() => {
    if (result && error) {
      const questions = generateQuizQuestions(language, error, result.corrected_code, result.explanation);
      setQuizQuestions(questions);
      setShowQuiz(true);
    }
  }, [result, error, language]);

  const generateQuizQuestions = (lang, error, fixedCode, explanation) => {
    const questions = [];

    if (lang === "python") {
      if (error.toLowerCase().includes('nameerror')) {
        questions.push({
          question: "What type of error occurs when you try to use a variable that hasn't been defined in Python?",
          options: ["SyntaxError", "NameError", "TypeError", "ValueError"],
          correctAnswer: 1
        });
      }

      if (error.toLowerCase().includes('syntaxerror') || error.toLowerCase().includes('syntax')) {
        questions.push({
          question: "What type of error occurs when your Python code has incorrect syntax?",
          options: ["NameError", "SyntaxError", "IndentationError", "ImportError"],
          correctAnswer: 1
        });
      }

      if (error.toLowerCase().includes('indentation')) {
        questions.push({
          question: "Python uses indentation to define code blocks. What error occurs if indentation is incorrect?",
          options: ["SyntaxError", "IndentationError", "NameError", "TypeError"],
          correctAnswer: 1
        });
      }

      if (fixedCode.includes('input(')) {
        questions.push({
          question: "In Python, which function is used to get user input from the keyboard?",
          options: ["read()", "input()", "get_input()", "scan()"],
          correctAnswer: 1
        });
      }

      if (fixedCode.includes('for ') || fixedCode.includes('while ')) {
        questions.push({
          question: "Which Python keyword is used to create a loop that repeats code?",
          options: ["repeat", "loop", "for or while", "iterate"],
          correctAnswer: 2
        });
      }
    } else if (lang === "javascript") {
      if (error.toLowerCase().includes('undefined')) {
        questions.push({
          question: "In JavaScript, what value is returned when you try to access a variable that hasn't been declared?",
          options: ["null", "undefined", "NaN", "Error"],
          correctAnswer: 1
        });
      }

      if (error.toLowerCase().includes('syntax')) {
        questions.push({
          question: "What type of error occurs when your JavaScript code has incorrect syntax?",
          options: ["ReferenceError", "SyntaxError", "TypeError", "RangeError"],
          correctAnswer: 1
        });
      }

      questions.push({
        question: "In JavaScript, what keyword is used to declare a variable that can be reassigned?",
        options: ["const", "let", "var", "let or var"],
        correctAnswer: 3
      });

      if (fixedCode.includes('function') || fixedCode.includes('=>')) {
        questions.push({
          question: "Which of these is a valid way to define a function in JavaScript?",
          options: ["function myFunc() {}", "const myFunc = () => {}", "Both of the above", "None of the above"],
          correctAnswer: 2
        });
      }
    } else if (lang === "java") {
      if (error.toLowerCase().includes('compile') || error.toLowerCase().includes('syntax')) {
        questions.push({
          question: "Java is a compiled language. What happens if your code has syntax errors?",
          options: ["It runs anyway", "Compilation fails", "Runtime error", "Warning only"],
          correctAnswer: 1
        });
      }

      questions.push({
        question: "In Java, what method must every program have to start execution?",
        options: ["start()", "main()", "run()", "init()"],
        correctAnswer: 1
      });

      questions.push({
        question: "Java is a statically typed language. What does this mean?",
        options: ["Variables must be declared with a type", "Variables can change types", "No types needed", "Types are optional"],
        correctAnswer: 0
      });
    }

    // Generic question
    questions.push({
      question: "What's the best way to fix a coding error?",
      options: [
        "Guess randomly until it works",
        "Read the error message and understand what went wrong",
        "Delete all your code and start over",
        "Ask someone else to fix it for you"
      ],
      correctAnswer: 1
    });

    return questions.slice(0, 3);
  };

  const handleQuizComplete = (score) => {
    setAnalytics(prev => ({
      ...prev,
      sessionProgress: Math.min(prev.sessionProgress + 15, 100)
    }));
    activityTracker.trackQuizAnswered();
  };

  const handleDownloadReport = async (format = 'pdf') => {
    try {
      const reportData = {
        language: language,
        user_code: originalUserCode || code, // Use original code that caused the error
        execution_output: runResult?.output || null,
        execution_error: runResult?.error || null,
        ai_explanation: result?.explanation || "No AI explanation available",
        learning_tip: result?.learning_tip || "No learning tip available",
        fixed_code: result?.corrected_code || null,
        gamified_questions: quizQuestions.map(q => q.question) || []
      };

      if (format === 'json') {
        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `codesnap_report_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        activityTracker.trackReportDownloaded();
        alert('Report downloaded successfully!');
        return;
      }

      const response = await downloadReport(reportData);
      const blob = new Blob([response.data], {
        type: response.headers['content-type'] || 'application/pdf'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      const contentDisposition = response.headers['content-disposition'];
      let filename = 'codesnap_report.pdf';

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename=([^;]+)/);
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/"/g, '');
        }
      }

      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      activityTracker.trackReportDownloaded();
      alert('Report downloaded successfully!');
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Failed to download report: ${error.message || 'Please try again.'}`);
    }
  };

  const handleExplain = async () => {
    try {
      setLoading(true);
      setResult(null);

      const response = await explainCode({
        language,
        code,
        error,
      });

      if (!response?.explanation) {
        alert("AI returned invalid response");
        return;
      }

      setResult(response);
      activityTracker.trackErrorExplained();
    } catch (err) {
      console.error(err);
      alert("Backend error. Check FastAPI server.");
    } finally {
      setLoading(false);
    }
  };

  const handleRun = async () => {
    try {
      setRunning(true);
      setRunResult(null);

      // Capture the original user code for the report
      setOriginalUserCode(code);

      const payload = {
        language,
        code: code,
      };

      // Add inputText for Python and JavaScript if they use input functions
      // Preserve newlines for line-by-line input handling
      if (language === 'python' && programInput.trim()) {
        payload.inputText = programInput; // Preserves newlines from textarea
      } else if (language === 'javascript' && programInput.trim()) {
        // Check if JavaScript code uses prompt() or similar input functions
        if (code.includes('prompt(') || code.includes('readline') || code.includes('process.stdin')) {
          payload.inputText = programInput; // Preserves newlines from textarea
        }
      }

      const response = await runCode(payload);

      setRunResult(response);

      // Set error state if execution failed (including disabled languages)
      if (response.error) {
        // For disabled languages (Java/C), set error so AI analysis can still work
        if (response.error.includes("disabled in this demo environment")) {
          setError(response.error);
        } else if (!error.trim()) {
          setError(response.error);
        }
      }

      activityTracker.trackCodeRun();
    } catch (err) {
      console.error(err);
      alert("Backend error. Check FastAPI server.");
    } finally {
      setRunning(false);
    }
  };

  // Update analytics
  useEffect(() => {
    if (error && error.trim()) {
      setAnalytics(prev => ({
        ...prev,
        errorCount: prev.errorCount + 1
      }));
    }
  }, [error]);

  useEffect(() => {
    if (result) {
      setAnalytics(prev => ({
        ...prev,
        fixStatus: 'attempted'
      }));
    }
  }, [result]);

  // Check if there's an error (for conditional button visibility)
  const hasError = error.trim().length > 0;
  const hasSuccess = runResult && !runResult.error && runResult.output;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* TOP BAR */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-3 bg-gray-800/95 backdrop-blur-sm border-b border-gray-700 shadow-lg">
        <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
          CodeSnap
        </h1>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {/* Language Icon Indicator */}
            {language === 'python' && (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#3776AB">
                <path d="M14.38 4.19c.63.15 1.24.44 1.69.94.52.57.83 1.38.8 2.25-.03 1.01-.42 1.96-1.17 2.68-.65.62-1.5 1.05-2.47 1.2-.12.02-.26.02-.38.04v1.5h-.75v-1.58c-.05 0-.1 0-.15-.02H11.9c-.05.02-.1.02-.15.02v1.58h-.75v-1.5c-.12-.02-.26-.02-.38-.04-1.5-.28-2.64-1.16-3.27-2.48-.5-1.05-.45-2.2.1-3.27.5-.98 1.47-1.7 2.6-2.05.93-.29 1.93-.2 2.8.1.7.24 1.3.65 1.78 1.15.1-.65.35-1.28.75-1.8.6-.78 1.5-1.3 2.52-1.52.95-.2 1.95-.1 2.85.3zm-.5 1.3c-.38-.08-.78-.1-1.15.05-.35.13-.65.38-.85.7-.2.3-.3.65-.28 1 .02.4.18.75.42 1.05.25.3.6.5 1 .6.4.1.85.05 1.2-.15.35-.2.6-.5.75-.85.15-.35.2-.75.1-1.15-.1-.4-.35-.75-.7-.95-.2-.1-.42-.15-.64-.15-.22 0-.45.05-.6.15z"/>
                <path d="M13.93 18.23c-.8.2-1.63.3-2.45.3-.82 0-1.65-.1-2.45-.3-.6-.15-1.2-.4-1.68-.75-.48-.35-.85-.8-1.1-1.3-.25-.5-.38-1.05-.4-1.6 0-.55.1-1.1.3-1.6.2-.5.5-.95.9-1.3.4-.35.9-.6 1.45-.75.6-.15 1.25-.2 1.9-.2.65 0 1.3.05 1.9.2.55.15 1.05.4 1.45.75.4.35.7.8.9 1.3.2.5.3 1.05.3 1.6-.02.55-.15 1.1-.4 1.6-.25.5-.62.95-1.1 1.3-.48.35-1.08.6-1.68.75zm-1.15-1.55c.3.08.6.1.9.05.3-.05.6-.15.85-.3.25-.15.45-.35.6-.6.15-.25.25-.55.3-.85.05-.3.05-.6-.05-.9-.1-.3-.3-.55-.55-.75-.25-.2-.55-.35-.9-.4-.35-.05-.7-.05-1.05.05-.35.1-.65.3-.9.55-.25.25-.4.55-.5.9-.1.35-.1.7 0 1.05.1.35.3.65.55.9.25.25.55.4.9.5.2.05.4.1.6.1.2 0 .4-.05.6-.1z"/>
              </svg>
            )}
            {language === 'javascript' && (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#F7DF1E">
                <path d="M0 0h24v24H0V0zm22.034 18.276c-.175-1.095-.888-2.015-3.003-2.873-.736-.345-1.554-.585-1.797-1.14-.091-.33-.105-.51-.046-.705.15-.646.915-.84 1.515-.66.39.12.75.42.976.9 1.034-.676 1.034-.676 1.755-1.125-.27-.42-.404-.601-.586-.78-.63-.705-1.469-1.065-2.834-1.034l-.705.12c-.676.165-1.32.525-1.71 1.005-1.14 1.29-.801 3.54.569 4.471 1.365 1.02 3.361 1.244 3.616 2.205.24 1.17-.87 1.545-1.966 1.41-.811-.18-1.26-.586-1.755-1.336l-1.83 1.051c.21.48.45.689.81 1.109 1.74 1.756 4.08 1.666 5.821.405 1.582-.915 2.156-2.364 1.965-4.17-.05-.31-.23-.705-.42-1.08zm-8.955-7.245h-2.248c0 1.938-.009 3.864-.009 5.805 0 1.232.063 2.363-.138 2.711-.33.689-1.18.601-1.566.48-.396-.196-.597-.466-.83-.855-.063-.105-.11-.196-.127-.196l-1.825 1.125c.305.63.75 1.172 1.324 1.517.855.51 2.004.675 3.207.405.783-.226 1.458-.691 1.811-1.411.51-.93.402-2.07.397-3.346.012-2.054 0-4.109 0-6.179l.004-.056z"/>
              </svg>
            )}
            {language === 'java' && (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#ED8B00">
                <path d="M8.851 18.56s-1.094.748.855.962c2.316.29 3.846.261 6.625-.157.12-.02 1.467-.221 1.728-.157.26.063.612.126.612.126s-.748.374-1.94.561c-1.728.374-3.906.561-6.625.374-2.316-.157-3.846-.374-1.687-.726zm-.855-2.307s-1.336 1.003.748 1.336c2.789.561 5.578.561 9.135.374.374 0 1.003.063 1.003.063s-.561.374-1.336.561c-2.143.561-5.203.748-8.264.374-2.789-.374-4.318-.748-1.94-1.062 2.143-.29 3.672-.374 1.654-.748zm-1.003-2.619s-1.467 1.15.748 1.467c3.205.561 6.41.748 10.431.561.561 0 1.336.126 1.336.126s-.748.374-1.467.561c-2.789.748-6.625.748-9.729.374-2.789-.374-4.318-.748-1.94-1.15 2.143-.374 3.672-.374 1.528-.89zm2.143-2.619c-2.789-.374-4.318-.561-1.94-.89 1.15-.157 3.205-.29 5.578-.29 2.143 0 4.318.157 6.625.374.374.02 1.15.126 1.15.126s-.374.29-1.003.374c-2.789.561-5.578.748-9.135.561-2.789-.157-4.318-.374-1.312-.446zm12.469 2.619s.748-.561-.855-1.15c-2.316-.89-6.625-1.467-10.431-1.15-.374.02-.89.063-.89.063s.29.29.748.374c2.789.748 6.625 1.15 10.431 1.003.374 0 .89-.063.748-.29zm-1.467 2.307c1.728.29 3.205.561 2.789.748-.26.126-2.143.157-3.906.157h-3.205c-2.143 0-3.906-.063-3.205-.29.561-.157 2.316-.374 4.318-.561 1.467-.157 3.205-.157 3.209-.054zm-1.15 2.307c1.15.157 1.728.29 1.467.374-.157.063-1.003.063-2.143.063-1.15 0-2.143-.063-1.728-.157.26-.063 1.15-.157 2.404-.29zm9.729-7.488c.748-1.003-.374-1.467-.748-1.623-.29-.126-1.003-.157-1.003-.157s.748-.29 1.467-.157c.561.126 1.15.374.748.89-.26.29-.374.561-.29.748.126.29.374.374.374.374s-.374-.157-.374-.374c0-.29.374-.561.374-.561s-.29.157-.374.374c-.126.29-.126.561.374.89.748.374.748.748.374 1.15-.29.29-.748.29-1.15.157-.374-.126-.748-.374-.374-.374.29 0 .561.126.748.29.29.29.29.748-.157 1.15-.561.374-1.15.561-1.467.561-.29 0-.561-.126-.748-.29-.29-.29-.29-.748.157-1.15.561-.374 1.15-.561 1.467-.561.29 0 .561.126.748.29z"/>
              </svg>
            )}
            {language === 'c' && (
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#A8B9CC">
                <path d="M16.592 9.196s-.354-3.532-3.641-3.532c-3.688 0-5.644 3.699-5.644 7.108 0 3.511 2.514 7.17 6.067 7.17 3.84 0 5.201-3.411 5.521-4.583h-3.517c-.229.783-1.247 1.653-2.004 1.653-1.849 0-2.84-1.652-2.84-3.531 0-2.514 1.175-4.279 3.243-4.279 1.262 0 1.747.493 2.004 1.02v-.98h2.569v6.642zm5.551 2.726c0-5.705-4.33-6.62-4.33-6.62 0 2.449-1.133 4.204-2.699 5.492-.88.92-1.915 1.657-2.699 2.339 0-.157-.049-3.684.589-5.492 2.514-5.785 6.671-5.413 7.589-4.583.229.157 3.84 2.514 3.84 7.844 0 6.326-4.524 7.01-5.199 7.01-.262 0-.49-.026-.655-.052 0-.52-.07-4.903-.427-6.105z"/>
              </svg>
            )}
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="c">C</option>
            </select>
          </div>

          <button
            onClick={handleRun}
            disabled={running}
            className="flex items-center gap-2 px-5 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white font-semibold rounded-lg disabled:cursor-not-allowed transition-all hover:shadow-lg hover:shadow-green-500/20"
          >
            <Play className="w-4 h-4" />
            {running ? "Running..." : "Run Code"}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA - Scrollable Page */}
      <div className="flex">
        {/* LEFT: Action Tab Sidebar */}
        <div className="w-12 bg-gray-900 border-r border-gray-700 flex flex-col items-center py-3 flex-shrink-0 sticky top-[57px] h-[calc(100vh-57px)]">
          <button
            data-folder-button
            onClick={() => setShowWorkspace(!showWorkspace)}
            className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 transition-all ${
              showWorkspace
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
            title="Toggle Workspace"
          >
            {showWorkspace ? <FolderOpen className="w-5 h-5" /> : <FolderClosed className="w-5 h-5" />}
          </button>
        </div>

        {/* WORKSPACE PANEL (Slides in/out) */}
        <AnimatePresence>
          {showWorkspace && (
            <motion.div
              ref={workspaceRef}
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 256, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="bg-gray-900 border-r border-gray-700 overflow-hidden flex-shrink-0 sticky top-[57px] h-[calc(100vh-57px)]"
            >
              <FileExplorer />
            </motion.div>
          )}
        </AnimatePresence>

        {/* MAIN LAYOUT: Editor (60%) + Right Panel (40%) */}
        <div className="flex-1 flex min-h-[calc(100vh-57px)]">
          {/* LEFT: CODE EDITOR (60% width) */}
          <div className="w-full lg:w-[60%] flex flex-col border-r border-gray-700">
            {/* Secondary Actions - Show ONLY on error, above editor */}
            {hasError && !hasSuccess && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-end gap-3 px-6 py-3 bg-gray-800/50 border-b border-gray-700 flex-shrink-0"
              >
                <button
                  onClick={handleExplain}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-sm font-medium rounded-lg disabled:cursor-not-allowed transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  {loading ? "Analyzing..." : "AI Error Analysis"}
                </button>
                {result && (
                  <button
                    onClick={handleApplyFixedCode}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all"
                  >
                    <Sparkles className="w-4 h-4" />
                    Apply Fixed Code
                  </button>
                )}
              </motion.div>
            )}

            {/* Editor Container - Fixed viewport height, scrolls internally */}
            <div className="h-[calc(100vh-57px)] p-6 flex-shrink-0">
              <div className="h-full bg-gray-800/30 backdrop-blur-sm rounded-xl border border-gray-700/50 shadow-2xl shadow-black/20 overflow-hidden">
                <CodeEditor
                  language={language}
                  code={code}
                  setCode={(newCode) => {
                    setCode(newCode);
                    if (currentFile && updateFileContent) {
                      updateFileContent(currentFile.id, newCode);
                    }
                  }}
                />
              </div>
            </div>

            {/* Error Input Section */}
            {hasError && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="px-6 pb-6 border-t border-gray-700"
              >
                <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-red-500/30">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <span className="text-xs text-gray-400 uppercase tracking-wide">Error Message</span>
                  </div>
                  <textarea
                    value={error}
                    onChange={(e) => setError(e.target.value)}
                    placeholder="Paste your error message here..."
                    className="w-full p-3 bg-gray-900 text-red-400 rounded-lg border border-gray-600 resize-none focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 text-sm font-mono"
                    rows={3}
                  />
                </div>
              </motion.div>
            )}

            {/* AI ANALYSIS SECTION - Below Editor, Accordion Style */}
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="px-6 pb-6 border-t border-gray-700 space-y-4"
              >
                <h2 className="text-lg font-semibold text-purple-400 flex items-center gap-2 pt-4">
                  <Sparkles className="w-5 h-5" />
                  AI Analysis & Explanation
                </h2>

                <div className="space-y-3">
                  <Accordion title="What went wrong?" defaultOpen={true}>
                    <p className="text-gray-200 leading-relaxed">{result.explanation}</p>
                  </Accordion>

                  <Accordion title="AI Suggested Fix">
                    <p className="text-gray-200 leading-relaxed">{result.learning_tip}</p>
                  </Accordion>

                  <Accordion title="Fixed Code">
                    <div className="bg-black/50 rounded-lg p-4 border border-gray-700">
                      <pre className="text-green-300 text-xs font-mono whitespace-pre-wrap break-words">
                        {result.corrected_code}
                      </pre>
                    </div>
                    <button
                      onClick={handleApplyFixedCode}
                      className="mt-3 w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Apply Fixed Code to Editor
                    </button>
                  </Accordion>

                  <Accordion title="Code Changes (Diff)">
                    <div className="space-y-2">
                      <div className="bg-red-900/20 border border-red-500/30 rounded p-2">
                        <div className="text-xs text-red-400 mb-1">Original Code:</div>
                        <pre className="text-red-300 text-xs font-mono whitespace-pre-wrap break-words">{code}</pre>
                      </div>
                      <div className="bg-green-900/20 border border-green-500/30 rounded p-2">
                        <div className="text-xs text-green-400 mb-1">Fixed Code:</div>
                        <pre className="text-green-300 text-xs font-mono whitespace-pre-wrap break-words">{result.corrected_code}</pre>
                      </div>
                    </div>
                  </Accordion>
                </div>
              </motion.div>
            )}

            {/* GAMIFIED LEARNING + REPORT SECTION */}
            {(result || showQuiz) && (
              <div className="px-6 pb-6 border-t border-gray-700">
                <div className="grid grid-cols-1 lg:grid-cols-[60%_40%] gap-6 pt-6">
                  {/* LEFT: Gamified Learning Quiz (60%) */}
                  <div>
                    <h2 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
                      🎮 Gamified Learning
                    </h2>
                    {showQuiz && quizQuestions.length > 0 ? (
                      <MCQQuiz
                        questions={quizQuestions}
                        onComplete={handleQuizComplete}
                      />
                    ) : (
                      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 text-center">
                        <p className="text-gray-400">Complete AI analysis to unlock learning quiz!</p>
                      </div>
                    )}
                  </div>

                  {/* RIGHT: Learning Report Card (40%) */}
                  <div>
                    <h2 className="text-lg font-semibold text-purple-400 mb-4 flex items-center gap-2">
                      📊 Learning Report
                    </h2>
                    <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Language</span>
                          <span className="text-sm font-medium text-white">{language}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Errors Count</span>
                          <span className="text-sm font-medium text-red-400">{analytics.errorCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Fix Status</span>
                          <span className={`text-sm font-medium px-2 py-1 rounded ${
                            analytics.fixStatus === 'fixed' ? 'bg-green-900 text-green-400' :
                            analytics.fixStatus === 'attempted' ? 'bg-yellow-900 text-yellow-400' :
                            'bg-red-900 text-red-400'
                          }`}>
                            {analytics.fixStatus === 'fixed' ? '✅ Fixed' :
                             analytics.fixStatus === 'attempted' ? '⚠️ In Progress' :
                             '❌ Not Started'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-400">Date & Time</span>
                          <span className="text-sm font-medium text-white">
                            {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                          </span>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-700 space-y-2">
                        <button
                          onClick={() => handleDownloadReport('pdf')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-all"
                        >
                          <Download className="w-4 h-4" />
                          Download PDF
                        </button>
                        <button
                          onClick={() => handleDownloadReport('json')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-all"
                        >
                          <FileJson className="w-4 h-4" />
                          Export JSON
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* RIGHT: SIDE PANEL (40% width) - Stable, doesn't scroll with editor */}
          <div className="hidden lg:flex w-[40%] flex-col p-6 bg-gray-800 border-l border-gray-700 space-y-4 overflow-y-auto sticky top-[57px] h-[calc(100vh-57px)]">
            {/* Console Output Card */}
            <div className={`bg-gray-900 rounded-xl p-4 border shadow-lg ${
              runResult?.error ? 'border-red-500/50 shadow-red-500/10' :
              runResult?.output ? 'border-green-500/50 shadow-green-500/10' :
              'border-gray-700'
            }`}>
              <h3 className="text-base font-semibold text-green-400 mb-3 flex items-center gap-2">
                <Play className="w-4 h-4" />
                Console Output
              </h3>

              {!runResult && !running && (
                <p className="text-gray-400 text-sm">
                  Click "Run Code" to see your program's output here!
                </p>
              )}

              {running && (
                <div className="text-center py-4">
                  <p className="text-green-400 text-sm mb-2">Running your code...</p>
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400 mx-auto"></div>
                </div>
              )}

              {runResult && (
                <div className="space-y-3">
                  {runResult.output && (
                    <div className="bg-black/50 rounded-lg p-3 border border-green-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                        <div className="text-green-400 text-xs font-semibold">SUCCESS OUTPUT</div>
                      </div>
                      <pre className="text-green-300 whitespace-pre-wrap break-words font-mono text-sm">{runResult.output}</pre>
                    </div>
                  )}

                  {runResult.error && (
                    <div className="bg-black/50 rounded-lg p-3 border border-red-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-400" />
                        <div className="text-red-400 text-xs font-semibold">ERROR OUTPUT</div>
                      </div>
                      <pre className="text-red-300 whitespace-pre-wrap break-words font-mono text-sm">{runResult.error}</pre>
                    </div>
                  )}

                  {!runResult.output && !runResult.error && (
                    <div className="text-center py-4">
                      <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">✅ Code executed successfully</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Program Input Section - Show for Python only, below Console Output */}
            {language === 'python' && (
              <div className="bg-gray-900 rounded-xl p-4 border border-blue-500/30 shadow-lg">
                <h3 className="text-base font-semibold text-blue-400 mb-3 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  Program Input
                  <span className="text-xs text-gray-500 font-normal">(for input() calls)</span>
                </h3>
                <textarea
                  value={programInput}
                  onChange={(e) => setProgramInput(e.target.value)}
                  placeholder="Enter input values here (one per line if multiple inputs needed)..."
                  className="w-full p-3 bg-gray-800 text-white rounded-lg border border-gray-600 resize-none focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm font-mono"
                  rows={3}
                />
                <p className="text-xs text-gray-500 mt-2">
                  If your Python program uses input(), enter the values here. Each line will be sent as a separate input.
                </p>
              </div>
            )}

            {/* Execution Summary Card */}
            {runResult && (
              <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 shadow-lg">
                <h3 className="text-base font-semibold text-purple-400 mb-3 flex items-center gap-2">
                  Execution Summary
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status</span>
                    <span className={`font-medium ${
                      runResult.error ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {runResult.error ? 'Failed' : 'Success'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Language</span>
                    <span className="font-medium text-white">{language}</span>
                  </div>
                  {runResult.output && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Output Lines</span>
                      <span className="font-medium text-white">{runResult.output.split('\n').length}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Learning Analytics */}
            <LearningAnalytics
              errorCount={analytics.errorCount}
              fixStatus={analytics.fixStatus}
              attempts={analytics.attempts}
              sessionProgress={analytics.sessionProgress}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
