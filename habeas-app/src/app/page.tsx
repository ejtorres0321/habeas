"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import SignOutButton from "@/components/SignOutButton";

interface CaseRecord {
  _id: string;
  petitionerName: string;
  civilNo: string;
  status: string;
  facilityName: string;
  monthsDetained: string;
  updatedAt: string;
}

export default function Dashboard() {
  const [cases, setCases] = useState<CaseRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCases();
  }, []);

  async function loadCases(query = "") {
    setLoading(true);
    const res = await fetch(`/api/cases?search=${encodeURIComponent(query)}`);
    const data = await res.json();
    setCases(data);
    setLoading(false);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadCases(search);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete petition for ${name || "this petitioner"}?`)) return;
    await fetch(`/api/cases/${id}`, { method: "DELETE" });
    loadCases(search);
  }

  const statusColors: Record<string, string> = {
    draft: "bg-yellow-100 text-yellow-800",
    filed: "bg-blue-100 text-blue-800",
    resolved: "bg-green-100 text-green-800",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Habeas Corpus Petitions
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Manuel E. Solis - Attorney for Petitioner
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/cases/new"
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm"
            >
              + New Petition
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <form onSubmit={handleSearch} className="mb-6 flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by petitioner name, civil no., or facility..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-gray-700 font-medium"
          >
            Search
          </button>
        </form>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading cases...</div>
        ) : cases.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <div className="text-gray-400 text-5xl mb-4">&#9878;</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No petitions yet</h3>
            <p className="text-gray-500 mb-6">Create your first Habeas Corpus petition to get started.</p>
            <Link
              href="/cases/new"
              className="inline-flex items-center px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              + New Petition
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Petitioner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Civil No.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Facility
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Detained
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Updated
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cases.map((c) => (
                  <tr key={c._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {c.petitionerName || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {c.civilNo || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {c.facilityName || "—"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {c.monthsDetained ? `${c.monthsDetained} mo.` : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[c.status] || "bg-gray-100 text-gray-800"}`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(c.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <Link
                        href={`/cases/${c._id}/edit`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </Link>
                      <Link
                        href={`/cases/${c._id}/preview`}
                        className="text-sm text-green-600 hover:text-green-800 font-medium"
                      >
                        Preview
                      </Link>
                      <button
                        onClick={() => handleDelete(c._id, c.petitionerName)}
                        className="text-sm text-red-600 hover:text-red-800 font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
