import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, FolderOpen, FolderClosed, Sparkles, Download, FileJson, CheckCircle, XCircle, AlertCircle } from "lucide-react";
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

  // Generate MCQ questions
  useEffect(() => {
    if (result && error) {
      const questions = generateQuizQuestions(error, result.corrected_code, result.explanation);
      setQuizQuestions(questions);
      setShowQuiz(true);
    }
  }, [result, error]);

  const generateQuizQuestions = (error, fixedCode, explanation) => {
    const questions = [];

    if (error.toLowerCase().includes('nameerror')) {
      questions.push({
        question: "What type of error occurs when you try to use a variable that hasn't been defined?",
        options: ["SyntaxError", "NameError", "TypeError", "ValueError"],
        correctAnswer: 1
      });
    }

    if (error.toLowerCase().includes('syntaxerror')) {
      questions.push({
        question: "What type of error occurs when your code has incorrect Python syntax?",
        options: ["NameError", "SyntaxError", "IndentationError", "ImportError"],
        correctAnswer: 1
      });
    }

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

    if (fixedCode.includes('=')) {
      questions.push({
        question: "What operator is commonly used to assign values to variables in Python?",
        options: ["==", "=", "!=", "=>"],
        correctAnswer: 1
      });
    }

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

      let codeToExecute = code;

      // Handle Python input() calls
      if (language === 'python' && code.includes('input(')) {
        codeToExecute = code.replace(/input\([^)]*\)/g, '"5"');
      }

      const response = await runCode({
        language,
        code: codeToExecute,
      });

      setRunResult(response);

      if (response.error && !error.trim()) {
        setError(response.error);
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
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
          >
            <option value="python">🐍 Python</option>
            <option value="javascript">🟨 JavaScript</option>
            <option value="java">☕ Java</option>
            <option value="c">⚙️ C</option>
          </select>

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
