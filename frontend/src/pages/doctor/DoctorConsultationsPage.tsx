import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChangeEvent, FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
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

interface MedicationResponse {
  id: number;
  name: string;
  activeSubstance: string | null;
  dosage: string;
  manufacturer: string | null;
}

interface Page<T> {
  content: T[];
}

type MedicationFrequency =
  | 'ONCE_DAILY'
  | 'TWICE_DAILY'
  | 'THREE_TIMES_DAILY'
  | 'EVERY_8_HOURS'
  | 'EVERY_12_HOURS'
  | 'AS_NEEDED';

const frequencyOptions: Array<{ value: MedicationFrequency; label: string }> = [
  { value: 'ONCE_DAILY', label: 'Once daily' },
  { value: 'TWICE_DAILY', label: 'Twice daily' },
  { value: 'THREE_TIMES_DAILY', label: 'Three times daily' },
  { value: 'EVERY_8_HOURS', label: 'Every 8 hours' },
  { value: 'EVERY_12_HOURS', label: 'Every 12 hours' },
  { value: 'AS_NEEDED', label: 'As needed' },
];

const frequencyLabels: Record<string, string> = Object.fromEntries(
  frequencyOptions.map(o => [o.value, o.label])
);

type MedicationRow = {
  medicationId: string;
  quantity: string;
  frequency: MedicationFrequency;
  durationDays: string;
};

type ConsultationForm = {
  appointmentId: string;
  diagnosis: string;
  notes: string;
  consultationDate: string;
};

type PrescriptionForm = {
  issueDate: string;
  expiryDate: string;
  instructions: string;
  medications: MedicationRow[];
};

function createMedRow(): MedicationRow {
  return { medicationId: '', quantity: '1', frequency: 'ONCE_DAILY', durationDays: '7' };
}

function getInitialPrescriptionForm(): PrescriptionForm {
  const today = new Date();
  const expiry = new Date(today);
  expiry.setDate(expiry.getDate() + 7);
  return {
    issueDate: toDateOnly(today.toISOString()),
    expiryDate: toDateOnly(expiry.toISOString()),
    instructions: '',
    medications: [createMedRow()],
  };
}

