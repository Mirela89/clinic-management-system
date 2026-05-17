import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function UnauthorizedPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const getDashboardPath = () => {
    if (user?.role === "DOCTOR") return "/doctor/dashboard";
    if (user?.role === "PATIENT") return "/patient/dashboard";
    return "/dashboard";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <i className="ti ti-lock text-red-400 text-3xl" aria-hidden="true" />
        </div>
        <h1 className="text-7xl font-semibold text-slate-900 tracking-tight mb-4">
          403
        </h1>
        <h2 className="text-xl font-medium text-slate-700 mb-2">
          Access denied
        </h2>
        <p className="text-slate-400 text-sm leading-relaxed mb-8">
          You don't have permission to access this page.
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
            onClick={() => navigate(getDashboardPath())}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            Go to dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
