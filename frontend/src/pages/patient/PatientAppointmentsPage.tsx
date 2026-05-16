import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import api from '../../api/axios';

interface AppointmentResponse {
  id: number;
  appointmentDate: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes: string | null;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  consultationId: number | null;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

const statusStyles: Record<string, string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-100',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-100',
};

export default function PatientAppointmentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cancelId, setCancelId] = useState<number | null>(null);
  const [pageSize, setPageSize] = useState(5);
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);

  const { data: appointments = [], isLoading, isError } = useQuery({
    queryKey: ['patient-appointments', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get(`/api/appointments/patient/${user!.id}`);
      return res.data.data as AppointmentResponse[];
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.patch(`/api/appointments/${id}/cancel`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patient-appointments', user?.id] });
      setCancelId(null);
    }
  });

  const upcoming = [...appointments]
    .filter(a => a.status === 'SCHEDULED')
    .sort((left, right) => new Date(left.appointmentDate).getTime() - new Date(right.appointmentDate).getTime());

  const past = [...appointments]
    .filter(a => a.status !== 'SCHEDULED')
    .sort((left, right) => new Date(right.appointmentDate).getTime() - new Date(left.appointmentDate).getTime());

  const upcomingTotalPages = Math.max(1, Math.ceil(upcoming.length / pageSize));
  const historyTotalPages = Math.max(1, Math.ceil(past.length / pageSize));

  const upcomingPageItems = upcoming.slice((upcomingPage - 1) * pageSize, upcomingPage * pageSize);
  const historyPageItems = past.slice((historyPage - 1) * pageSize, historyPage * pageSize);

  const stats = {
    scheduled: upcoming.length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
    cancelled: appointments.filter(a => a.status === 'CANCELLED').length,
  };

  useEffect(() => {
    if (upcomingPage > upcomingTotalPages) {
      setUpcomingPage(upcomingTotalPages);
    }
  }, [upcomingPage, upcomingTotalPages]);

  useEffect(() => {
    if (historyPage > historyTotalPages) {
      setHistoryPage(historyTotalPages);
    }
  }, [historyPage, historyTotalPages]);

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (isError) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
      Failed to load appointments.
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">My Appointments</h1>
          <p className="text-slate-400 text-sm mt-1">Track your scheduled visits and appointment history</p>
        </div>
        <Link
          to="/patient/book-appointment"
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors flex-shrink-0"
        >
          <i className="ti ti-calendar-plus text-base" aria-hidden="true" />
          Book appointment
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <StatCard icon="ti-clock" label="Scheduled" value={stats.scheduled} color="text-blue-500" bg="bg-blue-50" />
        <StatCard icon="ti-circle-check" label="Completed" value={stats.completed} color="text-emerald-500" bg="bg-emerald-50" />
        <StatCard icon="ti-circle-x" label="Cancelled" value={stats.cancelled} color="text-red-500" bg="bg-red-50" />
      </div>

      {appointments.length > 0 && (
        <div className="mb-6 flex justify-end">
          <label className="flex items-center gap-3 text-sm text-slate-600">
            <span>Per page</span>
            <select
              value={pageSize}
              onChange={event => {
                const nextPageSize = Number(event.target.value);
                setPageSize(nextPageSize);
                setUpcomingPage(1);
                setHistoryPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[5, 10, 20].map(size => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="ti ti-calendar text-slate-300 text-2xl" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">No appointments yet</h2>
          <p className="text-sm text-slate-400 mb-6">Book your first appointment to get started.</p>
          <Link
            to="/patient/book-appointment"
            className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <i className="ti ti-calendar-plus text-base" aria-hidden="true" />
            Book appointment
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">

          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                Upcoming - {upcoming.length}
              </h2>
              <div className="flex flex-col gap-3">
                {upcomingPageItems.map(a => (
                  <AppointmentCard
                    key={a.id}
                    appointment={a}
                    onCancel={() => setCancelId(a.id)}
                  />
                ))}
              </div>
              <PaginationControls
                currentPage={upcomingPage}
                totalPages={upcomingTotalPages}
                totalItems={upcoming.length}
                pageSize={pageSize}
                onPrevious={() => setUpcomingPage(prev => Math.max(1, prev - 1))}
                onNext={() => setUpcomingPage(prev => Math.min(upcomingTotalPages, prev + 1))}
              />
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-3">
                History - {past.length}
              </h2>
              <div className="flex flex-col gap-3">
                {historyPageItems.map(a => (
                  <AppointmentCard key={a.id} appointment={a} />
                ))}
              </div>
              <PaginationControls
                currentPage={historyPage}
                totalPages={historyTotalPages}
                totalItems={past.length}
                pageSize={pageSize}
                onPrevious={() => setHistoryPage(prev => Math.max(1, prev - 1))}
                onNext={() => setHistoryPage(prev => Math.min(historyTotalPages, prev + 1))}
              />
            </div>
          )}
        </div>
      )}

      {/* Cancel Modal */}
      {cancelId !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <i className="ti ti-calendar-x text-red-400 text-xl" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 text-center mb-1">
              Cancel appointment
            </h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              Are you sure you want to cancel this appointment? This action cannot be undone.
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
                {cancelMutation.isPending ? 'Cancelling...' : 'Yes, cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AppointmentCard({ appointment, onCancel }: {
  appointment: AppointmentResponse;
  onCancel?: () => void;
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-900">{appointment.doctorName}</h2>
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[appointment.status]}`}>
              {appointment.status.toLowerCase()}
            </span>
          </div>
          <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <i className="ti ti-calendar text-slate-400 text-sm" aria-hidden="true" />
              <span>{formatDateTime(appointment.appointmentDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="ti ti-clock text-slate-400 text-sm" aria-hidden="true" />
              <span>{appointment.durationMinutes} minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <i className="ti ti-file-text text-slate-400 text-sm" aria-hidden="true" />
              <span>{appointment.consultationId ? 'Consultation recorded' : 'Consultation pending'}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:items-end lg:min-w-64">
          <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 w-full">
            <p className="font-medium text-slate-800 mb-1">Visit notes</p>
            <p className="leading-6">{appointment.notes || 'No notes provided for this appointment.'}</p>
          </div>

          {appointment.status === 'SCHEDULED' && onCancel && (
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 border border-red-100 hover:border-red-300 px-4 py-2 rounded-lg transition-colors self-end"
            >
              <i className="ti ti-calendar-x text-sm" aria-hidden="true" />
              Cancel appointment
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

function StatCard({ icon, label, value, color, bg }: {
  icon: string;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}>
        <i className={`ti ${icon} ${color} text-base`} aria-hidden="true" />
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function PaginationControls({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPrevious,
  onNext,
}: {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPrevious: () => void;
  onNext: () => void;
}) {
  if (totalItems <= pageSize) {
    return null;
  }

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  return (
    <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-slate-600">
        Showing {start}-{end} of {totalItems}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={currentPage === 1}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          Previous
        </button>
        <span className="text-sm text-slate-600">
          Page {currentPage} of {totalPages}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={currentPage === totalPages}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}
