import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { CalendarDays, Droplets, Mail, MapPin, Phone, UserRound, UsersRound } from 'lucide-react';
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

interface PatientResponse {
  userId: number;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
  cnp: string;
  dateOfBirth: string;
  address: string | null;
  bloodType: string | null;
  insuranceId: number | null;
  insuranceProviderName: string | null;
}

interface Page<T> {
  content: T[];
}

export default function DoctorPatientsPage() {
  const { user } = useAuth();

  const appointmentsQuery = useQuery({
    queryKey: ['doctor-patients-appointments', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get('/api/appointments', {
        params: { page: 0, size: 200, sortBy: 'appointmentDate', sortDir: 'desc' },
      });
      return res.data.data as Page<AppointmentResponse>;
    }
  });

  const patientsQuery = useQuery({
    queryKey: ['doctor-patients-profiles'],
    queryFn: async () => {
      const res = await api.get('/api/patients', {
        params: { page: 0, size: 200, sortBy: 'dateOfBirth', sortDir: 'asc' },
      });
      return res.data.data as Page<PatientResponse>;
    }
  });

  const derivedPatients = useMemo(() => {
    if (!user?.id) return [];

    const doctorAppointments = (appointmentsQuery.data?.content ?? []).filter(
      appointment => appointment.doctorId === user.id
    );

    const byPatient = new Map<number, {
      profile: PatientResponse | undefined;
      appointmentCount: number;
      latestAppointment: string;
    }>();

    for (const appointment of doctorAppointments) {
      const existing = byPatient.get(appointment.patientId);
      const profile = (patientsQuery.data?.content ?? []).find(patient => patient.userId === appointment.patientId);

      if (!existing) {
        byPatient.set(appointment.patientId, {
          profile,
          appointmentCount: 1,
          latestAppointment: appointment.appointmentDate,
        });
        continue;
      }

      existing.appointmentCount += 1;
      if (new Date(appointment.appointmentDate).getTime() > new Date(existing.latestAppointment).getTime()) {
        existing.latestAppointment = appointment.appointmentDate;
      }
    }

    return Array.from(byPatient.entries())
      .map(([patientId, value]) => ({
        patientId,
        profile: value.profile,
        appointmentCount: value.appointmentCount,
        latestAppointment: value.latestAppointment,
      }))
      .sort(
        (a, b) => new Date(b.latestAppointment).getTime() - new Date(a.latestAppointment).getTime()
      );
  }, [appointmentsQuery.data?.content, patientsQuery.data?.content, user?.id]);

  if (appointmentsQuery.isLoading || patientsQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (appointmentsQuery.isError || patientsQuery.isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
        Failed to load doctor patients.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My patients</h1>
        <p className="text-sm text-slate-500 mt-1">
          Patients shown here are derived from the appointments currently assigned to you.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<UsersRound className="h-5 w-5 text-blue-600" />}
          label="Unique patients"
          value={derivedPatients.length}
          tone="bg-blue-50"
        />
        <SummaryCard
          icon={<CalendarDays className="h-5 w-5 text-emerald-600" />}
          label="Total assigned visits"
          value={derivedPatients.reduce((sum, patient) => sum + patient.appointmentCount, 0)}
          tone="bg-emerald-50"
        />
        <SummaryCard
          icon={<UserRound className="h-5 w-5 text-violet-600" />}
          label="Profiles found"
          value={derivedPatients.filter(patient => patient.profile).length}
          tone="bg-violet-50"
        />
      </div>

      {derivedPatients.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
            <UsersRound className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900">No patients assigned yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
            Your patient list will populate automatically once appointments are booked on your schedule.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {derivedPatients.map(patient => (
            <article key={patient.patientId} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                      <UserRound className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900">
                        {patient.profile
                          ? `${patient.profile.user.firstName} ${patient.profile.user.lastName}`
                          : `Patient #${patient.patientId}`}
                      </h2>
                      <p className="text-sm text-slate-500">
                        Latest appointment: {formatDateTime(patient.latestAppointment)}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
                    <InfoRow icon={<CalendarDays className="h-4 w-4" />} label={`${patient.appointmentCount} appointment(s)`} />
                    <InfoRow icon={<Mail className="h-4 w-4" />} label={patient.profile?.user.email || 'Email unavailable'} />
                    <InfoRow icon={<Phone className="h-4 w-4" />} label={patient.profile?.user.phone || 'Phone unavailable'} />
                    <InfoRow icon={<Droplets className="h-4 w-4" />} label={formatBloodType(patient.profile?.bloodType)} />
                    <InfoRow icon={<MapPin className="h-4 w-4" />} label={patient.profile?.address || 'Address unavailable'} />
                    <InfoRow icon={<UserRound className="h-4 w-4" />} label={`Patient ID #${patient.patientId}`} />
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:min-w-72">
                  <p className="font-medium text-slate-800 mb-1">Profile details</p>
                  <p className="leading-6">
                    {patient.profile
                      ? `Born on ${formatDate(patient.profile.dateOfBirth)}${patient.profile.insuranceProviderName ? ` • Insurance: ${patient.profile.insuranceProviderName}` : ''}.`
                      : 'The patient profile could not be matched from the current response payload.'}
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

function SummaryCard({ icon, label, value, tone }: {
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

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatBloodType(value?: string | null) {
  return value ? value.replace('_POSITIVE', '+').replace('_NEGATIVE', '-').replace('_', '') : 'Blood type unavailable';
}
