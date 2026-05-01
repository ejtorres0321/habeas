"use client";

import { useState, useRef, useEffect, type ReactNode, type FormEvent } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface DocumentAIPanelProps {
  documentText: string;
  caseData: Record<string, string>;
  caseId: string;
  visible: boolean;
  onClose: () => void;
  onDataUpdate: () => void;
  onLocate: (ref: string) => void;
}

const FIELD_LABELS: Record<string, string> = {
  economicHarm: "Economic Harm",
  familialHarm: "Familial Harm",
  familyDetails: "Family Details",
  spouseInfo: "Spouse Information",
  childrenInfo: "Children Information",
  usCitizenFamilyMembers: "U.S. Citizen Family Members",
  employmentDetails: "Employment Details",
  criminalHistoryDetails: "Criminal History Details",
  apprehensionCircumstance: "Apprehension Circumstance",
};

// --- Markdown rendering ---

// Replace special Unicode with readable equivalents for display
function cleanText(text: string): string {
  return text
    .replace(/\u00B6\u00B6/g, "paras. ")   // ¶¶ → paras.
    .replace(/\u00B6/g, "para. ")           // ¶ → para.
    .replace(/\u00A7\u00A7/g, "Sections ")  // §§ → Sections
    .replace(/\u00A7/g, "Section ")         // § → Section
    .replace(/\u2019/g, "\u2019")           // keep smart quotes
    .replace(/\u201C/g, "\u201C")
    .replace(/\u201D/g, "\u201D");
}

