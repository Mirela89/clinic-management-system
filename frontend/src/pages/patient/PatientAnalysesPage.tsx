import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/useAuth';
import api from '../../api/axios';

interface AnalysisResult {
  parameter: string;
  value: string;
  unit: string;
  normalRange: string;
  status: 'NORMAL' | 'HIGH' | 'LOW';
}

interface AnalysisDocumentResponse {
  id: string;
  analysisId: number;
  patientId: number;
  doctorId: number;
  analysisType: string;
  results: AnalysisResult[];
  notes: string | null;
  createdAt: string;
}

interface MedicalAnalysisResponse {
  id: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  consultationId: number | null;
  analysisType: string;
  status: string;
  requestedDate: string;
  resultDate: string | null;
  mongoDocumentId: string | null;
}

const analysisTypeLabels: Record<string, string> = {
  BLOOD_TEST: 'Blood Test',
  URINE_TEST: 'Urine Test',
  MRI: 'MRI',
  CT_SCAN: 'CT Scan',
  XRAY: 'X-Ray',
  ULTRASOUND: 'Ultrasound',
  ECG: 'ECG',
};

const analysisTypeIcons: Record<string, string> = {
  BLOOD_TEST: 'ti-droplet',
  URINE_TEST: 'ti-flask',
  MRI: 'ti-brain',
  CT_SCAN: 'ti-scan',
  XRAY: 'ti-bone',
  ULTRASOUND: 'ti-wave-sine',
  ECG: 'ti-heart-rate-monitor',
};

const statusStyles: Record<string, string> = {
  PENDING: 'bg-yellow-50 text-yellow-600 border-yellow-100',
  IN_PROGRESS: 'bg-blue-50 text-blue-600 border-blue-100',
  COMPLETED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
};

const resultStatusStyles: Record<string, string> = {
  NORMAL: 'bg-emerald-50 text-emerald-600',
  HIGH: 'bg-red-50 text-red-600',
  LOW: 'bg-blue-50 text-blue-600',
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function PatientAnalysesPage() {
  const { user } = useAuth();

  const { data: analyses = [], isLoading: loadingAnalyses, isError } = useQuery({
    queryKey: ['patient-analyses', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get(`/api/analyses/patient/${user!.id}`);
      return res.data.data as MedicalAnalysisResponse[];
    }
  });

  const { data: documents = [] } = useQuery({
    queryKey: ['patient-analysis-documents', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get(`/api/analysis-documents/patient/${user!.id}`);
      return res.data.data as AnalysisDocumentResponse[];
    }
  });

  const documentsByAnalysisId = new Map(
    documents.map(d => [d.analysisId, d])
  );

  const stats = {
    total: analyses.length,
    completed: analyses.filter(a => a.status === 'COMPLETED').length,
    pending: analyses.filter(a => a.status === 'PENDING').length,
  };

  if (loadingAnalyses) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  );

  if (isError) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
      Failed to load analyses.
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">My Analyses</h1>
        <p className="text-slate-400 text-sm mt-1">
          View your medical analysis results and history
        </p>
      </div>

      {/* Stats */}
      {analyses.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center justify-center mb-3">
              <i className="ti ti-microscope text-slate-500 text-base" aria-hidden="true" />
            </div>
            <p className="text-2xl font-semibold text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-400 mt-0.5">Total analyses</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center mb-3">
              <i className="ti ti-circle-check text-emerald-500 text-base" aria-hidden="true" />
            </div>
            <p className="text-2xl font-semibold text-slate-900">{stats.completed}</p>
            <p className="text-xs text-slate-400 mt-0.5">Completed</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-100 p-5">
            <div className="w-9 h-9 bg-yellow-50 rounded-lg flex items-center justify-center mb-3">
              <i className="ti ti-clock text-yellow-500 text-base" aria-hidden="true" />
            </div>
            <p className="text-2xl font-semibold text-slate-900">{stats.pending}</p>
            <p className="text-xs text-slate-400 mt-0.5">Pending</p>
          </div>
        </div>
      )}

      {analyses.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
          <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="ti ti-microscope text-slate-300 text-2xl" aria-hidden="true" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 mb-1">No analyses yet</h2>
          <p className="text-sm text-slate-400">
            Your medical analysis results will appear here after your doctor adds them.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {analyses.map(a => {
            const doc = documentsByAnalysisId.get(a.id);
            const icon = analysisTypeIcons[a.analysisType] || 'ti-microscope';

            return (
              <div key={a.id} className="bg-white rounded-xl border border-slate-100 p-5">

                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <i className={`ti ${icon} text-blue-500 text-base`} aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {analysisTypeLabels[a.analysisType] || a.analysisType}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Dr. {a.doctorName} · {formatDate(a.requestedDate)}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${statusStyles[a.status]}`}>
                    {a.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Notes */}
                {doc?.notes && (
                  <div className="bg-slate-50 rounded-lg px-4 py-3 mb-4">
                    <p className="text-xs text-slate-400 mb-1">Notes</p>
                    <p className="text-sm text-slate-600">{doc.notes}</p>
                  </div>
                )}

                {/* Results from MongoDB */}
                {doc && doc.results.length > 0 ? (
                  <div>
                    <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">
                      Results — {doc.results.length} parameter{doc.results.length !== 1 ? 's' : ''}
                    </p>
                    <div className="flex flex-col gap-2">
                      {doc.results.map((r, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between gap-4 border border-slate-100 rounded-lg px-4 py-3"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-slate-900">{r.parameter}</p>
                            {r.normalRange && (
                              <p className="text-xs text-slate-400 mt-0.5">
                                Normal: {r.normalRange} {r.unit}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-sm font-semibold text-slate-900">
                              {r.value} {r.unit}
                            </span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${resultStatusStyles[r.status]}`}>
                              {r.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : a.status === 'COMPLETED' ? (
                  <p className="text-xs text-slate-400 italic">No detailed results available.</p>
                ) : (
                  <p className="text-xs text-slate-400 italic">
                    Results will appear here once the analysis is completed.
                  </p>
                )}

                {/* Footer */}
                {a.resultDate && (
                  <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50">
                    <i className="ti ti-calendar-check text-slate-300 text-xs" aria-hidden="true" />
                    <span className="text-xs text-slate-400">
                      Result date: {formatDate(a.resultDate)}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}