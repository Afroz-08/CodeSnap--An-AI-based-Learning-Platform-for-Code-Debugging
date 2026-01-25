import { useNavigate } from "react-router-dom";

export default function Landing() {
    const navigate = useNavigate();
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 opacity-95" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24 lg:py-28">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-purple-400 via-cyan-400 to-green-400 bg-clip-text text-transparent">
                  CodeSnap
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-300">
                A beginner-friendly coding practice space where you can{" "}
                <span className="text-green-400 font-semibold">run code safely</span>, let{" "}
                <span className="text-purple-400 font-semibold">AI explain errors</span>,{" "}
                <span className="text-green-400 font-semibold">apply AI-fixed code</span>, chat with an{" "}
                <span className="text-cyan-400 font-semibold">AI tutor</span>, and{" "}
                <span className="text-yellow-300 font-semibold">download learning reports</span> to track progress.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <button
                  onClick={() => navigate("/editor")}
                  className="inline-flex items-center justify-center px-8 py-3 text-base sm:text-lg font-semibold text-gray-900 bg-gradient-to-r from-green-400 to-cyan-400 rounded-lg shadow-md hover:shadow-lg hover:scale-[1.02] transition-transform duration-150"
                >
                  Start Coding
                </button>
                <p className="text-sm text-gray-400 max-w-xs">
                  No setup required. Practice Python, JavaScript, Java, and C right in your browser.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-20 bg-gray-900 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-purple-300">Learn by Doing, Not Memorizing</h2>
              <p className="text-base sm:text-lg text-gray-400 max-w-3xl mx-auto">
                CodeSnap guides beginners through the full loop: write code, run it, understand errors,
                fix them with AI, and reflect using analytics and downloadable reports.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {/* Feature 1 */}
              <div className="bg-gray-800/80 rounded-xl p-6 border border-gray-700 hover:border-purple-400/80 transition-colors duration-200">
                <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl">🧠</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">Beginner-Friendly Explanations</h3>
                <p className="text-gray-400 text-sm">
                  AI explains your errors in plain language so you understand{" "}
                  <span className="text-yellow-300">what went wrong</span> and{" "}
                  <span className="text-yellow-300">how to fix it next time</span>.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="bg-gray-800/80 rounded-xl p-6 border border-gray-700 hover:border-green-400/80 transition-colors duration-200">
                <div className="w-11 h-11 bg-gradient-to-br from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl">▶</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">Safe Code Execution Sandbox</h3>
                <p className="text-gray-400 text-sm">
                  Run Python, JavaScript, Java, and C programs without touching your local setup.
                  See <span className="text-green-300">live output</span> and error messages instantly.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="bg-gray-800/80 rounded-xl p-6 border border-gray-700 hover:border-purple-400/80 transition-colors duration-200">
                <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl">✨</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">AI-Fixed Code with Reasoning</h3>
                <p className="text-gray-400 text-sm">
                  Compare your original code to AI-generated fixes, with{" "}
                  <span className="text-yellow-300">line-by-line explanations</span> and best practices.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-gray-800/80 rounded-xl p-6 border border-gray-700 hover:border-cyan-400/80 transition-colors duration-200">
                <div className="w-11 h-11 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl">💬</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">Always-On AI Tutor</h3>
                <p className="text-gray-400 text-sm">
                  Ask free-text questions about{" "}
                  <span className="text-cyan-300">syntax, concepts, logic, and errors</span> –
                  just like chatting with a mentor.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-gray-800/80 rounded-xl p-6 border border-gray-700 hover:border-yellow-400/80 transition-colors duration-200">
                <div className="w-11 h-11 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl">📊</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">Learning Progress & Analytics</h3>
                <p className="text-gray-400 text-sm">
                  Track errors found, fixes applied, and overall{" "}
                  <span className="text-green-300">session progress</span> to see your growth over time.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-gray-800/80 rounded-xl p-6 border border-gray-700 hover:border-purple-400/80 transition-colors duration-200">
                <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-cyan-500 rounded-lg flex items-center justify-center mb-4">
                  <span className="text-xl">📥</span>
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">Downloadable Learning Reports</h3>
                <p className="text-gray-400 text-sm">
                  Export structured PDF reports summarizing{" "}
                  <span className="text-yellow-300">code, errors, explanations, and quiz questions</span>
                  for revision and sharing.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-16 sm:py-20 bg-gray-900 border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold mb-3 text-purple-300">How CodeSnap Guides You</h2>
              <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto">
                Follow a simple loop to build intuition: write → run → debug → reflect → repeat.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {/* Step 1 */}
              <div className="relative h-full">
                <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-xl p-6 sm:p-8 text-center h-full shadow-md">
                  <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-bold text-white">
                    1
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">Write or Import Code</h3>
                  <p className="text-sm text-gray-100">
                    Start with the built-in examples, type your own code, or import files into the workspace.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="relative h-full">
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 sm:p-8 text-center h-full shadow-md">
                  <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-bold text-white">
                    2
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">Run & Observe Output</h3>
                  <p className="text-sm text-gray-100">
                    Execute your program in a safe sandbox and see real-time{" "}
                    <span className="text-green-200">output</span> and{" "}
                    <span className="text-red-200">error messages</span>.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="relative h-full">
                <div className="bg-gradient-to-br from-green-600 to-emerald-600 rounded-xl p-6 sm:p-8 text-center h-full shadow-md">
                  <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-bold text-white">
                    3
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">Get AI Help</h3>
                  <p className="text-sm text-gray-100">
                    Ask the AI to explain errors, propose fixes, and answer tutor-style questions
                    about the concepts behind the bug.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="relative h-full">
                <div className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-6 sm:p-8 text-center h-full shadow-md">
                  <div className="w-14 h-14 bg-white/15 rounded-full flex items-center justify-center mx-auto mb-5 text-2xl font-bold text-white">
                    4
                  </div>
                  <h3 className="text-xl font-semibold mb-3 text-white">Reflect & Export</h3>
                  <p className="text-sm text-gray-100">
                    Review analytics, answer quiz questions, and download a{" "}
                    <span className="text-yellow-200">report</span> to reflect on what you learned.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-gray-900 border-t border-gray-800 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-purple-400 to-cyan-400 bg-clip-text text-transparent">
                  CodeSnap
                </h3>
                <p className="text-gray-400 text-sm mb-3">
                  An educational platform that helps beginners practice coding, understand their mistakes,
                  and build confidence with the support of AI.
                </p>
                <p className="text-xs text-gray-500 italic">
                  Educational use only. Always review AI-generated code before using it in real projects.
                </p>
              </div>
              <div>
                <h4 className="text-base font-semibold mb-3 text-gray-200">Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-300">React</span>
                  <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-300">Vite</span>
                  <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-300">Tailwind CSS</span>
                  <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-300">FastAPI</span>
                  <span className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-300">Python</span>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 pt-6 text-center text-gray-500 text-xs">
              <p>&copy; {new Date().getFullYear()} CodeSnap. Built as a learning project.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }
  