import { useNavigate } from "react-router-dom";

export default function ServerErrorPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <i
            className="ti ti-server-off text-red-400 text-3xl"
            aria-hidden="true"
          />
        </div>
        <h1 className="text-7xl font-semibold text-slate-900 tracking-tight mb-4">
          500
        </h1>
        <h2 className="text-xl font-medium text-slate-700 mb-2">
          Server error
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          Something went wrong on our end. Please try again in a few moments.
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => navigate(-1)}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center gap-2"
          >
            <i className="ti ti-arrow-left text-base" aria-hidden="true" />
            Go back
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
