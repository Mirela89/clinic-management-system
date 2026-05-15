import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/useAuth';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

interface AppointmentResponse {
  id: number;
  appointmentDate: string;
  durationMinutes: number;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes: string | null;
  doctorName: string;
  consultationId: number | null;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function PatientDashboardPage() {
  const { user } = useAuth();

  const { data: appointments = [] } = useQuery({
    queryKey: ['patient-appointments', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get(`/api/appointments/patient/${user!.id}`);
      return res.data.data as AppointmentResponse[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const upcoming = appointments
    .filter(a => a.status === 'SCHEDULED')
    .sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

  const nextAppointment = upcoming[0] || null;

  const stats = {
    scheduled: appointments.filter(a => a.status === 'SCHEDULED').length,
    completed: appointments.filter(a => a.status === 'COMPLETED').length,
  };

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Welcome, {user?.firstName}!
        </h1>
        <p className="text-slate-400 text-sm mt-1">{today}</p>
      </div>

      {/* Next appointment banner */}
      {nextAppointment ? (
        <div className="bg-slate-900 rounded-xl p-5 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="ti ti-calendar-event text-white text-lg" aria-hidden="true" />
            </div>
            <div>
              <p className="text-xs text-slate-400 mb-0.5">Next appointment</p>
              <p className="text-white font-medium text-sm">{nextAppointment.doctorName}</p>
              <p className="text-slate-400 text-xs mt-0.5">
                {formatDateTime(nextAppointment.appointmentDate)} · {nextAppointment.durationMinutes} min
              </p>
            </div>
          </div>
          <Link
            to="/patient/appointments"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors flex-shrink-0"
          >
            View all
            <i className="ti ti-arrow-right text-xs" aria-hidden="true" />
          </Link>
        </div>
      ) : (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <i className="ti ti-calendar-plus text-blue-500 text-lg" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">No upcoming appointments</p>
              <p className="text-xs text-slate-400 mt-0.5">Book a visit with one of our specialists</p>
            </div>
          </div>
          <Link
            to="/patient/book-appointment"
            className="flex items-center gap-1.5 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors flex-shrink-0"
          >
            <i className="ti ti-calendar-plus text-xs" aria-hidden="true" />
            Book now
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="w-9 h-9 bg-blue-50 rounded-lg flex items-center justify-center mb-3">
            <i className="ti ti-clock text-blue-500 text-base" aria-hidden="true" />
          </div>
          <p className="text-2xl font-semibold text-slate-900">{stats.scheduled}</p>
          <p className="text-xs text-slate-400 mt-0.5">Upcoming appointment{stats.scheduled !== 1 ? 's' : ''}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center mb-3">
            <i className="ti ti-circle-check text-emerald-500 text-base" aria-hidden="true" />
          </div>
          <p className="text-2xl font-semibold text-slate-900">{stats.completed}</p>
          <p className="text-xs text-slate-400 mt-0.5">Completed visit{stats.completed !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {/* Quick links */}
      <div className="bg-white rounded-xl border border-slate-100 p-5">
        <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
          Quick access
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <QuickLink
            to="/patient/appointments"
            icon="ti-calendar"
            label="My Appointments"
            description="View and manage your visits"
            color="text-blue-500"
            bg="bg-blue-50"
          />
          <QuickLink
            to="/patient/consultations"
            icon="ti-file-text"
            label="My Consultations"
            description="View your medical history"
            color="text-emerald-500"
            bg="bg-emerald-50"
          />
          <QuickLink
            to="/patient/prescriptions"
            icon="ti-pill"
            label="My Prescriptions"
            description="View your active prescriptions"
            color="text-purple-500"
            bg="bg-purple-50"
          />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ to, icon, label, description, color, bg }: {
  to: string;
  icon: string;
  label: string;
  description: string;
  color: string;
  bg: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 p-4 rounded-xl border border-slate-100 hover:border-slate-200 hover:bg-slate-50 transition-all group"
    >
      <div className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <i className={`ti ${icon} ${color} text-base`} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{description}</p>
      </div>
      <i className="ti ti-arrow-right text-slate-300 text-sm ml-auto group-hover:text-slate-500 transition-colors flex-shrink-0" aria-hidden="true" />
    </Link>
  );
}