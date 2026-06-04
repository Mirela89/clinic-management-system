import { useAuth } from '../../context/useAuth';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

interface AppointmentResponse {
  id: number;
  appointmentDate: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  patientName: string;
  doctorName: string;
}

interface Page<T> {
  content: T[];
  totalElements: number;
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
  CANCELLED: 'bg-red-50 text-red-600 border-red-100',
};

export default function DashboardPage() {
  const { user } = useAuth();

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const { data: patientsData } = useQuery({
    queryKey: ['admin-patients-count'],
    queryFn: async () => {
      const res = await api.get('/api/patients?page=0&size=1');
      return res.data.data as Page<any>;
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await api.get('/api/doctors');
      return res.data.data as any[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments-admin'],
    queryFn: async () => {
      const res = await api.get('/api/departments');
      return res.data.data as any[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: appointmentsData } = useQuery({
    queryKey: ['admin-appointments-dashboard'],
    queryFn: async () => {
      const res = await api.get('/api/appointments?page=0&size=100&sortBy=appointmentDate&sortDir=desc');
      return res.data.data as Page<AppointmentResponse>;
    },
    staleTime: 2 * 60 * 1000,
  });

  const appointments = appointmentsData?.content ?? [];
  const scheduled = appointments.filter(a => a.status === 'SCHEDULED').length;
  const recentAppointments = appointments.slice(0, 5);

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          Good morning, {user?.firstName}
        </h1>
        <p className="text-slate-400 text-sm mt-1">{today}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          icon="ti-users"
          label="Total Patients"
          value={patientsData?.totalElements ?? '—'}
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
          to="/patients"
        />
        <StatCard
          icon="ti-calendar"
          label="Scheduled"
          value={scheduled}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
          to="/appointments"
        />
        <StatCard
          icon="ti-stethoscope"
          label="Doctors"
          value={doctors.length}
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
          to="/doctors"
        />
        <StatCard
          icon="ti-building-hospital"
          label="Departments"
          value={departments.length}
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
          to="/departments"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Recent appointments */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
              Recent Appointments
            </h2>
            <Link
              to="/appointments"
              className="text-xs text-blue-500 hover:underline flex items-center gap-1"
            >
              View all
              <i className="ti ti-arrow-right text-xs" aria-hidden="true" />
            </Link>
          </div>

          {recentAppointments.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              No appointments yet.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {recentAppointments.map(a => (
                <div key={a.id} className="flex items-center justify-between gap-3 border border-slate-50 rounded-lg px-3 py-2.5 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      {a.patientName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{a.patientName}</p>
                      <p className="text-xs text-slate-400">{a.doctorName} · {formatDateTime(a.appointmentDate)}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border flex-shrink-0 ${statusStyles[a.status]}`}>
                    {a.status.charAt(0) + a.status.slice(1).toLowerCase()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick links */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide mb-4">
              Quick Access
            </h2>
            <div className="flex flex-col gap-2">
              {[
                { to: '/patients', icon: 'ti-users', label: 'Patients', color: 'text-blue-500', bg: 'bg-blue-50' },
                { to: '/doctors', icon: 'ti-stethoscope', label: 'Doctors', color: 'text-orange-500', bg: 'bg-orange-50' },
                { to: '/appointments', icon: 'ti-calendar', label: 'Appointments', color: 'text-emerald-500', bg: 'bg-emerald-50' },
                { to: '/consultations', icon: 'ti-file-text', label: 'Consultations', color: 'text-purple-500', bg: 'bg-purple-50' },
                { to: '/departments', icon: 'ti-building-hospital', label: 'Departments', color: 'text-slate-500', bg: 'bg-slate-100' },
                { to: '/insurances', icon: 'ti-shield-check', label: 'Insurances', color: 'text-teal-500', bg: 'bg-teal-50' },
              ].map(item => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-slate-50 transition-colors group"
                >
                  <div className={`w-7 h-7 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <i className={`ti ${item.icon} ${item.color} text-sm`} aria-hidden="true" />
                  </div>
                  <span className="text-sm text-slate-700 group-hover:text-slate-900 transition-colors">{item.label}</span>
                  <i className="ti ti-arrow-right text-slate-300 text-xs ml-auto group-hover:text-slate-500 transition-colors" aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>

          {/* Departments overview */}
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
                Departments
              </h2>
              <Link to="/departments" className="text-xs text-blue-500 hover:underline">
                Manage
              </Link>
            </div>
            {departments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">No departments yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {departments.slice(0, 4).map((dept: any) => (
                  <div key={dept.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <i className="ti ti-building-hospital text-slate-300 text-xs" aria-hidden="true" />
                      <span className="text-sm text-slate-700">{dept.name}</span>
                    </div>
                    <span className="text-xs text-slate-400">{dept.doctorCount} dr.</span>
                  </div>
                ))}
                {departments.length > 4 && (
                  <p className="text-xs text-slate-400 text-center pt-1">
                    +{departments.length - 4} more
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

function StatCard({ icon, label, value, iconBg, iconColor, to }: {
  icon: string;
  label: string;
  value: number | string;
  iconBg: string;
  iconColor: string;
  to: string;
}) {
  return (
    <Link to={to} className="bg-white rounded-xl border border-slate-100 p-5 hover:border-slate-200 transition-colors block">
      <div className={`w-9 h-9 ${iconBg} rounded-lg flex items-center justify-center mb-3`}>
        <i className={`ti ${icon} ${iconColor} text-base`} aria-hidden="true" />
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </Link>
  );
}