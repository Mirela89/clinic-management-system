import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";

interface DoctorResponse {
  userId: number;
  user: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    role: string;
  };
  specialization: string;
  licenseNumber: string | null;
  departmentId: number | null;
  departmentName: string | null;
}

interface DepartmentResponse {
  id: number;
  name: string;
}

interface AppointmentResponse {
  id: number;
  appointmentDate: string;
  durationMinutes: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  patientName: string;
  doctorId: number;
  consultationId: number | null;
}

const statusStyles: Record<string, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-100",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  CANCELLED: "bg-red-50 text-red-600 border-red-100",
};

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function DoctorDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const doctorId = Number(id);
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [form, setForm] = useState({
    phone: "",
    specialization: "",
    licenseNumber: "",
    departmentId: "",
  });

  const { data: doctor, isLoading: loadingDoctor } = useQuery({
    queryKey: ["doctor", doctorId],
    queryFn: async () => {
      const res = await api.get(`/api/doctors/${doctorId}`);
      return res.data.data as DoctorResponse;
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments-admin"],
    queryFn: async () => {
      const res = await api.get("/api/departments");
      return res.data.data as DepartmentResponse[];
    },
  });

  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ["doctor-appointments", doctorId],
    queryFn: async () => {
      const res = await api.get(`/api/appointments?page=0&size=100`);
      return (res.data.data.content as AppointmentResponse[])
        .filter((a: any) => a.doctorId === doctorId)
        .sort(
          (a: any, b: any) =>
            new Date(b.appointmentDate).getTime() -
            new Date(a.appointmentDate).getTime(),
        );
    },
  });

  useEffect(() => {
    if (doctor) {
      setForm({
        phone: doctor.user.phone || "",
        specialization: doctor.specialization,
        licenseNumber: doctor.licenseNumber || "",
        departmentId: doctor.departmentId?.toString() || "",
      });
    }
  }, [doctor]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/api/users/${doctorId}`, {
        username: doctor!.user.username,
        password: null,
        email: doctor!.user.email,
        firstName: doctor!.user.firstName,
        lastName: doctor!.user.lastName,
        phone: form.phone || null,
        role: "DOCTOR",
      });

      await api.put(`/api/doctors/${doctorId}`, {
        userId: doctorId,
        specialization: form.specialization.trim(),
        licenseNumber: form.licenseNumber.trim() || null,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctor", doctorId] });
      queryClient.invalidateQueries({ queryKey: ["doctors"] });
      setSaveSuccess(true);
      setEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    },
    onError: (err: any) => {
      setSaveError(err.response?.data?.message || "Failed to save changes.");
    },
  });

  const handleSave = () => {
    setSaveError("");
    saveMutation.mutate();
  };

  if (loadingDoctor)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );

  if (!doctor)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
        Doctor not found.
      </div>
    );

  const initials =
    `${doctor.user.firstName[0]}${doctor.user.lastName[0]}`.toUpperCase();
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
        Back to doctors
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
              Dr. {doctor.user.firstName} {doctor.user.lastName}
            </h2>
            <p className="text-slate-400 text-sm mt-0.5">
              @{doctor.user.username}
            </p>
            <span className="inline-block mt-3 text-xs font-medium px-3 py-1 rounded-full bg-blue-100 text-blue-700">
              DOCTOR
            </span>
          </div>

          {/* Contact card */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">
              Contact
            </h3>
            <div className="flex flex-col gap-3">
              <InfoRow icon="ti-mail" label="Email" value={doctor.user.email} />
              <InfoRow
                icon="ti-phone"
                label="Phone"
                value={doctor.user.phone || "—"}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Medical profile */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <i
                    className="ti ti-stethoscope text-blue-500 text-base"
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <EditField label="Phone">
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, phone: e.target.value }))
                    }
                    placeholder="0712 345 678"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </EditField>
                <EditField label="Specialization">
                  <input
                    value={form.specialization}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, specialization: e.target.value }))
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </EditField>
                <EditField label="License number">
                  <input
                    value={form.licenseNumber}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, licenseNumber: e.target.value }))
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </EditField>
                <EditField label="Department">
                  <select
                    value={form.departmentId}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, departmentId: e.target.value }))
                    }
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">No department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </EditField>

                {saveError && (
                  <div className="sm:col-span-2 bg-red-50 border border-red-100 text-red-500 text-sm rounded-lg px-3 py-2.5 flex items-center gap-2">
                    <i
                      className="ti ti-alert-circle text-base flex-shrink-0"
                      aria-hidden="true"
                    />
                    {saveError}
                  </div>
                )}

                <div className="sm:col-span-2 flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saveMutation.isPending}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium px-5 py-2 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
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
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <InfoBlock
                  label="Specialization"
                  value={doctor.specialization}
                />
                <InfoBlock
                  label="License Number"
                  value={doctor.licenseNumber || "—"}
                />
                <InfoBlock
                  label="Department"
                  value={doctor.departmentName || "—"}
                />
              </div>
            )}
          </div>

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
              Recent Appointments — {appointments.length}
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
                        {a.patientName}
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

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-800">{value}</p>
    </div>
  );
}

function EditField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs text-slate-500 mb-1.5">{label}</label>
      {children}
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
