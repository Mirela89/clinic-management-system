import axios from 'axios';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileText, ShieldAlert, Stethoscope } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/useAuth';

interface ConsultationResponse {
  id: number;
  diagnosis: string;
  notes: string;
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

export default function PatientConsultationsPage() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['patient-consultations', user?.id],
    enabled: !!user?.id,
    retry: false,
    queryFn: async () => {
      const res = await api.get('/api/consultations', {
        params: { page: 0, size: 100, sortBy: 'consultationDate', sortDir: 'desc' },
        skipAuthRedirect: true,
      } as any);
      return res.data.data as Page<ConsultationResponse>;
    }
  });

  const accessRestricted = axios.isAxiosError(query.error) && query.error.response?.status === 403;

  const consultations = useMemo(() => {
    if (!user?.id) return [];
    return (query.data?.content ?? []).filter(consultation => consultation.patientId === user.id);
  }, [query.data?.content, user?.id]);

  if (query.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (accessRestricted) {
    return <AccessRestrictedCard feature="consultations" />;
  }

  if (query.isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
        Failed to load consultations.
      </div>
    );
  }

  if (consultations.length === 0) {
    return (
      <EmptyPatientState
        icon={<FileText className="h-6 w-6" />}
        title="No consultations yet"
        description="Your completed doctor visits will appear here once the medical record is added."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My consultations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review diagnoses, notes, and what happened during your completed visits.
        </p>
      </div>

      <div className="space-y-4">
        {consultations.map(consultation => (
          <article key={consultation.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Stethoscope className="h-4 w-4" />
                  Dr. {consultation.doctorName}
                </div>
                <h2 className="mt-3 text-lg font-semibold text-slate-900">{consultation.diagnosis}</h2>
                <p className="mt-1 text-sm text-slate-500">{formatDateTime(consultation.consultationDate)}</p>
              </div>
              <div className="grid gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:min-w-64">
                <span>Prescriptions: {consultation.prescriptionCount}</span>
                <span>Analyses: {consultation.analysisCount}</span>
                <span>Appointment ID: #{consultation.appointmentId}</span>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-600">
              {consultation.notes || 'No consultation notes were added.'}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}

function AccessRestrictedCard({ feature }: { feature: string }) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-white p-3 text-amber-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Patient access is not enabled yet</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The frontend route is ready, but the backend currently restricts patient access to `{feature}`.
            Once the API allows `PATIENT` on this endpoint, the page can display the patient records directly.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyPatientState({ icon, title, description }: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        {icon}
      </div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
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
