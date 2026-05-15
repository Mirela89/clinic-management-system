import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/useAuth';
import api from '../../api/axios';

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

function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function PatientConsultationsPage() {
  const { user } = useAuth();

  const { data: consultations = [], isLoading, isError } = useQuery({
    queryKey: ['patient-consultations', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get(`/api/consultations/patient/${user!.id}`);
      return res.data.data as ConsultationResponse[];
    }
  });

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (isError) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
      Failed to load consultations.
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">My Consultations</h1>
        <p className="text-slate-400 text-sm mt-1">
          Review your diagnoses, notes and medical history
        </p>
      </div>

      {consultations.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="ti ti-file-text text-slate-300 text-2xl" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">No consultations yet</h2>
          <p className="text-sm text-slate-400">
            Your medical consultations will appear here after your doctor visits.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {consultations.map(c => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-100 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:justify-between">

                {/* Left */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                      {c.doctorName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <p className="text-xs text-slate-400">Dr. {c.doctorName}</p>
                      <p className="text-xs text-slate-300">{formatDateTime(c.consultationDate)}</p>
                    </div>
                  </div>

                  <h2 className="text-base font-semibold text-slate-900 mb-2">
                    {c.diagnosis}
                  </h2>

                  {c.notes && (
                    <p className="text-sm text-slate-500 leading-relaxed">
                      {c.notes}
                    </p>
                  )}
                </div>

                {/* Right */}
                <div className="flex flex-col gap-2 lg:min-w-48 bg-slate-50 rounded-xl px-4 py-3">
                  <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mb-1">
                    Summary
                  </p>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <i className="ti ti-pill text-slate-400 text-xs" aria-hidden="true" />
                    <span>{c.prescriptionCount} prescription{c.prescriptionCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <i className="ti ti-microscope text-slate-400 text-xs" aria-hidden="true" />
                    <span>{c.analysisCount} analysis result{c.analysisCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <i className="ti ti-calendar text-slate-400 text-xs" aria-hidden="true" />
                    <span>Appointment #{c.appointmentId}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}