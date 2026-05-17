import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api/axios";

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
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

const statusStyles: Record<string, string> = {
  SCHEDULED: "bg-blue-50 text-blue-700 border-blue-100",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-100",
  CANCELLED: "bg-red-50 text-red-600 border-red-100",
};

const statusIcons: Record<string, string> = {
  SCHEDULED: "ti-clock",
  COMPLETED: "ti-circle-check",
  CANCELLED: "ti-circle-x",
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

export default function AppointmentsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [filterStatus, setFilterStatus] = useState("");
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [statusModalId, setStatusModalId] = useState<number | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [sortBy, setSortBy] = useState("appointmentDate");
  const [sortDir, setSortDir] = useState("desc");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-appointments", page, size, sortBy, sortDir],
    queryFn: async () => {
      const res = await api.get("/api/appointments", {
        params: { page, size, sortBy, sortDir },
      });
      return res.data.data as Page<AppointmentResponse>;
    },
  });

  // Filtreaza pe frontend dupa status
  const appointments = filterStatus
    ? (data?.content ?? []).filter((a) => a.status === filterStatus)
    : (data?.content ?? []);

  const stats = {
    scheduled: (data?.content ?? []).filter((a) => a.status === "SCHEDULED")
      .length,
    completed: (data?.content ?? []).filter((a) => a.status === "COMPLETED")
      .length,
    cancelled: (data?.content ?? []).filter((a) => a.status === "CANCELLED")
      .length,
  };

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/api/appointments/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      setCancelId(null);
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const appointment = data?.content.find((a) => a.id === id);
      if (!appointment) return;
      await api.put(`/api/appointments/${id}`, {
        patientId: appointment.patientId,
        doctorId: appointment.doctorId,
        appointmentDate: appointment.appointmentDate,
        durationMinutes: appointment.durationMinutes,
        status,
        notes: appointment.notes,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-appointments"] });
      setStatusModalId(null);
    },
  });

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );

  if (isError)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
        Failed to load appointments.
      </div>
    );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Appointments
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          {data?.totalElements} total appointments
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
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
        <StatCard
          icon="ti-circle-x"
          label="Cancelled"
          value={stats.cancelled}
          color="text-red-400"
          bg="bg-red-50"
        />
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 mb-4 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-500 font-medium">Filter:</span>
          <div className="flex gap-2">
            {["", "SCHEDULED", "COMPLETED", "CANCELLED"].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setFilterStatus(s);
                  setPage(0);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ${
                  filterStatus === s
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                }`}
              >
                {s === "" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-500 font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setPage(0);
            }}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="appointmentDate">Date</option>
            <option value="status">Status</option>
            <option value="durationMinutes">Duration</option>
          </select>
          <select
            value={sortDir}
            onChange={(e) => {
              setSortDir(e.target.value);
              setPage(0);
            }}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
          <span className="text-sm text-slate-500">Rows:</span>
          <select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(0);
            }}
            className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Patient</th>
              <th className="text-left px-4 py-3 font-medium">Doctor</th>
              <th className="text-left px-4 py-3 font-medium">Date & Time</th>
              <th className="text-left px-4 py-3 font-medium">Duration</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {appointments.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-slate-400 text-sm"
                >
                  No appointments found.
                </td>
              </tr>
            ) : (
              appointments.map((a, i) => (
                <tr
                  key={a.id}
                  className={`border-t border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-900">
                      {a.patientName}
                    </p>
                    <p className="text-xs text-slate-400">ID #{a.patientId}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{a.doctorName}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDateTime(a.appointmentDate)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {a.durationMinutes} min
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyles[a.status]}`}
                    >
                      <i
                        className={`ti ${statusIcons[a.status]} text-xs`}
                        aria-hidden="true"
                      />
                      {a.status.charAt(0) + a.status.slice(1).toLowerCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 justify-end">
                      {/* Change status */}
                      <button
                        onClick={() => {
                          setStatusModalId(a.id);
                          setNewStatus(a.status);
                        }}
                        className="text-xs text-slate-400 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        <i
                          className="ti ti-edit text-xs mr-1"
                          aria-hidden="true"
                        />
                        Status
                      </button>
                      {/* Cancel */}
                      {a.status === "SCHEDULED" && (
                        <button
                          onClick={() => setCancelId(a.id)}
                          className="text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100">
          <span className="text-sm text-slate-400">
            Page {(data?.number ?? 0) + 1} of {data?.totalPages ?? 1}
            <span className="ml-2 text-slate-300">·</span>
            <span className="ml-2">{data?.totalElements} total</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={data?.first}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <i className="ti ti-chevron-left text-sm" aria-hidden="true" />
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={data?.last}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <i className="ti ti-chevron-right text-sm" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {cancelId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <i
                className="ti ti-calendar-x text-red-400 text-xl"
                aria-hidden="true"
              />
            </div>
            <h3 className="text-base font-semibold text-slate-900 text-center mb-1">
              Cancel appointment
            </h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              Are you sure you want to cancel this appointment?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelId(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                Keep it
              </button>
              <button
                onClick={() => cancelMutation.mutate(cancelId)}
                disabled={cancelMutation.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Status Modal */}
      {statusModalId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <i
                className="ti ti-edit text-slate-500 text-xl"
                aria-hidden="true"
              />
            </div>
            <h3 className="text-base font-semibold text-slate-900 text-center mb-1">
              Change status
            </h3>
            <p className="text-sm text-slate-400 text-center mb-5">
              Select the new status for this appointment
            </p>
            <div className="flex flex-col gap-2 mb-6">
              {["SCHEDULED", "COMPLETED", "CANCELLED"].map((s) => (
                <button
                  key={s}
                  onClick={() => setNewStatus(s)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-sm font-medium ${
                    newStatus === s
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <i
                    className={`ti ${statusIcons[s]} text-base`}
                    aria-hidden="true"
                  />
                  {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setStatusModalId(null)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  updateStatusMutation.mutate({
                    id: statusModalId,
                    status: newStatus,
                  })
                }
                disabled={updateStatusMutation.isPending}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
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
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <div
        className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}
      >
        <i className={`ti ${icon} ${color} text-base`} aria-hidden="true" />
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}
