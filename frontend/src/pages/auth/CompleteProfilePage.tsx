import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import api from "../../api/axios";

const BLOOD_TYPES = [
  { value: "A_POSITIVE", label: "A+" },
  { value: "A_NEGATIVE", label: "A-" },
  { value: "B_POSITIVE", label: "B+" },
  { value: "B_NEGATIVE", label: "B-" },
  { value: "AB_POSITIVE", label: "AB+" },
  { value: "AB_NEGATIVE", label: "AB-" },
  { value: "O_POSITIVE", label: "O+" },
  { value: "O_NEGATIVE", label: "O-" },
];

export default function CompleteProfilePage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    cnp: "",
    dateOfBirth: "",
    address: "",
    bloodType: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateStep1 = () => {
    if (!/^\d{13}$/.test(form.cnp)) {
      setError("CNP must be exactly 13 digits.");
      return false;
    }
    if (!form.dateOfBirth) {
      setError("Date of birth is required.");
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setError("");
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/api/patients", {
        userId: user?.id,
        cnp: form.cnp,
        dateOfBirth: form.dateOfBirth,
        address: form.address || null,
        bloodType: form.bloodType || null,
        insuranceId: null,
      });
      await refreshProfile();
      navigate("/patient/dashboard");
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Failed to save profile. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "U";

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-[44%] bg-slate-900 flex-col p-10 relative overflow-hidden flex-shrink-0">
        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-blue-500/10" />
        <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full border border-blue-500/10" />
        <div className="absolute bottom-16 -left-10 w-48 h-48 rounded-full border border-indigo-500/10" />

        {/* Logo */}
        <div className="flex items-center gap-3 mb-auto">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <i
              className="ti ti-heart-rate-monitor text-white text-xl"
              aria-hidden="true"
            />
          </div>
          <span className="text-white font-medium text-base tracking-tight">
            MediCare+
          </span>
        </div>

        {/* Main message */}
        <div className="mb-auto pt-16">
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">
            One more step
          </p>
          <h1 className="text-white text-3xl font-medium leading-snug tracking-tight mb-5">
            Complete your
            <br />
            medical profile
            <br />
            to get started.
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
            Your medical information helps us provide better care and allows
            doctors to prepare for your appointments.
          </p>
        </div>

        {/* Progress steps */}
        <div className="flex flex-col gap-4 pt-8 border-t border-white/5">
          {[
            {
              icon: "ti-id",
              label: "Personal details",
              desc: "CNP and date of birth",
              s: 1,
            },
            {
              icon: "ti-map-pin",
              label: "Address & health",
              desc: "Location and blood type",
              s: 2,
            },
          ].map((item) => (
            <div key={item.s} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  step >= item.s ? "bg-blue-500" : "bg-slate-800"
                }`}
              >
                <i
                  className={`ti ${item.icon} text-sm ${step >= item.s ? "text-white" : "text-slate-500"}`}
                  aria-hidden="true"
                />
              </div>
              <div>
                <p
                  className={`text-sm font-medium ${step >= item.s ? "text-white" : "text-slate-500"}`}
                >
                  {item.label}
                </p>
                <p className="text-slate-600 text-xs">{item.desc}</p>
              </div>
              {step > item.s && (
                <i
                  className="ti ti-circle-check text-blue-400 ml-auto text-base"
                  aria-hidden="true"
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          {/* User greeting */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-medium text-sm flex-shrink-0">
              {initials}
            </div>
            <div>
              <p className="text-slate-900 font-medium text-sm">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-slate-400 text-xs">
                Complete your profile to continue
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex-1 h-1 rounded-full bg-blue-500" />
            <div
              className={`flex-1 h-1 rounded-full transition-colors ${step === 2 ? "bg-blue-500" : "bg-slate-200"}`}
            />
            <span className="text-xs text-slate-400 ml-1">
              Step {step} of 2
            </span>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {step === 1 && (
              <>
                <div className="mb-2">
                  <h2 className="text-2xl font-medium text-slate-900 tracking-tight mb-1.5">
                    Personal details
                  </h2>
                  <p className="text-sm text-slate-400">
                    We need a few details to identify you in our system.
                  </p>
                </div>

                {/* CNP */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    CNP <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <i
                      className="ti ti-id absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      name="cnp"
                      value={form.cnp}
                      onChange={handleChange}
                      maxLength={13}
                      placeholder="1234567890123"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 flex items-center gap-1">
                    <i
                      className="ti ti-info-circle text-xs"
                      aria-hidden="true"
                    />
                    Must be exactly 13 digits
                  </p>
                </div>

                {/* Date of Birth */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Date of birth <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <i
                      className="ti ti-calendar absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      name="dateOfBirth"
                      type="date"
                      value={form.dateOfBirth}
                      onChange={handleChange}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                    <i
                      className="ti ti-alert-circle text-base flex-shrink-0"
                      aria-hidden="true"
                    />
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl text-sm transition-colors mt-1"
                >
                  Continue
                  <i
                    className="ti ti-arrow-right ml-2 text-sm"
                    aria-hidden="true"
                  />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <div className="mb-2">
                  <h2 className="text-2xl font-medium text-slate-900 tracking-tight mb-1.5">
                    Address & health
                  </h2>
                  <p className="text-sm text-slate-400">
                    Optional, you can update these later in your profile.
                  </p>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Address
                    <span className="text-slate-400 font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <div className="relative">
                    <i
                      className="ti ti-map-pin absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none"
                      aria-hidden="true"
                    />
                    <input
                      name="address"
                      value={form.address}
                      onChange={handleChange}
                      placeholder="Street, City, Country"
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Blood Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Blood type
                    <span className="text-slate-400 font-normal ml-1">
                      (optional)
                    </span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {BLOOD_TYPES.map((bt) => (
                      <button
                        key={bt.value}
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            bloodType:
                              prev.bloodType === bt.value ? "" : bt.value,
                          }))
                        }
                        className={`py-2.5 rounded-xl text-sm font-medium transition-all border ${
                          form.bloodType === bt.value
                            ? "bg-blue-500 text-white border-blue-500"
                            : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
                        }`}
                      >
                        {bt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                    <i
                      className="ti ti-alert-circle text-base flex-shrink-0"
                      aria-hidden="true"
                    />
                    {error}
                  </div>
                )}

                <div className="flex gap-3 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setError("");
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-3 rounded-xl text-sm transition-colors"
                  >
                    <i
                      className="ti ti-arrow-left mr-2 text-sm"
                      aria-hidden="true"
                    />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-50"
                  >
                    {loading ? "Saving..." : "Save & continue"}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
