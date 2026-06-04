import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChangeEvent, FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/useAuth';

// ==================== INTERFACES ====================
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
  instructions: string | null;
  consultationId: number;
  patientName: string;
  medications: PrescriptionMedicationResponse[];
}

interface AnalysisDocumentResponse {
  id: string;
  analysisId: number;
  patientId: number;
  analysisType: string;
  results: AnalysisResult[];
  notes: string | null;
  createdAt: string;
}

interface AnalysisResult {
  parameter: string;
  value: string;
  unit: string;
  normalRange: string;
  status: 'NORMAL' | 'HIGH' | 'LOW';
}

interface MedicationResponse {
  id: number;
  name: string;
  activeSubstance: string | null;
  dosage: string;
  manufacturer: string | null;
}

interface Page<T> { content: T[]; }

type MedicationFrequency = 'ONCE_DAILY' | 'TWICE_DAILY' | 'THREE_TIMES_DAILY' | 'EVERY_8_HOURS' | 'EVERY_12_HOURS' | 'AS_NEEDED';

type MedicationRow = { medicationId: string; quantity: string; frequency: MedicationFrequency; durationDays: string; };
type ConsultationForm = { appointmentId: string; diagnosis: string; notes: string; consultationDate: string; };
type PrescriptionForm = { issueDate: string; expiryDate: string; instructions: string; medications: MedicationRow[]; };
type AnalysisResultForm = { parameter: string; value: string; unit: string; normalRange: string; status: 'NORMAL' | 'HIGH' | 'LOW'; };
type AnalysisForm = { analysisType: string; status: string; requestedDate: string; notes: string; results: AnalysisResultForm[]; };

const frequencyOptions: Array<{ value: MedicationFrequency; label: string }> = [
  { value: 'ONCE_DAILY', label: 'Once daily' },
  { value: 'TWICE_DAILY', label: 'Twice daily' },
  { value: 'THREE_TIMES_DAILY', label: 'Three times daily' },
  { value: 'EVERY_8_HOURS', label: 'Every 8 hours' },
  { value: 'EVERY_12_HOURS', label: 'Every 12 hours' },
  { value: 'AS_NEEDED', label: 'As needed' },
];
const frequencyLabels: Record<string, string> = Object.fromEntries(frequencyOptions.map(o => [o.value, o.label]));

const analysisTypeLabels: Record<string, string> = {
  BLOOD_TEST: 'Blood Test', URINE_TEST: 'Urine Test', MRI: 'MRI',
  CT_SCAN: 'CT Scan', XRAY: 'X-Ray', ULTRASOUND: 'Ultrasound', ECG: 'ECG',
};

function createMedRow(): MedicationRow { return { medicationId: '', quantity: '1', frequency: 'ONCE_DAILY', durationDays: '7' }; }
function createResultRow(): AnalysisResultForm { return { parameter: '', value: '', unit: '', normalRange: '', status: 'NORMAL' }; }

function getInitialPrescriptionForm(): PrescriptionForm {
  const today = new Date();
  const expiry = new Date(today);
  expiry.setDate(expiry.getDate() + 7);
  return { issueDate: toDateOnly(today.toISOString()), expiryDate: toDateOnly(expiry.toISOString()), instructions: '', medications: [createMedRow()] };
}

function getInitialAnalysisForm(): AnalysisForm {
  return { analysisType: 'BLOOD_TEST', status: 'COMPLETED', requestedDate: new Date().toISOString().slice(0, 10), notes: '', results: [createResultRow()] };
}

function toDateOnly(v: string) { return v.slice(0, 10); }
function toDateTimeLocal(v: string) {
  const d = new Date(v);
  const p = (n: number) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}
