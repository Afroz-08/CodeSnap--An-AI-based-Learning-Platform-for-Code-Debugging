import { useEffect, useState } from "react";

export default function AITutor() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMessages([
      {
        id: 1,
        from: "tutor",
        text: "Hi! I'm your CodeSnap AI tutor. Ask me any programming or debugging concept question.",
      },
    ]);
  }, []);

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userText = input.trim();
    const userMessage = {
      id: Date.now(),
      from: "user",
      text: userText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");

    try {
      setLoading(true);

      const res = await fetch("http://127.0.0.1:8000/api/tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: userText }),
      });

      const data = await res.json();

      const tutorMessage = {
        id: Date.now() + 1,
        from: "tutor",
        text:
          data?.answer ||
          "I couldn't generate a helpful answer right now. Please try again in a moment.",
      };

      setMessages((prev) => [...prev, tutorMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 2,
          from: "tutor",
          text:
            "I couldn't reach the AI tutor backend. Make sure the FastAPI server is running on http://127.0.0.1:8000.",
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
      {/* Floating button (global) */}
      <button
        type="button"
        onClick={handleToggle}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-cyan-500 px-4 py-3 text-sm font-semibold text-black shadow-lg shadow-cyan-500/40 hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300"
      >
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/20 text-xs font-bold">
          ?
        </span>
        <span>AI Tutor</span>
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-20 right-6 z-50 flex h-96 w-80 flex-col overflow-hidden rounded-xl border border-gray-700 bg-gray-900 shadow-2xl">
          <div className="flex items-center justify-between border-b border-gray-700 bg-gray-800 px-3 py-2">
            <div>
              <p className="text-sm font-semibold text-cyan-400">
                CodeSnap Tutor
              </p>
              <p className="text-xs text-gray-400">
                Ask about programming concepts or debugging ideas
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              className="rounded-full p-1 text-gray-400 hover:bg-gray-700 hover:text-gray-100"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto bg-gray-900 px-3 py-2 text-sm">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex ${
                  m.from === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] whitespace-pre-line rounded-lg px-3 py-2 ${
                    m.from === "user"
                      ? "bg-cyan-500 text-black"
                      : "bg-gray-800 text-gray-100 border border-gray-700"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {loading && (
              <p className="text-xs text-gray-400">Tutor is thinking…</p>
            )}
          </div>

          <div className="border-t border-gray-700 bg-gray-900 px-3 py-2">
            <textarea
              rows={2}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask a beginner-friendly programming question..."
              className="mb-2 w-full resize-none rounded-md border border-gray-700 bg-gray-900 px-2 py-1 text-xs text-gray-100 placeholder:text-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={loading}
              className="w-full rounded-md bg-cyan-500 px-3 py-1.5 text-xs font-semibold text-black hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Asking tutor..." : "Ask Tutor"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}

