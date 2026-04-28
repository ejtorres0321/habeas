import { signIn } from "@/auth";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-10 max-w-sm w-full text-center">
        <div className="text-5xl mb-4">&#9878;</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Habeas Corpus
        </h1>
        <p className="text-sm text-gray-500 mb-8">
          Manuel E. Solis - Attorney at Law
        </p>
        <form
          action={async () => {
            "use server";
            await signIn("microsoft-entra-id", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 px-5 py-3 bg-[#2f2f2f] text-white rounded-lg hover:bg-[#1a1a1a] transition-colors font-medium"
          >
            <svg width="20" height="20" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
              <rect x="1" y="1" width="9" height="9" fill="#f25022" />
              <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
              <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
              <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
            </svg>
            Sign in with Microsoft
          </button>
        </form>
      </div>
    </div>
  );
}