function formatInline(text: string, onLocate?: (ref: string) => void): ReactNode {
  const cleaned = cleanText(text);
  // Match **bold**, *italic*, `code`, "quoted" references, and [LOCATE:ref]
  const parts = cleaned.split(/(\*\*.*?\*\*|\*[^*]+?\*|`[^`]+?`|\u201C[^\u201D]+\u201D|\[LOCATE:[^\]]+\])/g);
  return parts.map((part, i) => {
    // LOCATE marker → inline locate button
    const locateMatch = part.match(/^\[LOCATE:([^\]]+)\]$/);
    if (locateMatch) {
      if (!onLocate) return null;
      const ref = locateMatch[1];
      return (
        <button
          key={i}
          onClick={() => onLocate(ref)}
          className="inline-flex items-center ml-1.5 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[11px] hover:bg-amber-200 transition-colors font-medium gap-1 align-middle"
          title="Show in document"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Locate
        </button>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("*") && part.endsWith("*") && !part.startsWith("**")) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="bg-gray-200/70 text-indigo-700 px-1 py-0.5 rounded text-xs font-mono">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("\u201C") && part.endsWith("\u201D")) {
      return <span key={i} className="text-gray-600 italic">{part}</span>;
    }
    return <span key={i}>{part}</span>;
  });
}

// Detect if a line is an all-caps heading (e.g. "ISSUES IDENTIFIED AND RECOMMENDATIONS")
function isAllCapsHeading(line: string): boolean {
  const stripped = line.replace(/[^A-Za-z ]/g, "").trim();
  return stripped.length > 3 && stripped === stripped.toUpperCase() && /[A-Z]/.test(stripped);
}

// Detect bullet-like prefixes: "–", "—", "-", "•"
function isBullet(line: string): string | null {
  const m = line.match(/^[\u2013\u2014\-\u2022]\s+(.*)$/);
  return m ? m[1] : null;
}

// Detect letter-prefix items: "a.", "b.", "a)", "b)"
function isLetterItem(line: string): string | null {
  const m = line.match(/^([a-z])[.)]\s+(.*)$/);
  return m ? m[2] : null;
}

// Detect numbered items: "1.", "2.", "12."
function isNumberedItem(line: string): string | null {
  const m = line.match(/^\d+[.)]\s+(.*)$/);
  return m ? m[1] : null;
}

function MarkdownContent({ text, onLocate }: { text: string; onLocate?: (ref: string) => void }) {
  if (!text) return null;

  const lines = text.split("\n");
  const elements: ReactNode[] = [];
  let bulletItems: string[] = [];
  let key = 0;

  const fmt = (t: string) => formatInline(t, onLocate);

  const flushBullets = () => {
    if (bulletItems.length === 0) return;
    elements.push(
      <ul key={key++} className="ml-4 mb-3 space-y-1.5">
        {bulletItems.map((item, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-indigo-400 mt-0.5 flex-shrink-0">&#x2022;</span>
            <span className="leading-relaxed">{fmt(item)}</span>
          </li>
        ))}
      </ul>
    );
    bulletItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();

    // Empty line — flush and add spacing
    if (trimmed === "") {
      flushBullets();
      continue;
    }

    // Markdown headings: ###, ##, #
    if (trimmed.startsWith("### ")) {
      flushBullets();
      elements.push(
        <h4 key={key++} className="font-semibold mt-4 mb-1.5 text-gray-900 text-sm">
          {fmt(trimmed.slice(4))}
        </h4>
      );
      continue;
    }
    if (trimmed.startsWith("## ")) {
      flushBullets();
      elements.push(
        <h3 key={key++} className="font-bold mt-5 mb-2 text-gray-900 text-sm border-b border-gray-200 pb-1">
          {fmt(trimmed.slice(3))}
        </h3>
      );
      continue;
    }
    if (trimmed.startsWith("# ")) {
      flushBullets();
      elements.push(
        <h2 key={key++} className="font-bold mt-5 mb-2 text-gray-900 text-base border-b border-gray-200 pb-1">
          {fmt(trimmed.slice(2))}
        </h2>
      );
      continue;
    }

    // All-caps heading (AI often produces these without # markers)
    if (isAllCapsHeading(trimmed)) {
      flushBullets();
      elements.push(
        <h3 key={key++} className="font-bold mt-5 mb-2 text-gray-900 text-sm tracking-wide border-b border-gray-200 pb-1">
          {fmt(trimmed)}
        </h3>
      );
      continue;
    }

    // Bold-only line that may contain [LOCATE]: **Some heading** [LOCATE:ref]
    // Also handles bold-only without LOCATE
    if (/^\*\*[^*]+\*\*(\s*\[LOCATE:[^\]]+\])?\s*$/.test(trimmed)) {
      flushBullets();
      elements.push(
        <h4 key={key++} className="font-semibold mt-4 mb-1.5 text-gray-900 text-sm">
          {fmt(trimmed)}
        </h4>
      );
      continue;
    }

    // Bullet lines: "– text", "— text", "• text"
    const bullet = isBullet(trimmed);
    if (bullet !== null) {
      bulletItems.push(bullet);
      continue;
    }

    // Markdown list markers: "- text", "* text"
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      bulletItems.push(trimmed.slice(2));
      continue;
    }

    // Letter items: "a. text", "b) text"
    const letterContent = isLetterItem(trimmed);
    if (letterContent !== null) {
      flushBullets();
      const letter = trimmed[0];
      elements.push(
        <div key={key++} className="flex gap-2 ml-4 mb-1.5">
          <span className="text-indigo-500 font-medium flex-shrink-0 w-5">{letter}.</span>
          <span className="leading-relaxed">{fmt(letterContent)}</span>
        </div>
      );
      continue;
    }

    // Numbered items: "1. text", "2. text"
    const numContent = isNumberedItem(trimmed);
    if (numContent !== null) {
      flushBullets();
      const num = trimmed.match(/^(\d+)/)?.[1];
      elements.push(
        <div key={key++} className="flex gap-2 ml-2 mb-1.5">
          <span className="text-gray-400 font-medium flex-shrink-0 w-6 text-right">{num}.</span>
          <span className="leading-relaxed">{fmt(numContent)}</span>
        </div>
      );
      continue;
    }

    // Regular paragraph
    flushBullets();
    elements.push(
      <p key={key++} className="mb-2.5 leading-relaxed">
        {fmt(trimmed)}
      </p>
    );
  }

  flushBullets();
  return <div className="space-y-0">{elements}</div>;
}

// --- Fix block parsing ---

interface FixBlock {
  field: string;
  value: string;
}

interface Segment {
  type: "text" | "fix";
  content: string;
  fix?: FixBlock;
}

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  const regex = /\[APPLY_FIX field="(\w+)"\]\n?([\s\S]*?)\n?\[\/APPLY_FIX\]/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }
    segments.push({
      type: "fix",
      content: match[2].trim(),
      fix: { field: match[1], value: match[2].trim() },
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments;
}

// --- Fix button component ---

function FixButton({
  fix,
  caseId,
  onApplied,
}: {
  fix: FixBlock;
  caseId: string;
  onApplied: () => void;
}) {
  const [status, setStatus] = useState<"idle" | "applying" | "applied" | "error">("idle");

  async function apply() {
    setStatus("applying");
    try {
      const res = await fetch(`/api/cases/${caseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [fix.field]: fix.value }),
      });
      if (!res.ok) throw new Error("Update failed");
      setStatus("applied");
      onApplied();
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="my-3 border border-indigo-200 rounded-lg bg-indigo-50/50 overflow-hidden">
      <div className="px-3 py-1.5 bg-indigo-100/60 border-b border-indigo-200 flex items-center justify-between">
        <span className="text-xs font-medium text-indigo-700">
          Suggested fix for {FIELD_LABELS[fix.field] || fix.field}
        </span>
        {status === "idle" && (
          <button
            onClick={apply}
            className="px-2.5 py-1 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 transition-colors font-medium"
          >
            Apply Fix
          </button>
        )}
        {status === "applying" && (
          <span className="text-xs text-indigo-500">Applying...</span>
        )}
        {status === "applied" && (
          <span className="text-xs text-green-600 font-medium flex items-center gap-1">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Applied
          </span>
        )}
        {status === "error" && (
          <button onClick={apply} className="text-xs text-red-600 hover:text-red-800 font-medium">
            Failed — Retry
          </button>
        )}
      </div>
      <div className="px-3 py-2 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {fix.value}
      </div>
    </div>
  );
}

