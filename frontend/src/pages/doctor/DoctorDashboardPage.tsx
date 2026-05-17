import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Clock, FileText, Users } from 'lucide-react';
import type { ReactNode } from 'react';
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

interface ConsultationResponse {
  id: number;
  diagnosis: string;
  notes: string | null;
  consultationDate: string;
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  prescriptionCount: number;
  analysisCount: number;
}

interface Page<T> {
  content: T[];
}

export default function DoctorDashboardPage() {
  const { user } = useAuth();

  const appointmentsQuery = useQuery({
    queryKey: ['doctor-dashboard-appointments', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get('/api/appointments', {
        params: { page: 0, size: 200, sortBy: 'appointmentDate', sortDir: 'asc' },
      });
      return res.data.data as Page<AppointmentResponse>;
    }
  });

  const consultationsQuery = useQuery({
    queryKey: ['doctor-dashboard-consultations', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get('/api/consultations', {
        params: { page: 0, size: 200, sortBy: 'consultationDate', sortDir: 'desc' },
      });
      return res.data.data as Page<ConsultationResponse>;
    }
  });

  const doctorAppointments = useMemo(() => {
    if (!user?.id) return [];
    return (appointmentsQuery.data?.content ?? []).filter(appointment => appointment.doctorId === user.id);
  }, [appointmentsQuery.data?.content, user?.id]);

  const doctorConsultations = useMemo(() => {
    if (!user?.id) return [];
    return (consultationsQuery.data?.content ?? []).filter(consultation => consultation.doctorId === user.id);
  }, [consultationsQuery.data?.content, user?.id]);

  const todayAppointments = useMemo(() => {
    const todayKey = toDateOnly(new Date().toISOString());
    return doctorAppointments
      .filter(appointment => toDateOnly(new Date(appointment.appointmentDate).toISOString()) === todayKey)
      .sort((left, right) => new Date(left.appointmentDate).getTime() - new Date(right.appointmentDate).getTime());
  }, [doctorAppointments]);

  const myPatientsCount = useMemo(() => {
    return new Set(doctorAppointments.map(appointment => appointment.patientId)).size;
  }, [doctorAppointments]);

  const isLoading = appointmentsQuery.isLoading || consultationsQuery.isLoading;
  const isError = appointmentsQuery.isError || consultationsQuery.isError;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, Dr. {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-gray-500 mt-1">Here is your live overview for today.</p>
      </div>

      {isError && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Failed to load doctor dashboard data.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={<Calendar className="h-6 w-6" />}
          label="Today's Appointments"
          value={isLoading ? '...' : todayAppointments.length.toString()}
          color="blue"
          link="/doctor/appointments"
        />
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="My Patients"
          value={isLoading ? '...' : myPatientsCount.toString()}
          color="green"
          link="/doctor/patients"
        />
        <StatCard
          icon={<FileText className="h-6 w-6" />}
          label="Consultations"
          value={isLoading ? '...' : doctorConsultations.length.toString()}
          color="purple"
          link="/doctor/consultations"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Today's appointments</h2>
              <p className="mt-1 text-sm text-slate-500">
                Visits scheduled for {formatDateLabel(new Date().toISOString())}.
              </p>
            </div>
            <Link
              to="/doctor/appointments"
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              View all
            </Link>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
            </div>
          ) : todayAppointments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No appointments scheduled for today.
            </div>
          ) : (
            <div className="space-y-3">
              {todayAppointments.slice(0, 5).map(appointment => (
                <article key={appointment.id} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-base font-semibold text-slate-900">{appointment.patientName}</h3>
                        <span className={`rounded-full border px-3 py-1 text-xs font-medium ${statusStyles[appointment.status]}`}>
                          {appointment.status.toLowerCase()}
                        </span>
                      </div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                        <InfoRow icon={<Clock className="h-4 w-4" />} label={formatDateTime(appointment.appointmentDate)} />
                        <InfoRow icon={<Calendar className="h-4 w-4" />} label={`${appointment.durationMinutes} minutes`} />
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
            </div>
          )}
        </section>

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-2 gap-3">
            <Link
              to="/doctor/appointments"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
            >
              <Calendar className="h-6 w-6 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">My Appointments</span>
            </Link>
            <Link
              to="/doctor/consultations"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors text-center"
            >
              <FileText className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium text-gray-700">Consultations</span>
            </Link>
            <Link
              to="/doctor/patients"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-center"
            >
              <Users className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">My Patients</span>
            </Link>
            <Link
              to="/doctor/schedule"
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-center"
            >
              <Clock className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium text-gray-700">My Schedule</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, link }: {
  icon: ReactNode;
  label: string;
  value: string;
  color: 'blue' | 'green' | 'purple';
  link: string;
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Link to={link} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-blue-200 transition-colors">
      <div className={`inline-flex p-2 rounded-lg ${colors[color]} mb-4`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </Link>
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

function formatDateLabel(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function toDateOnly(value: string) {
  return value.slice(0, 10);
}

const statusStyles: Record<AppointmentResponse['status'], string> = {
  SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-100',
  COMPLETED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  CANCELLED: 'bg-rose-50 text-rose-700 border-rose-100',
};
