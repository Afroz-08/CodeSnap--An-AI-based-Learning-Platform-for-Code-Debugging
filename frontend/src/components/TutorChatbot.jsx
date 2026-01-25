import { useEffect, useState, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";
import { useEditor } from "../contexts/EditorContext";

// Tutor API function
const tutorChat = async (message, language = "general") => {
  const res = await fetch("http://127.0.0.1:8000/api/tutor", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message,
      language,
    }),
  });
  if (!res.ok) {
    throw new Error(`Tutor API failed with status ${res.status}`);
  }
  return res.json();
};

export default function TutorChatbot() {
  const { editorState } = useEditor();
  const activeLanguage = useMemo(() => editorState?.language || "general", [editorState]);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]); // Starts empty, resets on refresh
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
      requestAnimationFrame(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      });
    }
  }, [messages, isOpen]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMessage = {
      id: Date.now(),
      from: "user",
      text: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = trimmed;
    setInput("");

    try {
      setLoading(true);

      const res = await tutorChat(currentInput, activeLanguage);

      const tutorMessage = {
        id: Date.now() + 1,
        from: "tutor",
        text: res?.reply || "I'm sorry, I couldn't generate a response right now. Please try rephrasing your question.",
      };

      setMessages((prev) => [...prev, tutorMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          from: "tutor",
          text: "I couldn't reach the AI tutor service. Make sure the FastAPI server is running on http://127.0.0.1:8000.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        type="button"
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-3 text-sm font-semibold text-black shadow-lg shadow-cyan-500/40 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <MessageCircle className="w-5 h-5" />
        <span>AI Tutor</span>
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 flex h-[500px] w-96 flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <Bot className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-cyan-400">CodeSnap Tutor</p>
                  <p className="text-xs text-gray-400">Ask about programming concepts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 hover:text-gray-100 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto bg-gray-900 px-4 py-4 space-y-4">
              {messages.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center justify-center h-full text-center px-4"
                >
                  <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center mb-4">
                    <Bot className="w-8 h-8 text-cyan-400" />
                  </div>
                  <p className="text-gray-300 text-sm mb-1">Hi 👋 I'm your AI Tutor</p>
                  <p className="text-gray-400 text-xs">Ask me about your code, concepts, or programming questions</p>
                </motion.div>
              ) : (
                messages.map((m, index) => (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 10, x: m.from === "user" ? 20 : -20 }}
                    animate={{ opacity: 1, y: 0, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex ${m.from === "user" ? "justify-end" : "justify-start"} gap-2`}
                  >
                    {m.from === "tutor" && (
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <Bot className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-lg px-3 py-2 ${
                        m.from === "user"
                          ? "bg-cyan-500 text-black"
                          : "bg-gray-800 text-gray-100 border border-gray-700"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-line leading-relaxed">{m.text}</p>
                    </div>
                    {m.from === "user" && (
                      <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0 mt-1">
                        <User className="w-3.5 h-3.5 text-gray-400" />
                      </div>
                    )}
                  </motion.div>
                ))
              )}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-gray-400 text-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center">
                    <Bot className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <div className="bg-gray-800 rounded-lg px-3 py-2 border border-gray-700">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }}></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }}></div>
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-700 bg-gray-800 px-4 py-3">
              <div className="flex gap-2">
                <textarea
                  ref={inputRef}
                  rows={2}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask me anything about programming..."
                  className="flex-1 resize-none rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 transition-all"
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-gray-700 disabled:cursor-not-allowed text-black rounded-lg transition-all flex items-center justify-center"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
