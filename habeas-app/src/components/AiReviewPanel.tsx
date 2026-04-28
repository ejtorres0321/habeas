"use client";

import { CaseFormData } from "@/lib/caseFields";

export interface AiSuggestion {
  section: string;
  field: string;
  type: "error" | "suggestion";
  message: string;
  suggestedValue?: string;
}

interface AiReviewPanelProps {
  suggestions: AiSuggestion[];
  loading: boolean;
  onAccept: (field: keyof CaseFormData, value: string) => void;
  onClose: () => void;
  onContinue?: () => void;
  continueLabel?: string;
}

export default function AiReviewPanel({
  suggestions,
  loading,
  onAccept,
  onClose,
  onContinue,
  continueLabel,
}: AiReviewPanelProps) {
  const errors = suggestions.filter((s) => s.type === "error");
  const improvements = suggestions.filter((s) => s.type === "suggestion");

  const grouped = new Map<string, AiSuggestion[]>();
  for (const s of suggestions) {
    const list = grouped.get(s.section) || [];
    list.push(s);
    grouped.set(s.section, list);
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col max-h-[calc(100vh-120px)]">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2a5 5 0 0 1 5 5c0 2-1.5 3.5-3 4.5V13a2 2 0 0 1-4 0v-1.5C8.5 10.5 7 9 7 7a5 5 0 0 1 5-5z" />
            <path d="M10 17h4" /><path d="M10 21h4" /><path d="M11 17v4" /><path d="M13 17v4" />
          </svg>
          <h3 className="text-white font-semibold text-sm">AI Review</h3>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white text-lg leading-none">&times;</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mb-3" />
            <p className="text-sm">Reviewing your petition...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-2">&#10003;</div>
            <p className="text-green-700 font-medium">Looks good!</p>
            <p className="text-sm text-gray-500 mt-1">No issues found.</p>
          </div>
        ) : (
          <>
            {errors.length > 0 && (
              <div className="text-xs font-medium text-red-600 uppercase tracking-wider">
                {errors.length} {errors.length === 1 ? "Error" : "Errors"}
              </div>
            )}
            {improvements.length > 0 && (
              <div className="text-xs font-medium text-amber-600 uppercase tracking-wider">
                {improvements.length} {improvements.length === 1 ? "Suggestion" : "Suggestions"}
              </div>
            )}

            {[...grouped.entries()].map(([section, items]) => (
              <div key={section}>
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">{section}</h4>
                <div className="space-y-2">
                  {items.map((s, i) => (
                    <div
                      key={`${s.field}-${i}`}
                      className={`rounded-lg border p-3 text-sm ${
                        s.type === "error"
                          ? "bg-red-50 border-red-200"
                          : "bg-amber-50 border-amber-200"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span
                          className={`inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            s.type === "error"
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {s.type}
                        </span>
                        <p className="flex-1 text-gray-700">{s.message}</p>
                      </div>
                      {s.suggestedValue && (
                        <div className="mt-2">
                          <p className="text-xs text-gray-500 mb-1">Suggested text:</p>
                          <p className="text-xs text-gray-600 bg-white rounded p-2 border border-gray-200 leading-relaxed">
                            {s.suggestedValue}
                          </p>
                          <button
                            onClick={() => onAccept(s.field as keyof CaseFormData, s.suggestedValue!)}
                            className="mt-2 px-3 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-md hover:bg-purple-100 transition-colors"
                          >
                            Accept Suggestion
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {!loading && (
        <div className="border-t border-gray-200 px-4 py-3 flex gap-2">
          {onContinue && (
            <button
              onClick={onContinue}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {continueLabel || "Continue"}
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
