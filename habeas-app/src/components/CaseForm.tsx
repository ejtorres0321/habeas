"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { CaseFormData, formSections } from "@/lib/caseFields";
import { facilities, getFacilityAddress } from "@/lib/facilities";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import { immigrationCourts } from "@/lib/immigrationCourts";
import AiReviewPanel, { AiSuggestion } from "@/components/AiReviewPanel";

interface CaseFormProps {
  initialData: CaseFormData;
  caseId?: string;
}

export default function CaseForm({ initialData, caseId }: CaseFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState<CaseFormData>(initialData);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // AI Review state
  const [aiSuggestions, setAiSuggestions] = useState<AiSuggestion[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [pendingNavigate, setPendingNavigate] = useState<string | null>(null);
  const savedCaseIdRef = useRef<string | null>(caseId || null);

  const isEdit = !!caseId;

  useEffect(() => {
    if (formData.detentionDate) {
      const months = calculateMonthsDetained(formData.detentionDate);
      if (months !== formData.monthsDetained) {
        setFormData((prev) => ({ ...prev, monthsDetained: months }));
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function calculateMonthsDetained(dateStr: string): string {
    if (!dateStr) return "";
    const detention = new Date(dateStr);
    const now = new Date();
    const months =
      (now.getFullYear() - detention.getFullYear()) * 12 +
      (now.getMonth() - detention.getMonth());
    return months >= 0 ? String(months) : "0";
  }

  function handleChange(key: keyof CaseFormData, value: string) {
    setFormData((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "detentionDate") {
        next.monthsDetained = calculateMonthsDetained(value);
      }
      if (key === "facilityName") {
        const addr = getFacilityAddress(value);
        if (addr) next.facilityAddress = addr;
      }
      return next;
    });
  }

  async function triggerAiReview(data: CaseFormData) {
    setAiLoading(true);
    setShowAiPanel(true);
    setAiSuggestions([]);
    try {
      const res = await fetch("/api/ai-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const result = await res.json();
        setAiSuggestions(result.suggestions || []);
      }
    } catch {
      // Silently fail — AI review is non-blocking
    } finally {
      setAiLoading(false);
    }
  }

  async function saveCase(data: CaseFormData): Promise<string | null> {
    const url = isEdit ? `/api/cases/${caseId}` : "/api/cases";
    const method = isEdit ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to save case");
    const saved = await res.json();
    savedCaseIdRef.current = saved._id;
    return saved._id;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // no-op — form submission is handled by Save & Review button
  }

  async function handleSaveAndReview() {
    setSaving(true);
    setError("");

    try {
      const id = await saveCase(formData);
      setPendingNavigate(`/cases/${id}/preview`);
      triggerAiReview(formData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function handleAcceptSuggestion(field: keyof CaseFormData, value: string) {
    handleChange(field, value);
    setAiSuggestions((prev) => prev.filter((s) => !(s.field === field && s.suggestedValue === value)));
  }

  async function handleContinue() {
    // Auto-save if suggestions were accepted (form data may have changed)
    if (savedCaseIdRef.current) {
      try {
        await fetch(`/api/cases/${savedCaseIdRef.current}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } catch {
        // Best-effort save
      }
    }
    if (pendingNavigate) {
      router.push(pendingNavigate);
    }
  }

  return (
    <div className="flex gap-6 max-w-7xl mx-auto">
      <form onSubmit={handleSubmit} className={`${showAiPanel ? "flex-1 min-w-0" : "w-full max-w-4xl mx-auto"} transition-all`}>
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {formSections.map((section) => (
          <div key={section.title} className="mb-8 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-800">{section.title}</h2>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
              {section.fields.map((field) => {
                if (field.visibleWhen && formData[field.visibleWhen.field] !== field.visibleWhen.value) {
                  return null;
                }
                return (
                <div
                  key={field.key}
                  className={field.type === "textarea" ? "md:col-span-2" : ""}
                >
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    {field.label}
                  </label>
                  {field.type === "select" ? (
                    <select
                      value={formData[field.key]}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 bg-white"
                    >
                      <option value="">-- Select --</option>
                      {field.options?.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt.charAt(0).toUpperCase() + opt.slice(1)}
                        </option>
                      ))}
                    </select>
                  ) : field.key === "petitionerAddress" ? (
                    <AddressAutocomplete
                      value={formData[field.key]}
                      onChange={(val) => handleChange(field.key, val)}
                      placeholder={field.placeholder}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  ) : field.type === "textarea" ? (
                    <textarea
                      value={formData[field.key]}
                      onChange={(e) => handleChange(field.key, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  ) : (
                    <>
                      <input
                        type={field.type}
                        value={formData[field.key]}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        placeholder={field.placeholder}
                        readOnly={field.readOnly}
                        tabIndex={field.readOnly ? -1 : undefined}
                        list={field.key === "facilityName" ? "facility-list" : field.key === "immigrationCourtLocation" ? "court-list" : undefined}
                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm text-gray-900 ${field.readOnly ? "bg-gray-100 cursor-not-allowed" : "focus:ring-2 focus:ring-blue-500 focus:border-blue-500"}`}
                      />
                      {field.key === "facilityName" && (
                        <datalist id="facility-list">
                          {facilities.map((f) => (
                            <option key={f.name} value={f.name} />
                          ))}
                        </datalist>
                      )}
                      {field.key === "immigrationCourtLocation" && (
                        <datalist id="court-list">
                          {immigrationCourts.map((c) => (
                            <option key={c.name} value={c.name} />
                          ))}
                        </datalist>
                      )}
                    </>
                  )}
                </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex gap-4 justify-end mb-12 sticky bottom-4 bg-white/80 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-gray-200">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveAndReview}
            disabled={saving}
            className="px-5 py-2.5 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save & Review"}
          </button>
        </div>
      </form>

      {showAiPanel && (
        <div className="w-96 flex-shrink-0 sticky top-4 self-start">
          <AiReviewPanel
            suggestions={aiSuggestions}
            loading={aiLoading}
            onAccept={handleAcceptSuggestion}
            onClose={() => setShowAiPanel(false)}
            onContinue={pendingNavigate ? handleContinue : undefined}
            continueLabel="Save & Preview"
          />
        </div>
      )}
    </div>
  );
}
