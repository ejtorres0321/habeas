"use client";

export default function SignOutButton({ userName }: { userName?: string | null }) {
  return (
    <div className="flex items-center gap-3">
      {userName && (
        <span className="text-sm text-gray-600">{userName}</span>
      )}
      <button
        onClick={() => {
          window.location.href = "/api/auth/signout";
        }}
        className="px-4 py-2 text-sm text-gray-600 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
      >
        Sign Out
      </button>
    </div>
  );
}