function toDateOnly(value: string) { return value.slice(0, 10); }
function toDateTimeLocal(value: string) {
  const d = new Date(value);
  const pad = (n: number) => `${n}`.padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function formatDateTime(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

// ==================== MEDICATION SEARCH DROPDOWN ====================
function MedicationSearchSelect({ medications, value, onChange }: {
  medications: MedicationResponse[];
  value: string;
  onChange: (id: string) => void;
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
      <div
        onClick={() => setOpen(o => !o)}
        className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm cursor-pointer flex items-center justify-between bg-white"
      >
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
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search medication..."
                className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">No medications found.</p>
            ) : filtered.map(m => (
              <div
                key={m.id}
                onClick={() => { onChange(String(m.id)); setOpen(false); setSearch(''); }}
                className={`px-4 py-2.5 cursor-pointer hover:bg-slate-50 transition-colors ${value === String(m.id) ? 'bg-blue-50' : ''}`}
              >
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

// ==================== MAIN PAGE ====================
export default function DoctorConsultationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedAppointmentId = searchParams.get('appointmentId') ?? '';

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState<ConsultationForm>({
    appointmentId: '', diagnosis: '', notes: '', consultationDate: '',
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [activePrescriptionId, setActivePrescriptionId] = useState<number | null>(null);
  const [prescriptionForm, setPrescriptionForm] = useState<PrescriptionForm>(getInitialPrescriptionForm);
  const [prescriptionError, setPrescriptionError] = useState('');

  const [consultationSearch, setConsultationSearch] = useState('');

  // ---- Queries ----
  const { data: appointmentsData } = useQuery({
    queryKey: ['doctor-appts-consultations', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get('/api/appointments', {
        params: { page: 0, size: 200, sortBy: 'appointmentDate', sortDir: 'desc' }
      });
      return res.data.data as Page<AppointmentResponse>;
    }
  });

  const { data: consultationsData, isLoading: loadingConsultations } = useQuery({
    queryKey: ['doctor-consultations-page', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get('/api/consultations', {
        params: { page: 0, size: 200, sortBy: 'consultationDate', sortDir: 'desc' }
      });
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

  const { data: medicationsData } = useQuery({
    queryKey: ['medications-doctor'],
    queryFn: async () => {
      const res = await api.get('/api/medications', {
        params: { page: 0, size: 500, sortBy: 'name', sortDir: 'asc' }
      });
      return res.data.data as Page<MedicationResponse>;
    },
    staleTime: 10 * 60 * 1000,
  });

  const medications = medicationsData?.content ?? [];

  // ---- Derived data ----
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
    (prescriptionsData ?? [])
      .filter(p => p.medications?.length >= 0)
      .forEach(p => {
        const existing = map.get(p.consultationId) ?? [];
        existing.push(p);
        map.set(p.consultationId, existing);
      });
    return map;
  }, [prescriptionsData]);

  const eligibleAppointments = useMemo(() =>
    doctorAppointments
      .filter(a => a.status === 'COMPLETED' && !a.consultationId)
      .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()),
    [doctorAppointments]
  );

  const filteredConsultations = useMemo(() => {
    const q = consultationSearch.trim().toLowerCase();
    return doctorConsultations.filter(c =>
      !q ||
      c.patientName.toLowerCase().includes(q) ||
      c.diagnosis.toLowerCase().includes(q)
    );
  }, [doctorConsultations, consultationSearch]);

  const stats = useMemo(() => ({
    consultations: doctorConsultations.length,
    prescriptions: doctorConsultations.reduce((s, c) => s + c.prescriptionCount, 0),
    pending: eligibleAppointments.length,
  }), [doctorConsultations, eligibleAppointments]);

  // ---- Effects ----
  useEffect(() => {
    if (eligibleAppointments.length === 0) return;
    const fromQuery = eligibleAppointments.find(a => String(a.id) === requestedAppointmentId);
    const first = fromQuery ?? eligibleAppointments[0];
    if (requestedAppointmentId || !form.appointmentId) {
      setForm(p => ({
        ...p,
        appointmentId: String(first.id),
        consultationDate: toDateTimeLocal(first.appointmentDate),
      }));
      if (requestedAppointmentId) setShowCreateForm(true);
    }
  }, [eligibleAppointments, requestedAppointmentId]);

  // ---- Mutations ----
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
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to create consultation.');
    }
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: async () => {
      await api.post('/api/prescriptions', {
        issueDate: prescriptionForm.issueDate,
        expiryDate: prescriptionForm.expiryDate,
        instructions: prescriptionForm.instructions.trim() || null,
        consultationId: activePrescriptionId,
        medications: prescriptionForm.medications.map(m => ({
          medicationId: Number(m.medicationId),
          quantity: Number(m.quantity),
          frequency: m.frequency,
          durationDays: Number(m.durationDays),
        })),
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['doctor-prescriptions-page', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['doctor-consultations-page', user?.id] }),
      ]);
      setActivePrescriptionId(null);
      setPrescriptionForm(getInitialPrescriptionForm());
      setPrescriptionError('');
    },
    onError: (err: any) => {
      setPrescriptionError(err.response?.data?.message || 'Failed to create prescription.');
    }
  });

  // ---- Handlers ----
  const handleConsultationSubmit = (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.appointmentId) { setFormError('Select an appointment.'); return; }
    if (!form.diagnosis.trim()) { setFormError('Diagnosis is required.'); return; }
    if (!form.consultationDate) { setFormError('Consultation date is required.'); return; }
    createConsultationMutation.mutate();
  };

  const handlePrescriptionSubmit = (e: FormEvent) => {
    e.preventDefault();
    setPrescriptionError('');
    if (!prescriptionForm.issueDate || !prescriptionForm.expiryDate) {
      setPrescriptionError('Issue and expiry date are required.'); return;
    }
    if (prescriptionForm.expiryDate < prescriptionForm.issueDate) {
      setPrescriptionError('Expiry date must be after issue date.'); return;
    }
    for (const m of prescriptionForm.medications) {
      if (!m.medicationId) { setPrescriptionError('Select a medication for each row.'); return; }
      if (Number(m.quantity) < 1 || Number(m.durationDays) < 1) {
        setPrescriptionError('Quantity and duration must be at least 1.'); return;
      }
    }
    createPrescriptionMutation.mutate();
  };

  const selectedAppointment = eligibleAppointments.find(a => String(a.id) === form.appointmentId);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Consultations</h1>
          <p className="text-slate-400 text-sm mt-1">
            Create and manage consultations for your completed appointments
          </p>
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

      {/* Success message */}
      {formSuccess && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <i className="ti ti-circle-check text-base" aria-hidden="true" />
          {formSuccess}
        </div>
      )}

      {/* Create Consultation Form */}
      {showCreateForm && (
        <div className="bg-white rounded-xl border border-slate-100 p-6 mb-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <i className="ti ti-file-plus text-blue-500 text-base" aria-hidden="true" />
            </div>
            <h2 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
              New Consultation
            </h2>
          </div>

          <form onSubmit={handleConsultationSubmit} className="flex flex-col gap-4">

            {/* Appointment selector */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Completed appointment
              </label>
              <select
                value={form.appointmentId}
                onChange={e => {
                  const appt = eligibleAppointments.find(a => String(a.id) === e.target.value);
                  setForm(p => ({
                    ...p,
                    appointmentId: e.target.value,
                    consultationDate: appt ? toDateTimeLocal(appt.appointmentDate) : p.consultationDate,
                  }));
                }}
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {eligibleAppointments.map(a => (
                  <option key={a.id} value={a.id}>
                    {a.patientName} · {formatDateTime(a.appointmentDate)}
                  </option>
                ))}
              </select>
            </div>

            {/* Patient info */}
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
              {/* Diagnosis */}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Diagnosis <span className="text-red-400">*</span>
                </label>
                <input
                  value={form.diagnosis}
                  onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))}
                  placeholder="Enter diagnosis..."
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Consultation date */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Consultation date <span className="text-red-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.consultationDate}
                  onChange={e => setForm(p => ({ ...p, consultationDate: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Clinical notes
              </label>
              <textarea
                value={form.notes}
                onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                rows={4}
                placeholder="Observations, recommendations, follow-up..."
                className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                <i className="ti ti-alert-circle text-base flex-shrink-0" aria-hidden="true" />
                {formError}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={createConsultationMutation.isPending}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {createConsultationMutation.isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </>
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
          {/* Search */}
          <div className="relative">
            <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" aria-hidden="true" />
            <input
              value={consultationSearch}
              onChange={e => setConsultationSearch(e.target.value)}
              placeholder="Search patient or diagnosis..."
              className="border border-slate-200 rounded-lg pl-8 pr-4 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
          </div>
        </div>

        {loadingConsultations ? (
          <div className="flex flex-col gap-3">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse h-24 bg-white rounded-xl border border-slate-100" />
            ))}
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
          <div className="flex flex-col gap-4">
            {filteredConsultations.map(c => {
              const prescriptions = prescriptionsByConsultation.get(c.id) ?? [];
              const isPrescriptionOpen = activePrescriptionId === c.id;

              return (
                <div key={c.id} className="bg-white rounded-xl border border-slate-100 p-5">

                  {/* Consultation header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                        {c.patientName.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{c.patientName}</p>
                        <p className="text-xs text-slate-400">{formatDateTime(c.consultationDate)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setActivePrescriptionId(id => id === c.id ? null : c.id);
                        setPrescriptionForm(getInitialPrescriptionForm());
                        setPrescriptionError('');
                      }}
                      className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-700 border border-blue-100 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
                    >
                      <i className="ti ti-pill text-xs" aria-hidden="true" />
                      {isPrescriptionOpen ? 'Cancel' : 'Add prescription'}
                    </button>
                  </div>

                  {/* Diagnosis + notes */}
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-slate-900 mb-1">{c.diagnosis}</p>
                    {c.notes && (
                      <p className="text-sm text-slate-500 leading-relaxed">{c.notes}</p>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="flex items-center gap-4 text-xs text-slate-400 pb-4 border-b border-slate-50">
                    <span className="flex items-center gap-1">
                      <i className="ti ti-pill text-xs" aria-hidden="true" />
                      {c.prescriptionCount} prescription{c.prescriptionCount !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="ti ti-microscope text-xs" aria-hidden="true" />
                      {c.analysisCount} analysis result{c.analysisCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Prescriptions list */}
                  {prescriptions.length > 0 && (
                    <div className="mt-4 flex flex-col gap-2">
                      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Prescriptions</p>
                      {prescriptions.map(p => (
                        <div key={p.id} className="bg-slate-50 rounded-lg px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs text-slate-500">
                              Issued {formatDate(p.issueDate)} · expires {formatDate(p.expiryDate)}
                            </p>
                          </div>
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
                                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">
                                    {frequencyLabels[m.frequency] || m.frequency}
                                  </span>
                                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                    {m.durationDays} days
                                  </span>
                                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                    qty {m.quantity}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add prescription form */}
                  {isPrescriptionOpen && (
                    <form onSubmit={handlePrescriptionSubmit} className="mt-4 border border-slate-100 rounded-xl p-4 bg-slate-50">
                      <h4 className="text-sm font-semibold text-slate-900 mb-4">New prescription</h4>

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1.5">Issue date</label>
                          <input
                            type="date"
                            value={prescriptionForm.issueDate}
                            onChange={e => setPrescriptionForm(p => ({ ...p, issueDate: e.target.value }))}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-600 mb-1.5">Expiry date</label>
                          <input
                            type="date"
                            value={prescriptionForm.expiryDate}
                            onChange={e => setPrescriptionForm(p => ({ ...p, expiryDate: e.target.value }))}
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs font-medium text-slate-600 mb-1.5">Instructions</label>
                          <input
                            value={prescriptionForm.instructions}
                            onChange={e => setPrescriptionForm(p => ({ ...p, instructions: e.target.value }))}
                            placeholder="General instructions..."
                            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      {/* Medications */}
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Medications</p>
                        <button
                          type="button"
                          onClick={() => setPrescriptionForm(p => ({ ...p, medications: [...p.medications, createMedRow()] }))}
                          className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                        >
                          <i className="ti ti-plus text-xs" aria-hidden="true" />
                          Add row
                        </button>
                      </div>

                      <div className="flex flex-col gap-3">
                        {prescriptionForm.medications.map((row, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-slate-100">
                            <div className="grid grid-cols-1 gap-2">
                              {/* Medication search */}
                              <MedicationSearchSelect
                                medications={medications}
                                value={row.medicationId}
                                onChange={id => {
                                  setPrescriptionForm(p => ({
                                    ...p,
                                    medications: p.medications.map((m, i) =>
                                      i === index ? { ...m, medicationId: id } : m
                                    )
                                  }));
                                }}
                              />

                              <div className="grid grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Frequency</label>
                                  <select
                                    value={row.frequency}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                      setPrescriptionForm(p => ({
                                        ...p,
                                        medications: p.medications.map((m, i) =>
                                          i === index ? { ...m, frequency: e.target.value as MedicationFrequency } : m
                                        )
                                      }))
                                    }
                                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    {frequencyOptions.map(o => (
                                      <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Days</label>
                                  <input
                                    type="number" min={1}
                                    value={row.durationDays}
                                    onChange={e =>
                                      setPrescriptionForm(p => ({
                                        ...p,
                                        medications: p.medications.map((m, i) =>
                                          i === index ? { ...m, durationDays: e.target.value } : m
                                        )
                                      }))
                                    }
                                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs text-slate-400 mb-1">Qty</label>
                                  <input
                                    type="number" min={1}
                                    value={row.quantity}
                                    onChange={e =>
                                      setPrescriptionForm(p => ({
                                        ...p,
                                        medications: p.medications.map((m, i) =>
                                          i === index ? { ...m, quantity: e.target.value } : m
                                        )
                                      }))
                                    }
                                    className="w-full border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </div>
                              </div>

                              {prescriptionForm.medications.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPrescriptionForm(p => ({
                                      ...p,
                                      medications: p.medications.filter((_, i) => i !== index)
                                    }))
                                  }
                                  className="text-xs text-red-400 hover:text-red-600 self-end flex items-center gap-1"
                                >
                                  <i className="ti ti-trash text-xs" aria-hidden="true" />
                                  Remove
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {prescriptionError && (
                        <div className="mt-3 bg-red-50 border border-red-100 text-red-500 text-sm rounded-lg px-3 py-2.5 flex items-center gap-2">
                          <i className="ti ti-alert-circle text-base flex-shrink-0" aria-hidden="true" />
                          {prescriptionError}
                        </div>
                      )}

                      <div className="flex justify-end mt-4">
                        <button
                          type="submit"
                          disabled={createPrescriptionMutation.isPending}
                          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          {createPrescriptionMutation.isPending ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              Saving...
                            </>
                          ) : 'Create prescription'}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
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