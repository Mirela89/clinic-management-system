import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/useAuth";
import api from "../../api/axios";

interface PrescriptionMedicationResponse {
  medicationId: number;
  medicationName: string;
  dosage: string;
  quantity: number;
  frequency: string | null;
  durationDays: number;
}

interface PrescriptionResponse {
  id: number;
  issueDate: string;
  expiryDate: string;
  instructions: string | null;
  consultationId: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  medications: PrescriptionMedicationResponse[];
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isExpired(expiryDate: string): boolean {
  return new Date(expiryDate) < new Date();
}

const frequencyLabels: Record<string, string> = {
  ONCE_DAILY: "Once daily",
  TWICE_DAILY: "Twice daily",
  THREE_TIMES_DAILY: "Three times daily",
  FOUR_TIMES_DAILY: "Four times daily",
  EVERY_8_HOURS: "Every 8 hours",
  EVERY_12_HOURS: "Every 12 hours",
  AS_NEEDED: "As needed",
  WEEKLY: "Weekly",
};

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();

  const {
    data: prescriptions = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["patient-prescriptions", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get(`/api/prescriptions/patient/${user!.id}`);
      return res.data.data as PrescriptionResponse[];
    },
  });

  // Sortare — active primele, expirate la final
  const sorted = [...prescriptions].sort((a, b) => {
    const aExpired = isExpired(a.expiryDate);
    const bExpired = isExpired(b.expiryDate);
    if (aExpired && !bExpired) return 1;
    if (!aExpired && bExpired) return -1;
    return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
  });

  const activeCount = prescriptions.filter(
    (p) => !isExpired(p.expiryDate),
  ).length;
  const expiredCount = prescriptions.filter((p) =>
    isExpired(p.expiryDate),
  ).length;

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );

  if (isError)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
        Failed to load prescriptions.
      </div>
    );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          My Prescriptions
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          View your medication plans, dosages and expiration dates
        </p>
      </div>

      {prescriptions.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i
              className="ti ti-pill text-slate-300 text-2xl"
              aria-hidden="true"
            />
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">
            No prescriptions yet
          </h2>
          <p className="text-sm text-slate-400">
            Prescriptions issued after your consultations will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center mb-3">
                <i
                  className="ti ti-circle-check text-emerald-500 text-base"
                  aria-hidden="true"
                />
              </div>
              <p className="text-2xl font-semibold text-slate-900">
                {activeCount}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Active prescription{activeCount !== 1 ? "s" : ""}
              </p>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-5">
              <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center mb-3">
                <i
                  className="ti ti-clock-x text-red-400 text-base"
                  aria-hidden="true"
                />
              </div>
              <p className="text-2xl font-semibold text-slate-900">
                {expiredCount}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Expired prescription{expiredCount !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* List */}
          <div className="flex flex-col gap-4">
            {sorted.map((p) => {
              const expired = isExpired(p.expiryDate);
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-xl border p-5 ${expired ? "border-slate-100 opacity-75" : "border-slate-100"}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                        {p.doctorName
                          .split(" ")
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          Dr. {p.doctorName}
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Issued {formatDate(p.issueDate)}
                        </p>
                      </div>
                    </div>
                    {expired ? (
                      <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-500 border border-red-100">
                        <i
                          className="ti ti-clock-x text-xs"
                          aria-hidden="true"
                        />
                        Expired {formatDate(p.expiryDate)}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                        <i
                          className="ti ti-circle-check text-xs"
                          aria-hidden="true"
                        />
                        Valid until {formatDate(p.expiryDate)}
                      </span>
                    )}
                  </div>

                  {/* Instructions */}
                  {p.instructions && (
                    <div className="bg-slate-50 rounded-lg px-4 py-3 mb-4">
                      <p className="text-xs text-slate-400 mb-1">
                        Instructions
                      </p>
                      <p className="text-sm text-slate-600">{p.instructions}</p>
                    </div>
                  )}

                  {/* Medications */}
                  <div className="flex flex-col gap-2">
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
                      Medications - {p.medications.length}
                    </p>
                    {p.medications.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">
                        No medications added to this prescription.
                      </p>
                    ) : (
                      p.medications.map((med) => (
                        <div
                          key={med.medicationId}
                          className="flex items-start justify-between gap-4 border border-slate-100 rounded-lg px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-medium text-slate-900">
                              {med.medicationName}
                            </p>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {med.dosage}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2 justify-end">
                            {med.frequency && (
                              <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full">
                                {frequencyLabels[med.frequency] ||
                                  med.frequency}
                              </span>
                            )}
                            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                              {med.durationDays} days
                            </span>
                            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                              qty {med.quantity}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                    <i
                      className="ti ti-calendar text-slate-300 text-xs"
                      aria-hidden="true"
                    />
                    <span className="text-xs text-slate-400">
                      Appointment #{p.appointmentId}
                    </span>
                    <span className="text-slate-200 mx-1">·</span>
                    <i
                      className="ti ti-file-text text-slate-300 text-xs"
                      aria-hidden="true"
                    />
                    <span className="text-xs text-slate-400">
                      Consultation #{p.consultationId}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
