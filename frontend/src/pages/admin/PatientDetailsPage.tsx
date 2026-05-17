import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";

interface PatientResponse {
  userId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    role: string;
  };
  cnp: string;
  dateOfBirth: string;
  address: string;
  bloodType: string;
  insuranceId: number | null;
  insuranceProviderName: string | null;
}

interface AppointmentResponse {
  id: number;
  appointmentDate: string;
  durationMinutes: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  doctorName: string;
  consultationId: number | null;
}

interface ConsultationResponse {
  id: number;
  diagnosis: string;
  notes: string;
  consultationDate: string;
  doctorName: string;
  prescriptionCount: number;
  analysisCount: number;
}

interface InsuranceResponse {
  id: number;
  providerName: string;
  coverageDetails: string | null;
  validFrom: string;
  validTo: string;
}

const bloodTypeLabels: Record<string, string> = {
  A_POSITIVE: "A+",
  A_NEGATIVE: "A-",
  B_POSITIVE: "B+",
  B_NEGATIVE: "B-",
  AB_POSITIVE: "AB+",
  AB_NEGATIVE: "AB-",
  O_POSITIVE: "O+",
  O_NEGATIVE: "O-",
};

const statusStyles: Record<string, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-100",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  CANCELLED: "bg-red-50 text-red-600 border-red-100",
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PatientDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const patientId = Number(id);

  const [editing, setEditing] = useState(false);
  const [insuranceId, setInsuranceId] = useState("");
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const { data: patient, isLoading: loadingPatient } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const res = await api.get(`/api/patients/${patientId}`);
      return res.data.data as PatientResponse;
    },
  });

  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ["patient-appointments", patientId],
    queryFn: async () => {
      const res = await api.get(`/api/appointments/patient/${patientId}`);
      return res.data.data as AppointmentResponse[];
    },
  });

  const { data: consultations = [], isLoading: loadingConsultations } =
    useQuery({
      queryKey: ["patient-consultations", patientId],
      queryFn: async () => {
        const res = await api.get(`/api/consultations/patient/${patientId}`);
        return res.data.data as ConsultationResponse[];
      },
    });

  const { data: insurances = [] } = useQuery({
    queryKey: ["insurances"],
    queryFn: async () => {
      const res = await api.get("/api/insurances");
      return res.data.data as InsuranceResponse[];
    },
  });

  useEffect(() => {
    if (patient) {
      setInsuranceId(patient.insuranceId?.toString() || "");
    }
  }, [patient]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/api/patients/${patientId}`, {
        userId: patientId,
        cnp: patient!.cnp,
        dateOfBirth: patient!.dateOfBirth,
        address: patient!.address || null,
        bloodType: patient!.bloodType || null,
        insuranceId: insuranceId ? Number(insuranceId) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: any) => {
      setSaveError(err.response?.data?.message || "Failed to save changes.");
    },
  });

  if (loadingPatient)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );

  if (!patient)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
        Patient not found.
      </div>
    );

  const initials =
    `${patient.user.firstName[0]}${patient.user.lastName[0]}`.toUpperCase();
  const stats = {
    total: appointments.length,
    scheduled: appointments.filter((a) => a.status === "SCHEDULED").length,
    completed: appointments.filter((a) => a.status === "COMPLETED").length,
  };

  return (
    <div>
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-6"
      >
        <i className="ti ti-arrow-left text-sm" aria-hidden="true" />
        Back to patients
      </button>

      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <i className="ti ti-circle-check text-base" aria-hidden="true" />
          Changes saved successfully.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT COLUMN */}
        <div className="flex flex-col gap-4">
          {/* Avatar card */}
          <div className="bg-white rounded-xl border border-slate-100 p-6 flex flex-col items-center text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-white font-medium text-xl mb-3">
              {initials}
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              {patient.user.firstName} {patient.user.lastName}
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              @{patient.user.email}
            </p>
            <span className="inline-block mt-3 text-xs font-medium px-3 py-1 rounded-full bg-emerald-100 text-emerald-700">
              PATIENT
            </span>
          </div>

          {/* Medical Profile */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <i
                    className="ti ti-clipboard-list text-blue-500 text-base"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Medical Profile
                </h3>
              </div>
              <button
                onClick={() => {
                  setEditing((e) => !e);
                  setSaveError("");
                }}
                className="text-xs text-slate-400 hover:text-slate-700 transition-colors flex items-center gap-1"
              >
                <i
                  className={`ti ${editing ? "ti-x" : "ti-pencil"} text-xs`}
                  aria-hidden="true"
                />
                {editing ? "Cancel" : "Edit"}
              </button>
            </div>

            {editing ? (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">
                    Insurance
                  </label>
                  <select
                    value={insuranceId}
                    onChange={(e) => setInsuranceId(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No insurance</option>
                    {insurances.map((ins) => (
                      <option key={ins.id} value={ins.id}>
                        {ins.providerName}
                      </option>
                    ))}
                  </select>
                </div>

                {saveError && (
                  <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-lg px-3 py-2.5 flex items-center gap-2">
                    <i
                      className="ti ti-alert-circle text-base flex-shrink-0"
                      aria-hidden="true"
                    />
                    {saveError}
                  </div>
                )}

                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saveMutation.isPending ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save changes"
                  )}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <InfoRow icon="ti-id" label="CNP" value={patient.cnp} />
                <InfoRow
                  icon="ti-calendar"
                  label="Date of Birth"
                  value={patient.dateOfBirth}
                />
                <InfoRow
                  icon="ti-droplet"
                  label="Blood Type"
                  value={
                    patient.bloodType ? bloodTypeLabels[patient.bloodType] : "—"
                  }
                />
                <InfoRow
                  icon="ti-map-pin"
                  label="Address"
                  value={patient.address || "—"}
                />
                <InfoRow
                  icon="ti-shield-check"
                  label="Insurance"
                  value={patient.insuranceProviderName || "—"}
                />
              </div>
            )}
          </div>

          {/* Contact */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Contact
            </h3>
            <div className="flex flex-col gap-3">
              <InfoRow
                icon="ti-mail"
                label="Email"
                value={patient.user.email}
              />
              <InfoRow
                icon="ti-phone"
                label="Phone"
                value={patient.user.phone || "—"}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard
              icon="ti-calendar"
              label="Total"
              value={stats.total}
              color="text-slate-500"
              bg="bg-slate-50"
            />
            <StatCard
              icon="ti-clock"
              label="Scheduled"
              value={stats.scheduled}
              color="text-blue-500"
              bg="bg-blue-50"
            />
            <StatCard
              icon="ti-circle-check"
              label="Completed"
              value={stats.completed}
              color="text-emerald-500"
              bg="bg-emerald-50"
            />
          </div>

          {/* Appointments */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Appointments — {appointments.length}
            </h3>
            {loadingAppointments ? (
              <div className="flex flex-col gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse h-12 bg-slate-50 rounded-lg"
                  />
                ))}
              </div>
            ) : appointments.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No appointments yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {appointments.slice(0, 5).map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center justify-between gap-3 border border-slate-50 rounded-lg px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {a.doctorName}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatDateTime(a.appointmentDate)}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${statusStyles[a.status]}`}
                    >
                      {a.status.charAt(0) + a.status.slice(1).toLowerCase()}
                    </span>
                  </div>
                ))}
                {appointments.length > 5 && (
                  <p className="text-xs text-slate-400 text-center pt-1">
                    +{appointments.length - 5} more appointments
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Consultations */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Consultations — {consultations.length}
            </h3>
            {loadingConsultations ? (
              <div className="flex flex-col gap-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className="animate-pulse h-12 bg-slate-50 rounded-lg"
                  />
                ))}
              </div>
            ) : consultations.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                No consultations yet.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {consultations.slice(0, 5).map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between gap-3 border border-slate-50 rounded-lg px-3 py-2.5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {c.diagnosis}
                      </p>
                      <p className="text-xs text-slate-400">
                        Dr. {c.doctorName} · {formatDate(c.consultationDate)}
                      </p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {c.prescriptionCount > 0 && (
                        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                          {c.prescriptionCount} rx
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {consultations.length > 5 && (
                  <p className="text-xs text-slate-400 text-center pt-1">
                    +{consultations.length - 5} more consultations
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <i className={`ti ${icon} text-slate-300 text-xs`} aria-hidden="true" />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="text-sm font-medium text-slate-800 pl-4">{value}</p>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-4">
      <div
        className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mb-2`}
      >
        <i className={`ti ${icon} ${color} text-sm`} aria-hidden="true" />
      </div>
      <p className="text-xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}
