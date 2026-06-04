import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <h1 className="text-8xl font-semibold text-slate-900 tracking-tight">
        404
      </h1>
      <h2 className="text-2xl font-medium text-slate-700 mt-4">
        Page not found
      </h2>
      <p className="text-slate-400 mt-2 text-sm">
        The page you're looking for doesn't exist.
      </p>
      <button
        onClick={() => navigate(-1)}
        className="mt-6 bg-slate-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
      >
        <i className="ti ti-arrow-left text-base" aria-hidden="true" />
        Go back
      </button>
    </div>
  );
}
