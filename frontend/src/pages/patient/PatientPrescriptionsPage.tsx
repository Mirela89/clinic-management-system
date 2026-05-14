import axios from 'axios';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pill, ShieldAlert } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/useAuth';

interface PrescriptionMedicationResponse {
  medicationId: number;
  medicationName: string;
  dosage: string;
  quantity: number;
  frequency: string;
  durationDays: number;
}

interface PrescriptionResponse {
  id: number;
  issueDate: string;
  expiryDate: string;
  instructions: string;
  consultationId: number;
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  medications: PrescriptionMedicationResponse[];
}

export default function PatientPrescriptionsPage() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['patient-prescriptions', user?.id],
    enabled: !!user?.id,
    retry: false,
    queryFn: async () => {
      const res = await api.get('/api/prescriptions', {
        skipAuthRedirect: true,
      } as any);
      return res.data.data as PrescriptionResponse[];
    }
  });

  const accessRestricted = axios.isAxiosError(query.error) && query.error.response?.status === 403;

  const prescriptions = useMemo(() => {
    if (!user?.id) return [];
    return (query.data ?? []).filter(prescription => prescription.patientId === user.id);
  }, [query.data, user?.id]);

  if (query.isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (accessRestricted) {
    return <AccessRestrictedCard />;
  }

  if (query.isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
        Failed to load prescriptions.
      </div>
    );
  }

  if (prescriptions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Pill className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">No prescriptions yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
          Prescriptions issued after your consultations will be listed here with medication details.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My prescriptions</h1>
        <p className="text-sm text-slate-500 mt-1">
          Check medication plans, dosage information, and expiration dates.
        </p>
      </div>

      <div className="space-y-4">
        {prescriptions.map(prescription => (
          <article key={prescription.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Issued by Dr. {prescription.doctorName}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {formatDate(prescription.issueDate)} - expires {formatDate(prescription.expiryDate)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Appointment #{prescription.appointmentId}
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              {prescription.instructions || 'No general instructions added.'}
            </p>

            <div className="mt-5 grid gap-3">
              {prescription.medications.map(medication => (
                <div key={medication.medicationId} className="rounded-xl border border-slate-200 px-4 py-3">
                  <p className="font-medium text-slate-900">{medication.medicationName}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {medication.dosage} · {medication.frequency} · {medication.durationDays} days · qty {medication.quantity}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function AccessRestrictedCard() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
      <div className="flex items-start gap-4">
        <div className="rounded-2xl bg-white p-3 text-amber-600">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Patient prescription access is not enabled yet</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            The page is wired in the frontend, but the backend currently allows prescription reads only for
            `DOCTOR` and `ADMIN`. Once patient access is exposed, this view can use the same route directly.
          </p>
        </div>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
