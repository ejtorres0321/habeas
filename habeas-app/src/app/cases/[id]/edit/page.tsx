"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import CaseForm from "@/components/CaseForm";
import { CaseFormData, defaultCaseData } from "@/lib/caseFields";
import Link from "next/link";

export default function EditCasePage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<CaseFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/cases/${id}`)
      .then((res) => res.json())
      .then((caseData) => {
        const formData: CaseFormData = { ...defaultCaseData };
        for (const key of Object.keys(defaultCaseData) as (keyof CaseFormData)[]) {
          if (caseData[key] !== undefined) {
            (formData[key] as string) = caseData[key];
          }
        }
        setData(formData);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500 text-lg">Loading case...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
            &larr; Back to Cases
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            Edit Petition
          </h1>
        </div>
      </header>
      <main className="px-6 py-8">
        <CaseForm initialData={data || defaultCaseData} caseId={id} />
      </main>
    </div>
  );
}
