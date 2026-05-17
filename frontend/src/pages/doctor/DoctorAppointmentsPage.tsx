import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ReactNode } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileText,
  UserRound,
  XCircle,
} from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/useAuth";

interface AppointmentResponse {
  id: number;
  appointmentDate: string;
  durationMinutes: number;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  notes: string | null;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  consultationId: number | null;
}

interface Page<T> {
  content: T[];
}

const statusStyles: Record<AppointmentResponse["status"], string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-100",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  CANCELLED: "bg-rose-50 text-rose-700 border-rose-100",
};

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["doctor-appointments", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get("/api/appointments", {
        params: {
          page: 0,
          size: 200,
          sortBy: "appointmentDate",
          sortDir: "asc",
        },
      });
      return res.data.data as Page<AppointmentResponse>;
    },
  });

  const appointments = useMemo(() => {
    if (!user?.id) return [];
    return (data?.content ?? []).filter(
      (appointment) => appointment.doctorId === user.id,
    );
  }, [data?.content, user?.id]);

  const now = Date.now();

  const stats = useMemo(() => {
    return appointments.reduce(
      (acc, appointment) => {
        if (appointment.status === "SCHEDULED") {
          acc.scheduled += 1;
          if (new Date(appointment.appointmentDate).getTime() >= now) {
            acc.upcoming += 1;
          }
        }
        if (appointment.status === "COMPLETED") acc.completed += 1;
        if (appointment.status === "CANCELLED") acc.cancelled += 1;
        return acc;
      },
      { scheduled: 0, upcoming: 0, completed: 0, cancelled: 0 },
    );
  }, [appointments, now]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
        Failed to load doctor appointments.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My appointments</h1>
        <p className="text-sm text-slate-500 mt-1">
          Follow the visits assigned to you and keep track of what still needs
          consultation notes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={<CalendarDays className="h-5 w-5 text-blue-600" />}
          label="Scheduled"
          value={stats.scheduled}
          tone="bg-blue-50"
        />
        <StatCard
          icon={<Clock3 className="h-5 w-5 text-indigo-600" />}
          label="Upcoming"
          value={stats.upcoming}
          tone="bg-indigo-50"
        />
        <StatCard
          icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
          label="Completed"
          value={stats.completed}
          tone="bg-emerald-50"
        />
        <StatCard
          icon={<XCircle className="h-5 w-5 text-rose-600" />}
          label="Cancelled"
          value={stats.cancelled}
          tone="bg-rose-50"
        />
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">
            No appointments assigned yet
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Once patients start booking your published schedule, the visits will
            appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <article
              key={appointment.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">
                      {appointment.patientName}
                    </h2>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[appointment.status]}`}
                    >
                      {appointment.status.toLowerCase()}
                    </span>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <InfoRow
                      icon={<CalendarDays className="h-4 w-4" />}
                      label={formatDateTime(appointment.appointmentDate)}
                    />
                    <InfoRow
                      icon={<Clock3 className="h-4 w-4" />}
                      label={`${appointment.durationMinutes} minutes`}
                    />
                    <InfoRow
                      icon={<UserRound className="h-4 w-4" />}
                      label={`Patient ID #${appointment.patientId}`}
                    />
                    <InfoRow
                      icon={<FileText className="h-4 w-4" />}
                      label={
                        appointment.consultationId
                          ? `Consultation #${appointment.consultationId}`
                          : "Consultation not added yet"
                      }
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:min-w-72">
                  <p className="font-medium text-slate-800 mb-1">
                    Appointment notes
                  </p>
                  <p className="leading-6">
                    {appointment.notes ||
                      "No notes were attached to this appointment."}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 inline-flex rounded-xl p-3 ${tone}`}>{icon}</div>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function InfoRow({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-slate-400">{icon}</span>
      <span>{label}</span>
    </div>
  );
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
