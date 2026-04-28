import CaseForm from "@/components/CaseForm";
import { defaultCaseData } from "@/lib/caseFields";
import Link from "next/link";

export default function NewCasePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
              &larr; Back to Cases
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              New Habeas Corpus Petition
            </h1>
          </div>
        </div>
      </header>
      <main className="px-6 py-8">
        <CaseForm initialData={defaultCaseData} />
      </main>
    </div>
  );
}
