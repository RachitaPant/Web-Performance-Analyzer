"use client";
import { useEffect, useRef, useState } from "react";
import { Sparkles, Send, RotateCcw } from "lucide-react";
import type { ChatTurn } from "@/lib/insights";
import type { Report } from "@/lib/report";

const SUGGESTIONS = [
  "What's the single biggest fix?",
  "Why is my LCP slow?",
  "How do real users experience this page?",
];

// Matches the server's cap (MAX_TURNS in /api/chat).
const MAX_TURNS = 20;

type Message = ChatTurn & { error?: boolean };

// Chat grounded in the current report; answers stream in as they're generated.
const AskAi: React.FC<{ report: Report }> = ({ report }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // A different report starts a fresh conversation.
  const reportKey = report.fetchedAt + report.url + report.strategy;
  const [activeKey, setActiveKey] = useState(reportKey);
  if (reportKey !== activeKey) {
    abortRef.current?.abort();
    setActiveKey(reportKey);
    setMessages([]);
  }

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const ask = async (question: string) => {
    const text = question.trim();
    if (!text || streaming) return;

    // Failed turns aren't sent back to the model.
    const history: ChatTurn[] = [...messages.filter((m) => !m.error), { role: "user", content: text }];
    setMessages([...messages, { role: "user", content: text }, { role: "assistant", content: "" }]);
    setInput("");
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;
    const setLast = (update: (m: Message) => Message) =>
      setMessages((prev) => [...prev.slice(0, -1), update(prev[prev.length - 1])]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report, messages: history }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error ?? "Couldn't get an answer. Please try again.");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setLast((m) => ({ ...m, content: m.content + chunk }));
      }
    } catch (err) {
      if (controller.signal.aborted) return;
      const message = err instanceof Error ? err.message : "Something went wrong.";
      // Drop the unanswered question from the history the model sees; show the error instead.
      setMessages((prev) => [
        ...prev.slice(0, -2),
        { ...prev[prev.length - 2], error: true },
        { role: "assistant", content: message, error: true },
      ]);
    } finally {
      if (abortRef.current === controller) setStreaming(false);
    }
  };

  const atLimit = messages.length >= MAX_TURNS - 1;

  return (
    <div className="dash-card animate-fade-up p-4 flex flex-col h-[28rem]" style={{ animationDelay: "160ms" }}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-white flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-pink-400" /> Ask about this report
        </h3>
        {messages.length > 0 && !streaming && (
          <button
            type="button"
            onClick={() => setMessages([])}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Start a new conversation"
            title="New conversation"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto space-y-3 pr-1" aria-live="polite">
        {messages.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-gray-400">Answers use only this audit&apos;s data. Try:</p>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => ask(s)}
                className="block w-full text-left rounded-lg border border-blue-500/20 px-3 py-2 text-xs text-blue-200 hover:border-blue-400/50 hover:bg-blue-500/10 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={`max-w-[90%] whitespace-pre-wrap rounded-lg px-3 py-2 text-xs leading-relaxed ${
                  m.role === "user"
                    ? "bg-pink-500/20 text-pink-50"
                    : m.error
                      ? "bg-red-500/10 text-red-300"
                      : "bg-blue-950/50 text-gray-200"
                }`}
              >
                {m.content || (streaming && i === messages.length - 1 ? <span className="text-gray-500">Thinking…</span> : null)}
              </div>
            </div>
          ))
        )}
      </div>

      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={1000}
          disabled={streaming || atLimit}
          aria-label="Ask a question about this report"
          placeholder={atLimit ? "Conversation limit reached — start a new one" : "Ask a question…"}
          className="flex-1 min-w-0 px-3 py-2 text-sm rounded-lg bg-white/5 text-white border border-white/15 placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-pink-500/50 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={streaming || atLimit || !input.trim()}
          aria-label="Send"
          className="rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 px-3 text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
};

export default AskAi;