function formatDateTime(v: string) {
  return new Date(v).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function formatDate(v: string) {
  return new Date(v).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ==================== MEDICATION SEARCH ====================
function MedicationSearchSelect({ medications, value, onChange }: {
  medications: MedicationResponse[]; value: string; onChange: (id: string) => void;
}) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const selected = medications.find(m => String(m.id) === value);
  const filtered = medications.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    (m.activeSubstance || '').toLowerCase().includes(search.toLowerCase())
  );
  return (
    <div className="relative">
      <div onClick={() => setOpen(o => !o)} className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm cursor-pointer flex items-center justify-between bg-white">
        <span className={selected ? 'text-slate-800' : 'text-slate-400'}>
          {selected ? `${selected.name} (${selected.dosage})` : 'Select medication...'}
        </span>
        <i className={`ti ti-chevron-${open ? 'up' : 'down'} text-slate-400 text-xs`} aria-hidden="true" />
      </div>
      {open && (
        <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" aria-hidden="true" />
              <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="Search medication..."
                className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No medications found.</p>
            ) : filtered.map(m => (
              <div key={m.id} onClick={() => { onChange(String(m.id)); setOpen(false); setSearch(''); }}
                className={`px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${value === String(m.id) ? 'bg-blue-50' : ''}`}>
                <p className="text-sm font-medium text-slate-800">{m.name}</p>
                <p className="text-xs text-slate-400">{m.dosage}{m.activeSubstance ? ` · ${m.activeSubstance}` : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== CONSULTATION MODAL ====================
function ConsultationModal({
  consultation, prescriptions, analysisDocuments, medications,
  onClose, onPrescriptionCreated, onAnalysisCreated, user
}: {
  consultation: ConsultationResponse;
  prescriptions: PrescriptionResponse[];
  analysisDocuments: AnalysisDocumentResponse[];
  medications: MedicationResponse[];
  onClose: () => void;
  onPrescriptionCreated: () => void;
  onAnalysisCreated: () => void;
  user: any;
}) {
  const [activeTab, setActiveTab] = useState<'details' | 'prescription' | 'analysis'>('details');
  const [prescriptionForm, setPrescriptionForm] = useState<PrescriptionForm>(getInitialPrescriptionForm());
  const [prescriptionError, setPrescriptionError] = useState('');
  const [analysisForm, setAnalysisForm] = useState<AnalysisForm>(getInitialAnalysisForm());
  const [analysisError, setAnalysisError] = useState('');

  const resultStatusStyles: Record<string, string> = {
    NORMAL: 'bg-emerald-50 text-emerald-600',
    HIGH: 'bg-red-50 text-red-600',
    LOW: 'bg-blue-50 text-blue-600',
  };

  const createPrescriptionMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/prescriptions', {
        issueDate: prescriptionForm.issueDate,
        expiryDate: prescriptionForm.expiryDate,
        instructions: prescriptionForm.instructions.trim() || null,
        consultationId: consultation.id,
        medications: prescriptionForm.medications.map(m => ({
          medicationId: Number(m.medicationId),
          quantity: Number(m.quantity),
          frequency: m.frequency,
          durationDays: Number(m.durationDays),
        })),
      });
    },
    onSuccess: () => {
      onPrescriptionCreated();
      setPrescriptionForm(getInitialPrescriptionForm());
      setPrescriptionError('');
      setActiveTab('details');
    },
    onError: (err: any) => setPrescriptionError(err.response?.data?.message || 'Failed to create prescription.')
  });

  const createAnalysisMutation = useMutation({
    mutationFn: async () => {
      const analysisRes = await api.post('/api/analyses', {
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        consultationId: consultation.id,
        analysisType: analysisForm.analysisType,
        status: analysisForm.status,
        requestedDate: analysisForm.requestedDate,
        resultDate: analysisForm.status === 'COMPLETED' ? analysisForm.requestedDate : null,
      });
      const analysisId = analysisRes.data.data.id;
      await api.post('/api/analysis-documents', {
        analysisId,
        patientId: consultation.patientId,
        doctorId: consultation.doctorId,
        analysisType: analysisForm.analysisType,
        notes: analysisForm.notes || null,
        results: analysisForm.results.filter(r => r.parameter.trim()),
      });
    },
    onSuccess: () => {
      onAnalysisCreated();
      setAnalysisForm(getInitialAnalysisForm());
      setAnalysisError('');
      setActiveTab('details');
    },
    onError: (err: any) => setAnalysisError(err.response?.data?.message || 'Failed to create analysis.')
  });

  const handlePrescriptionSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPrescriptionError('');
    if (!prescriptionForm.issueDate || !prescriptionForm.expiryDate) { setPrescriptionError('Issue and expiry date are required.'); return; }
    if (prescriptionForm.expiryDate < prescriptionForm.issueDate) { setPrescriptionError('Expiry date must be after issue date.'); return; }
    for (const m of prescriptionForm.medications) {
      if (!m.medicationId) { setPrescriptionError('Select a medication for each row.'); return; }
      if (Number(m.quantity) < 1 || Number(m.durationDays) < 1) { setPrescriptionError('Quantity and duration must be at least 1.'); return; }
    }
    createPrescriptionMutation.mutate();
  };

  const handleAnalysisSubmit = (e: FormEvent) => {
    e.preventDefault();
    setAnalysisError('');
    if (!analysisForm.requestedDate) { setAnalysisError('Requested date is required.'); return; }
    createAnalysisMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-white text-sm font-medium">
              {consultation.patientName.split(' ').map(n => n[0]).slice(0, 2).join('')}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">{consultation.patientName}</p>
              <p className="text-xs text-slate-400">{formatDateTime(consultation.consultationDate)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors">
            <i className="ti ti-x text-lg" aria-hidden="true" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
          {([
            { key: 'details', label: 'Details', icon: 'ti-file-text' },
            { key: 'prescription', label: 'Add prescription', icon: 'ti-pill' },
            { key: 'analysis', label: 'Add analysis', icon: 'ti-microscope' },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <i className={`ti ${tab.icon} text-xs`} aria-hidden="true" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-4">

          {/* DETAILS TAB */}
          {activeTab === 'details' && (
            <div className="flex flex-col gap-4">
              {/* Diagnosis + notes */}
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Diagnosis</p>
                <p className="text-sm font-semibold text-slate-900">{consultation.diagnosis}</p>
                {consultation.notes && (
                  <p className="text-sm text-slate-500 mt-1 leading-relaxed">{consultation.notes}</p>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-slate-400 mb-0.5">Prescriptions</p>
                  <p className="text-lg font-semibold text-slate-900">{consultation.prescriptionCount}</p>
                </div>
                <div className="bg-slate-50 rounded-lg px-4 py-3">
                  <p className="text-xs text-slate-400 mb-0.5">Analyses</p>
                  <p className="text-lg font-semibold text-slate-900">{consultation.analysisCount}</p>
                </div>
              </div>

              {/* Prescriptions */}
              {prescriptions.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Prescriptions</p>
                  <div className="flex flex-col gap-2">
                    {prescriptions.map(p => (
                      <div key={p.id} className="bg-slate-50 rounded-lg px-4 py-3">
                        <p className="text-xs text-slate-500 mb-2">
                          Issued {formatDate(p.issueDate)} · expires {formatDate(p.expiryDate)}
                        </p>
                        {p.instructions && (
                          <p className="text-xs text-slate-500 mb-2 italic">"{p.instructions}"</p>
                        )}
                        <div className="flex flex-col gap-1.5">
                          {p.medications.map(m => (
                            <div key={m.medicationId} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                              <div>
                                <p className="text-sm font-medium text-slate-800">{m.medicationName}</p>
                                <p className="text-xs text-slate-400">{m.dosage}</p>
                              </div>
                              <div className="flex gap-1.5 flex-wrap justify-end">
                                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{frequencyLabels[m.frequency] || m.frequency}</span>
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{m.durationDays} days</span>
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">qty {m.quantity}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Analysis documents */}
              {analysisDocuments.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Analyses</p>
                  <div className="flex flex-col gap-2">
                    {analysisDocuments.map(doc => (
                      <div key={doc.id} className="bg-slate-50 rounded-lg px-4 py-3">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-slate-800">
                            {analysisTypeLabels[doc.analysisType] || doc.analysisType}
                          </p>
                          <p className="text-xs text-slate-400">{formatDate(doc.createdAt)}</p>
                        </div>
                        {doc.notes && (
                          <p className="text-xs text-slate-500 mb-2 italic">"{doc.notes}"</p>
                        )}
                        {doc.results.length > 0 && (
                          <div className="flex flex-col gap-1.5">
                            {doc.results.map((r, i) => (
                              <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                                <div>
                                  <p className="text-sm font-medium text-slate-800">{r.parameter}</p>
                                  {r.normalRange && <p className="text-xs text-slate-400">Normal: {r.normalRange} {r.unit}</p>}
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-semibold text-slate-900">{r.value} {r.unit}</span>
                                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${resultStatusStyles[r.status]}`}>{r.status}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PRESCRIPTION TAB */}
          {activeTab === 'prescription' && (
            <form onSubmit={handlePrescriptionSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Issue date</label>
                  <input type="date" value={prescriptionForm.issueDate}
                    onChange={e => setPrescriptionForm(p => ({ ...p, issueDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Expiry date</label>
                  <input type="date" value={prescriptionForm.expiryDate}
                    onChange={e => setPrescriptionForm(p => ({ ...p, expiryDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Instructions</label>
                  <input value={prescriptionForm.instructions}
                    onChange={e => setPrescriptionForm(p => ({ ...p, instructions: e.target.value }))}
                    placeholder="General instructions..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Medications</p>
                <button type="button" onClick={() => setPrescriptionForm(p => ({ ...p, medications: [...p.medications, createMedRow()] }))}
                  className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
                  <i className="ti ti-plus text-xs" aria-hidden="true" /> Add row
                </button>
              </div>

              <div className="flex flex-col gap-3">
                {prescriptionForm.medications.map((row, index) => (
                  <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <MedicationSearchSelect medications={medications} value={row.medicationId}
                      onChange={id => setPrescriptionForm(p => ({
                        ...p, medications: p.medications.map((m, i) => i === index ? { ...m, medicationId: id } : m)
                      }))} />
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Frequency</label>
                        <select value={row.frequency}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) => setPrescriptionForm(p => ({
                            ...p, medications: p.medications.map((m, i) => i === index ? { ...m, frequency: e.target.value as MedicationFrequency } : m)
                          }))}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500">
                          {frequencyOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Days</label>
                        <input type="number" min={1} value={row.durationDays}
                          onChange={e => setPrescriptionForm(p => ({
                            ...p, medications: p.medications.map((m, i) => i === index ? { ...m, durationDays: e.target.value } : m)
                          }))}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">Qty</label>
                        <input type="number" min={1} value={row.quantity}
                          onChange={e => setPrescriptionForm(p => ({
                            ...p, medications: p.medications.map((m, i) => i === index ? { ...m, quantity: e.target.value } : m)
                          }))}
                          className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                    </div>
                    {prescriptionForm.medications.length > 1 && (
                      <button type="button"
                        onClick={() => setPrescriptionForm(p => ({ ...p, medications: p.medications.filter((_, i) => i !== index) }))}
                        className="mt-2 text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                        <i className="ti ti-trash text-xs" aria-hidden="true" /> Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {prescriptionError && (
                <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <i className="ti ti-alert-circle text-base flex-shrink-0" aria-hidden="true" />
                  {prescriptionError}
                </div>
              )}

              <div className="flex justify-end">
                <button type="submit" disabled={createPrescriptionMutation.isPending}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                  {createPrescriptionMutation.isPending ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                  ) : 'Create prescription'}
                </button>
              </div>
            </form>
          )}

          {/* ANALYSIS TAB */}
          {activeTab === 'analysis' && (
            <form onSubmit={handleAnalysisSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Analysis type</label>
                  <select value={analysisForm.analysisType}
                    onChange={e => setAnalysisForm(p => ({ ...p, analysisType: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {Object.entries(analysisTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Status</label>
                  <select value={analysisForm.status}
                    onChange={e => setAnalysisForm(p => ({ ...p, status: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="PENDING">Pending</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Requested date</label>
                  <input type="date" value={analysisForm.requestedDate}
                    onChange={e => setAnalysisForm(p => ({ ...p, requestedDate: e.target.value }))}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1.5">Notes</label>
                  <input value={analysisForm.notes}
                    onChange={e => setAnalysisForm(p => ({ ...p, notes: e.target.value }))}
                    placeholder="Additional notes..."
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Results</p>
                <button type="button"
                  onClick={() => setAnalysisForm(p => ({ ...p, results: [...p.results, createResultRow()] }))}
                  className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1">
                  <i className="ti ti-plus text-xs" aria-hidden="true" /> Add row
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {analysisForm.results.map((row, index) => (
                  <div key={index} className="bg-slate-50 rounded-lg p-3 border border-slate-100">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      {[
                        { key: 'parameter', label: 'Parameter', placeholder: 'e.g. Hemoglobin' },
                        { key: 'value', label: 'Value', placeholder: 'e.g. 14.5' },
                        { key: 'unit', label: 'Unit', placeholder: 'e.g. g/dL' },
                        { key: 'normalRange', label: 'Normal range', placeholder: 'e.g. 13.5 - 17.5' },
                      ].map(f => (
                        <div key={f.key}>
                          <label className="block text-xs text-slate-400 mb-1">{f.label}</label>
                          <input value={(row as any)[f.key]}
                            onChange={e => setAnalysisForm(p => ({
                              ...p, results: p.results.map((r, i) => i === index ? { ...r, [f.key]: e.target.value } : r)
                            }))}
                            placeholder={f.placeholder}
                            className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {(['NORMAL', 'HIGH', 'LOW'] as const).map(s => (
                          <button key={s} type="button"
                            onClick={() => setAnalysisForm(p => ({ ...p, results: p.results.map((r, i) => i === index ? { ...r, status: s } : r) }))}
                            className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                              row.status === s
                                ? s === 'NORMAL' ? 'bg-emerald-500 text-white' : s === 'HIGH' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                                : 'bg-white text-slate-500 hover:bg-slate-200 border border-slate-200'
                            }`}>{s}</button>
                        ))}
                      </div>
                      {analysisForm.results.length > 1 && (
                        <button type="button"
                          onClick={() => setAnalysisForm(p => ({ ...p, results: p.results.filter((_, i) => i !== index) }))}
                          className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1">
                          <i className="ti ti-trash text-xs" aria-hidden="true" /> Remove
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {analysisError && (
                <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <i className="ti ti-alert-circle text-base flex-shrink-0" aria-hidden="true" />
                  {analysisError}
                </div>
              )}

              <div className="flex justify-end">
                <button type="submit" disabled={createAnalysisMutation.isPending}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                  {createAnalysisMutation.isPending ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                  ) : 'Save analysis'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

// ==================== MAIN PAGE ====================
export default function DoctorConsultationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedAppointmentId = searchParams.get('appointmentId') ?? '';

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<ConsultationForm>({ appointmentId: '', diagnosis: '', notes: '', consultationDate: '' });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [selectedConsultation, setSelectedConsultation] = useState<ConsultationResponse | null>(null);
  const [consultationSearch, setConsultationSearch] = useState('');

  const { data: appointmentsData } = useQuery({
    queryKey: ['doctor-appts-consultations', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get('/api/appointments', { params: { page: 0, size: 200, sortBy: 'appointmentDate', sortDir: 'desc' } });
      return res.data.data as Page<AppointmentResponse>;
    }
  });

  const { data: consultationsData, isLoading: loadingConsultations } = useQuery({
    queryKey: ['doctor-consultations-page', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get('/api/consultations', { params: { page: 0, size: 200, sortBy: 'consultationDate', sortDir: 'desc' } });
      return res.data.data as Page<ConsultationResponse>;
    }
  });

  const { data: prescriptionsData } = useQuery({
    queryKey: ['doctor-prescriptions-page', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get('/api/prescriptions');
      return res.data.data as PrescriptionResponse[];
    }
  });

  const { data: analysesData } = useQuery({
    queryKey: ['doctor-analyses', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get(`/api/analyses/doctor/${user!.id}`);
      return res.data.data as Array<{
        id: number;
        consultationId: number;
        analysisType: string;
        status: string;
        requestedDate: string;
        mongoDocumentId: string | null;
      }>;
    }
  });

const { data: analysisDocumentsData } = useQuery({
  queryKey: ['doctor-analysis-documents', user?.id],
  enabled: !!user?.id,
  queryFn: async () => {
    const res = await api.get(`/api/analysis-documents/doctor/${user!.id}`);
    return res.data.data as AnalysisDocumentResponse[];
  }
});

  const { data: medicationsData } = useQuery({
    queryKey: ['medications-doctor'],
    queryFn: async () => {
      const res = await api.get('/api/medications', { params: { page: 0, size: 500, sortBy: 'name', sortDir: 'asc' } });
      return res.data.data as Page<MedicationResponse>;
    },
    staleTime: 10 * 60 * 1000,
  });

  const medications = medicationsData?.content ?? [];

  const doctorAppointments = useMemo(() =>
    (appointmentsData?.content ?? []).filter(a => a.doctorId === user?.id),
    [appointmentsData, user?.id]
  );

  const doctorConsultations = useMemo(() =>
    (consultationsData?.content ?? []).filter(c => c.doctorId === user?.id),
    [consultationsData, user?.id]
  );

  const prescriptionsByConsultation = useMemo(() => {
    const map = new Map<number, PrescriptionResponse[]>();
    (prescriptionsData ?? []).forEach(p => {
      const existing = map.get(p.consultationId) ?? [];
      existing.push(p);
      map.set(p.consultationId, existing);
    });
    return map;
  }, [prescriptionsData]);

  const analysisDocsByConsultation = useMemo(() => {
    const map = new Map<number, AnalysisDocumentResponse[]>();
    const analyses = analysesData ?? [];
    const docs = analysisDocumentsData ?? [];

    console.log('analyses:', analyses);
    console.log('docs:', docs);

    analyses.forEach(analysis => {
      if (!analysis.consultationId) return;
      const doc = docs.find(d => d.analysisId === analysis.id);
      console.log(`analysis ${analysis.id} consultationId=${analysis.consultationId} doc=`, doc);
      if (doc) {
        const existing = map.get(analysis.consultationId) ?? [];
        existing.push(doc);
        map.set(analysis.consultationId, existing);
      }
    });

    console.log('map:', map);
    return map;
  }, [analysesData, analysisDocumentsData]);

  const eligibleAppointments = useMemo(() =>
    doctorAppointments
      .filter(a => a.status === 'COMPLETED' && !a.consultationId)
      .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()),
    [doctorAppointments]
  );

  const filteredConsultations = useMemo(() => {
    const q = consultationSearch.trim().toLowerCase();
    return doctorConsultations.filter(c => !q || c.patientName.toLowerCase().includes(q) || c.diagnosis.toLowerCase().includes(q));
  }, [doctorConsultations, consultationSearch]);

  const stats = useMemo(() => ({
    consultations: doctorConsultations.length,
    prescriptions: doctorConsultations.reduce((s, c) => s + c.prescriptionCount, 0),
    pending: eligibleAppointments.length,
  }), [doctorConsultations, eligibleAppointments]);

  useEffect(() => {
    if (eligibleAppointments.length === 0) return;
    const fromQuery = eligibleAppointments.find(a => String(a.id) === requestedAppointmentId);
    const first = fromQuery ?? eligibleAppointments[0];
    if (requestedAppointmentId || !form.appointmentId) {
      setForm(p => ({ ...p, appointmentId: String(first.id), consultationDate: toDateTimeLocal(first.appointmentDate) }));
      if (requestedAppointmentId) setShowCreateForm(true);
    }
  }, [eligibleAppointments, requestedAppointmentId]);

  const createConsultationMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/consultations', {
        diagnosis: form.diagnosis.trim(),
        notes: form.notes.trim() || null,
        consultationDate: `${form.consultationDate}:00`,
        appointmentId: Number(form.appointmentId),
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['doctor-appts-consultations', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['doctor-consultations-page', user?.id] }),
      ]);
      setFormSuccess('Consultation created successfully.');
      setFormError('');
      setForm({ appointmentId: '', diagnosis: '', notes: '', consultationDate: '' });
      setShowCreateForm(false);
    },
    onError: (err: any) => setFormError(err.response?.data?.message || 'Failed to create consultation.')
  });

  const handleConsultationSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.appointmentId) { setFormError('Select an appointment.'); return; }
    if (!form.diagnosis.trim()) { setFormError('Diagnosis is required.'); return; }
    if (!form.consultationDate) { setFormError('Consultation date is required.'); return; }
    createConsultationMutation.mutate();
  };

  const selectedAppointment = eligibleAppointments.find(a => String(a.id) === form.appointmentId);

  const handleModalClose = () => {
    setSelectedConsultation(null);
    queryClient.invalidateQueries({ queryKey: ['doctor-consultations-page', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['doctor-prescriptions-page', user?.id] });
    queryClient.invalidateQueries({ queryKey: ['doctor-analysis-documents', user?.id] });
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Consultations</h1>
          <p className="text-slate-400 text-sm mt-1">Create and manage consultations for your completed appointments</p>
        </div>
        {eligibleAppointments.length > 0 && (
          <button
            onClick={() => { setShowCreateForm(s => !s); setFormError(''); setFormSuccess(''); }}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          >
            <i className={`ti ${showCreateForm ? 'ti-x' : 'ti-plus'} text-base`} aria-hidden="true" />
            {showCreateForm ? 'Cancel' : 'New consultation'}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard icon="ti-file-text" label="Total consultations" value={stats.consultations} color="text-blue-500" bg="bg-blue-50" />
        <StatCard icon="ti-pill" label="Prescriptions issued" value={stats.prescriptions} color="text-purple-500" bg="bg-purple-50" />
        <StatCard icon="ti-clock" label="Awaiting consultation" value={stats.pending} color="text-orange-500" bg="bg-orange-50" />
      </div>

      {formSuccess && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <i className="ti ti-circle-check text-base" aria-hidden="true" />
          {formSuccess}
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <i className="ti ti-file-plus text-blue-500 text-base" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">New Consultation</h2>
          </div>
          <form onSubmit={handleConsultationSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Completed appointment</label>
              <select value={form.appointmentId}
                onChange={e => {
                  const appt = eligibleAppointments.find(a => String(a.id) === e.target.value);
                  setForm(p => ({ ...p, appointmentId: e.target.value, consultationDate: appt ? toDateTimeLocal(appt.appointmentDate) : p.consultationDate }));
                }}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                {eligibleAppointments.map(a => (
                  <option key={a.id} value={a.id}>{a.patientName} · {formatDateTime(a.appointmentDate)}</option>
                ))}
              </select>
            </div>
            {selectedAppointment && (
              <div className="bg-slate-50 rounded-lg px-4 py-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Patient</p>
                  <p className="font-medium text-slate-800">{selectedAppointment.patientName}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 mb-0.5">Appointment date</p>
                  <p className="font-medium text-slate-800">{formatDateTime(selectedAppointment.appointmentDate)}</p>
                </div>
                {selectedAppointment.notes && (
                  <div className="col-span-2">
                    <p className="text-xs text-slate-400 mb-0.5">Patient notes</p>
                    <p className="text-slate-600 italic">"{selectedAppointment.notes}"</p>
                  </div>
                )}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Diagnosis <span className="text-red-400">*</span></label>
                <input value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))}
                  placeholder="Enter diagnosis..."
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Consultation date <span className="text-red-400">*</span></label>
                <input type="datetime-local" value={form.consultationDate} onChange={e => setForm(p => ({ ...p, consultationDate: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Clinical notes</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={3}
                placeholder="Observations, recommendations, follow-up..."
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>
            {formError && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                <i className="ti ti-alert-circle text-base flex-shrink-0" aria-hidden="true" />
                {formError}
              </div>
            )}
            <div className="flex justify-end">
              <button type="submit" disabled={createConsultationMutation.isPending}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                {createConsultationMutation.isPending ? (
                  <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Saving...</>
                ) : 'Create consultation'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Consultations list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-slate-700 uppercase tracking-wide">
            Consultation History — {filteredConsultations.length}
          </h2>
          <div className="relative">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" aria-hidden="true" />
            <input value={consultationSearch} onChange={e => setConsultationSearch(e.target.value)}
              placeholder="Search patient or diagnosis..."
              className="border border-slate-200 rounded-lg pl-8 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64" />
          </div>
        </div>

        {loadingConsultations ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => <div key={i} className="animate-pulse h-20 bg-white rounded-xl border border-slate-100" />)}
          </div>
        ) : filteredConsultations.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-200 p-12 text-center">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <i className="ti ti-file-text text-slate-300 text-2xl" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 mb-1">No consultations yet</h3>
            <p className="text-sm text-slate-400">
              {consultationSearch ? 'No results found.' : 'Create your first consultation from a completed appointment.'}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {filteredConsultations.map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedConsultation(c)}
                className="bg-white rounded-xl border border-slate-100 p-5 hover:border-slate-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                      {c.patientName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{c.patientName}</p>
                      <p className="text-xs text-slate-400">{formatDateTime(c.consultationDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <div className="flex gap-2 text-xs text-slate-400">
                      {c.prescriptionCount > 0 && (
                        <span className="flex items-center gap-1 bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">
                          <i className="ti ti-pill text-xs" aria-hidden="true" />
                          {c.prescriptionCount}
                        </span>
                      )}
                      {c.analysisCount > 0 && (
                        <span className="flex items-center gap-1 bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full">
                          <i className="ti ti-microscope text-xs" aria-hidden="true" />
                          {c.analysisCount}
                        </span>
                      )}
                    </div>
                    <i className="ti ti-chevron-right text-slate-300 text-sm" aria-hidden="true" />
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-2 truncate">{c.diagnosis}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Consultation Modal */}
      {selectedConsultation && (
        <ConsultationModal
          consultation={selectedConsultation}
          prescriptions={prescriptionsByConsultation.get(selectedConsultation.id) ?? []}
          analysisDocuments={analysisDocsByConsultation.get(selectedConsultation.id) ?? []}
          medications={medications}
          onClose={handleModalClose}
          onPrescriptionCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['doctor-prescriptions-page', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['doctor-consultations-page', user?.id] });
          }}
          onAnalysisCreated={() => {
            queryClient.invalidateQueries({ queryKey: ['doctor-consultations-page', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['doctor-analysis-documents', user?.id] });
          }}
          user={user}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value, color, bg }: {
  icon: string; label: string; value: number; color: string; bg: string;
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