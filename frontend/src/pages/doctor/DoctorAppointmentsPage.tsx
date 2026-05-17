import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { CalendarDays, CheckCircle2, Clock3, FileText, UserRound, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/useAuth';

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

interface Page<T> {
  content: T[];
}

const statusStyles: Record<AppointmentResponse['status'], string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-100',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-100',
};

export default function DoctorAppointmentsPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | AppointmentResponse['status']>('ALL');
  const [dateFilter, setDateFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['doctor-appointments', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get('/api/appointments', {
        params: { page: 0, size: 200, sortBy: 'appointmentDate', sortDir: 'asc' },
      });
      return res.data.data as Page<AppointmentResponse>;
    }
  });

  const appointments = useMemo(() => {
    if (!user?.id) return [];
    return (data?.content ?? []).filter(appointment => appointment.doctorId === user.id);
  }, [data?.content, user?.id]);

  const now = Date.now();

  const stats = useMemo(() => {
    return appointments.reduce((acc, appointment) => {
      if (appointment.status === 'SCHEDULED') {
        acc.scheduled += 1;
        if (new Date(appointment.appointmentDate).getTime() >= now) {
          acc.upcoming += 1;
        }
      }
      if (appointment.status === 'COMPLETED') acc.completed += 1;
      if (appointment.status === 'CANCELLED') acc.cancelled += 1;
      return acc;
    }, { scheduled: 0, upcoming: 0, completed: 0, cancelled: 0 });
  }, [appointments, now]);

  const filteredAppointments = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return appointments.filter(appointment => {
      const matchesSearch =
        !normalizedSearch ||
        appointment.patientName.toLowerCase().includes(normalizedSearch) ||
        String(appointment.id).includes(normalizedSearch) ||
        String(appointment.patientId).includes(normalizedSearch);

      const matchesStatus =
        statusFilter === 'ALL' || appointment.status === statusFilter;

      const matchesDate =
        !dateFilter || toDateOnly(new Date(appointment.appointmentDate).toISOString()) === dateFilter;

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, dateFilter, searchTerm, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredAppointments.length / pageSize));
  const paginatedAppointments = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return filteredAppointments.slice(startIndex, startIndex + pageSize);
  }, [filteredAppointments, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [dateFilter, pageSize, searchTerm, statusFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
          Follow the visits assigned to you and keep track of what still needs consultation notes.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={<CalendarDays className="h-5 w-5 text-blue-600" />} label="Scheduled" value={stats.scheduled} tone="bg-blue-50" />
        <StatCard icon={<Clock3 className="h-5 w-5 text-indigo-600" />} label="Upcoming" value={stats.upcoming} tone="bg-indigo-50" />
        <StatCard icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />} label="Completed" value={stats.completed} tone="bg-emerald-50" />
        <StatCard icon={<XCircle className="h-5 w-5 text-rose-600" />} label="Cancelled" value={stats.cancelled} tone="bg-rose-50" />
      </div>

      {appointments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <CalendarDays className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">No appointments assigned yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Once patients start booking your published schedule, the visits will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-[1.1fr_0.8fr_0.8fr_auto]">
            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Search
              </span>
              <input
                value={searchTerm}
                onChange={event => setSearchTerm(event.target.value)}
                placeholder="Patient, appointment ID, patient ID..."
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Status
              </span>
              <select
                value={statusFilter}
                onChange={event => setStatusFilter(event.target.value as 'ALL' | AppointmentResponse['status'])}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ALL">All statuses</option>
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Appointment date
              </span>
              <input
                type="date"
                value={dateFilter}
                onChange={event => setDateFilter(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Per page
              </span>
              <select
                value={pageSize}
                onChange={event => setPageSize(Number(event.target.value))}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {[5, 10, 20].map(size => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {(searchTerm || statusFilter !== 'ALL' || dateFilter) && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('ALL');
                  setDateFilter('');
                }}
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}

          {filteredAppointments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <CalendarDays className="h-6 w-6" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">No appointments match these filters</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Try a different patient, status, or date.
              </p>
            </div>
          ) : paginatedAppointments.map(appointment => (
            <article key={appointment.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg font-semibold text-slate-900">{appointment.patientName}</h2>
                    <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[appointment.status]}`}>
                      {appointment.status.toLowerCase()}
                    </span>
                  </div>
                  <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <InfoRow icon={<CalendarDays className="h-4 w-4" />} label={formatDateTime(appointment.appointmentDate)} />
                    <InfoRow icon={<Clock3 className="h-4 w-4" />} label={`${appointment.durationMinutes} minutes`} />
                    <InfoRow icon={<UserRound className="h-4 w-4" />} label={`Patient ID #${appointment.patientId}`} />
                    <InfoRow
                      icon={<FileText className="h-4 w-4" />}
                      label={appointment.consultationId ? `Consultation #${appointment.consultationId}` : 'Consultation not added yet'}
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:min-w-72">
                  <p className="font-medium text-slate-800 mb-1">Appointment notes</p>
                  <p className="leading-6">{appointment.notes || 'No notes were attached to this appointment.'}</p>
                  <div className="mt-4">
                    {appointment.status === 'COMPLETED' && !appointment.consultationId ? (
                      <Link
                        to={`/doctor/consultations?appointmentId=${appointment.id}`}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        Add consultation
                      </Link>
                    ) : appointment.consultationId ? (
                      <Link
                        to="/doctor/consultations"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                      >
                        <FileText className="h-4 w-4" />
                        View consultations
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))}

          {filteredAppointments.length > 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, tone }: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 inline-flex rounded-xl p-3 ${tone}`}>
        {icon}
      </div>
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
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function toDateOnly(value: string) {
  return value.slice(0, 10);
}