// --- Message rendering ---

function MessageContent({
  content,
  caseId,
  onFixApplied,
  onLocate,
}: {
  content: string;
  caseId: string;
  onFixApplied: () => void;
  onLocate: (ref: string) => void;
}) {
  const segments = parseSegments(content);

  return (
    <>
      {segments.map((seg, i) => {
        if (seg.type === "fix" && seg.fix) {
          return (
            <FixButton
              key={i}
              fix={seg.fix}
              caseId={caseId}
              onApplied={onFixApplied}
            />
          );
        }
        return <MarkdownContent key={i} text={seg.content} onLocate={onLocate} />;
      })}
    </>
  );
}

// --- Main panel ---

export default function DocumentAIPanel({
  documentText,
  caseData,
  caseId,
  visible,
  onClose,
  onDataUpdate,
  onLocate,
}: DocumentAIPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (visible && !hasReviewed && documentText) {
      runReview();
    }
  }, [visible, documentText, hasReviewed]);

  async function streamResponse(
    body: Record<string, unknown>,
    prependMessages: ChatMessage[]
  ) {
    setIsLoading(true);

    const placeholder: ChatMessage[] = [
      ...prependMessages,
      { role: "assistant", content: "" },
    ];
    setMessages(placeholder);

    try {
      const response = await fetch("/api/document-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(response.statusText);

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let text = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setMessages([
          ...prependMessages,
          { role: "assistant", content: text },
        ]);
      }
    } catch {
      setMessages([
        ...prependMessages,
        {
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  async function runReview() {
    setHasReviewed(true);
    await streamResponse({ documentText, caseData, mode: "review" }, []);
  }

  function handleReReview() {
    setMessages([]);
    setHasReviewed(false);
  }

  async function sendMessage(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");

    const updatedMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: userMessage },
    ];

    const chatHistory = updatedMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    await streamResponse(
      { documentText, caseData, messages: chatHistory, mode: "chat" },
      updatedMessages
    );
  }

  if (!visible) return null;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-blue-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-gray-800">
              AI Document Assistant
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Powered by o3 (review) &middot; o4-mini (chat)
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleReReview}
              disabled={isLoading}
              title="Re-run review"
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded disabled:opacity-50"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
            <button
              onClick={onClose}
              title="Close panel"
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-white/60 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 text-sm mt-12">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <p>Analyzing document with o3...</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i}>
            {msg.role === "user" ? (
              <div className="flex justify-end">
                <div className="bg-blue-600 text-white rounded-2xl rounded-br-md px-4 py-2 max-w-[85%] text-sm">
                  {msg.content}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl rounded-bl-md px-4 py-3 text-[13px] text-gray-700 border border-gray-100 font-sans leading-relaxed">
                {msg.content ? (
                  <MessageContent
                    content={msg.content}
                    caseId={caseId}
                    onFixApplied={onDataUpdate}
                    onLocate={onLocate}
                  />
                ) : (
                  <div className="flex items-center gap-1.5 text-gray-400 py-1">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={sendMessage}
        className="flex-shrink-0 p-3 border-t border-gray-200 bg-white"
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about the document..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
