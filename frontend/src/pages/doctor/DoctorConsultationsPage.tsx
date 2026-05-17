import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import {
  CalendarDays,
  FilePlus2,
  FileText,
  FlaskConical,
  NotebookPen,
  Pill,
  Plus,
  Stethoscope,
  Trash2,
  UserRound,
} from 'lucide-react';
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
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  doctorName: string;
  medications: PrescriptionMedicationResponse[];
}

interface MedicationResponse {
  id: number;
  name: string;
  activeSubstance: string;
  dosage: string;
  manufacturer: string;
}

interface Page<T> {
  content: T[];
}

type ConsultationFormState = {
  appointmentId: string;
  diagnosis: string;
  notes: string;
  consultationDate: string;
};

type PrescriptionMedicationFormState = {
  medicationId: string;
  quantity: string;
  frequency: MedicationFrequency;
  durationDays: string;
};

type PrescriptionFormState = {
  issueDate: string;
  expiryDate: string;
  instructions: string;
  medications: PrescriptionMedicationFormState[];
};

type MedicationFrequency =
  | 'ONCE_DAILY'
  | 'TWICE_DAILY'
  | 'THREE_TIMES_DAILY'
  | 'EVERY_8_HOURS'
  | 'EVERY_12_HOURS'
  | 'AS_NEEDED';

const initialForm: ConsultationFormState = {
  appointmentId: '',
  diagnosis: '',
  notes: '',
  consultationDate: '',
};

const frequencyOptions: Array<{ value: MedicationFrequency; label: string }> = [
  { value: 'ONCE_DAILY', label: 'Once daily' },
  { value: 'TWICE_DAILY', label: 'Twice daily' },
  { value: 'THREE_TIMES_DAILY', label: 'Three times daily' },
  { value: 'EVERY_8_HOURS', label: 'Every 8 hours' },
  { value: 'EVERY_12_HOURS', label: 'Every 12 hours' },
  { value: 'AS_NEEDED', label: 'As needed' },
];

function getInitialPrescriptionForm(): PrescriptionFormState {
  const today = new Date();
  const expiry = new Date(today);
  expiry.setDate(expiry.getDate() + 7);

  return {
    issueDate: toDateOnly(today.toISOString()),
    expiryDate: toDateOnly(expiry.toISOString()),
    instructions: '',
    medications: [createMedicationRow()],
  };
}

function createMedicationRow(): PrescriptionMedicationFormState {
  return {
    medicationId: '',
    quantity: '1',
    frequency: 'ONCE_DAILY',
    durationDays: '7',
  };
}

export default function DoctorConsultationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedAppointmentId = searchParams.get('appointmentId') ?? '';
  const [form, setForm] = useState<ConsultationFormState>(initialForm);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activePrescriptionConsultationId, setActivePrescriptionConsultationId] = useState<number | null>(null);
  const [prescriptionForm, setPrescriptionForm] = useState<PrescriptionFormState>(getInitialPrescriptionForm);
  const [prescriptionError, setPrescriptionError] = useState('');
  const [prescriptionSuccess, setPrescriptionSuccess] = useState('');
  const [consultationSearch, setConsultationSearch] = useState('');
  const [consultationDateFilter, setConsultationDateFilter] = useState('');
  const [consultationSortDirection, setConsultationSortDirection] = useState<'desc' | 'asc'>('desc');
  const [consultationPage, setConsultationPage] = useState(1);
  const [consultationPageSize, setConsultationPageSize] = useState(5);

  const appointmentsQuery = useQuery({
    queryKey: ['consultation-appointments', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get('/api/appointments', {
        params: { page: 0, size: 200, sortBy: 'appointmentDate', sortDir: 'desc' },
      });
      return res.data.data as Page<AppointmentResponse>;
    }
  });

  const consultationsQuery = useQuery({
    queryKey: ['doctor-consultations', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get('/api/consultations', {
        params: { page: 0, size: 200, sortBy: 'consultationDate', sortDir: 'desc' },
      });
      return res.data.data as Page<ConsultationResponse>;
    }
  });

  const prescriptionsQuery = useQuery({
    queryKey: ['doctor-prescriptions', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get('/api/prescriptions');
      return res.data.data as PrescriptionResponse[];
    }
  });

  const medicationsQuery = useQuery({
    queryKey: ['doctor-medications'],
    queryFn: async () => {
      const res = await api.get('/api/medications', {
        params: { page: 0, size: 200, sortBy: 'name', sortDir: 'asc' },
      });
      return res.data.data as Page<MedicationResponse>;
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

  const doctorPrescriptions = useMemo(() => {
    if (!user?.id) return [];
    return (prescriptionsQuery.data ?? []).filter(prescription => prescription.doctorId === user.id);
  }, [prescriptionsQuery.data, user?.id]);

  const prescriptionsByConsultationId = useMemo(() => {
    const grouped = new Map<number, PrescriptionResponse[]>();

    for (const prescription of doctorPrescriptions) {
      const existing = grouped.get(prescription.consultationId) ?? [];
      existing.push(prescription);
      grouped.set(prescription.consultationId, existing);
    }

    return grouped;
  }, [doctorPrescriptions]);

  const medications = medicationsQuery.data?.content ?? [];

  const eligibleAppointments = useMemo(() => {
    return doctorAppointments
      .filter(appointment => appointment.status === 'COMPLETED' && !appointment.consultationId)
      .sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());
  }, [doctorAppointments]);

  const selectedAppointment = useMemo(
    () => eligibleAppointments.find(appointment => String(appointment.id) === form.appointmentId) ?? null,
    [eligibleAppointments, form.appointmentId]
  );

  useEffect(() => {
    if (eligibleAppointments.length === 0) return;

    const fromQuery = eligibleAppointments.find(
      appointment => String(appointment.id) === requestedAppointmentId
    );

    if (fromQuery) {
      setForm(prev => ({
        ...prev,
        appointmentId: String(fromQuery.id),
        consultationDate: toDateTimeLocal(fromQuery.appointmentDate),
      }));
      return;
    }

    if (!form.appointmentId) {
      setForm(prev => ({
        ...prev,
        appointmentId: String(eligibleAppointments[0].id),
        consultationDate: toDateTimeLocal(eligibleAppointments[0].appointmentDate),
      }));
    }
  }, [eligibleAppointments, form.appointmentId, requestedAppointmentId]);

  useEffect(() => {
    if (!selectedAppointment) return;
    setForm(prev => ({
      ...prev,
      consultationDate: prev.consultationDate || toDateTimeLocal(selectedAppointment.appointmentDate),
    }));
  }, [selectedAppointment]);

  const createConsultationMutation = useMutation({
    mutationFn: async () => {
      return api.post('/api/consultations', {
        diagnosis: form.diagnosis.trim(),
        notes: form.notes.trim() || null,
        consultationDate: `${form.consultationDate}:00`,
        appointmentId: Number(form.appointmentId),
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['consultation-appointments', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['doctor-consultations', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['doctor-appointments', user?.id] }),
      ]);
      setSuccessMessage('Consultation created successfully.');
      setFormError('');
      setForm(initialForm);
    },
    onError: (error: any) => {
      setFormError(error.response?.data?.message || 'Failed to create consultation.');
    }
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: async () => {
      if (!activePrescriptionConsultationId) {
        throw new Error('Consultation is missing.');
      }

      return api.post('/api/prescriptions', {
        issueDate: prescriptionForm.issueDate,
        expiryDate: prescriptionForm.expiryDate,
        instructions: prescriptionForm.instructions.trim() || null,
        consultationId: activePrescriptionConsultationId,
        medications: prescriptionForm.medications.map(medication => ({
          medicationId: Number(medication.medicationId),
          quantity: Number(medication.quantity),
          frequency: medication.frequency,
          durationDays: Number(medication.durationDays),
        })),
      });
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['doctor-prescriptions', user?.id] }),
        queryClient.invalidateQueries({ queryKey: ['doctor-consultations', user?.id] }),
      ]);
      setPrescriptionSuccess('Prescription created successfully.');
      setPrescriptionError('');
      setActivePrescriptionConsultationId(null);
      setPrescriptionForm(getInitialPrescriptionForm());
    },
    onError: (error: any) => {
      setPrescriptionError(error.response?.data?.message || 'Failed to create prescription.');
    }
  });

  const stats = useMemo(() => {
    return doctorConsultations.reduce((acc, consultation) => {
      acc.consultations += 1;
      acc.prescriptions += consultation.prescriptionCount;
      acc.analyses += consultation.analysisCount;
      return acc;
    }, { consultations: 0, prescriptions: 0, analyses: 0 });
  }, [doctorConsultations]);

  const filteredConsultations = useMemo(() => {
    const normalizedSearch = consultationSearch.trim().toLowerCase();

    return [...doctorConsultations]
      .filter(consultation => {
        const matchesSearch =
          !normalizedSearch ||
          consultation.patientName.toLowerCase().includes(normalizedSearch) ||
          consultation.diagnosis.toLowerCase().includes(normalizedSearch) ||
          String(consultation.id).includes(normalizedSearch) ||
          String(consultation.appointmentId).includes(normalizedSearch);

        const matchesDate =
          !consultationDateFilter ||
          toDateOnly(new Date(consultation.consultationDate).toISOString()) === consultationDateFilter;

        return matchesSearch && matchesDate;
      })
      .sort((left, right) => {
        const leftTime = new Date(left.consultationDate).getTime();
        const rightTime = new Date(right.consultationDate).getTime();
        return consultationSortDirection === 'desc' ? rightTime - leftTime : leftTime - rightTime;
      });
  }, [consultationDateFilter, consultationSearch, consultationSortDirection, doctorConsultations]);

  const totalConsultationPages = Math.max(1, Math.ceil(filteredConsultations.length / consultationPageSize));

  const paginatedConsultations = useMemo(() => {
    const startIndex = (consultationPage - 1) * consultationPageSize;
    return filteredConsultations.slice(startIndex, startIndex + consultationPageSize);
  }, [consultationPage, consultationPageSize, filteredConsultations]);

  const consultationRangeStart =
    filteredConsultations.length === 0 ? 0 : (consultationPage - 1) * consultationPageSize + 1;
  const consultationRangeEnd = Math.min(consultationPage * consultationPageSize, filteredConsultations.length);

  useEffect(() => {
    setConsultationPage(1);
  }, [consultationDateFilter, consultationPageSize, consultationSearch, consultationSortDirection]);

  useEffect(() => {
    if (consultationPage > totalConsultationPages) {
      setConsultationPage(totalConsultationPages);
    }
  }, [consultationPage, totalConsultationPages]);

  const handleConsultationSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSuccessMessage('');
    setFormError('');

    if (!form.appointmentId) {
      setFormError('Select a completed appointment first.');
      return;
    }

    if (!form.diagnosis.trim()) {
      setFormError('Diagnosis is required.');
      return;
    }

    if (!form.consultationDate) {
      setFormError('Consultation date is required.');
      return;
    }

    await createConsultationMutation.mutateAsync();
  };

  const handlePrescriptionSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setPrescriptionSuccess('');
    setPrescriptionError('');

    if (!prescriptionForm.issueDate || !prescriptionForm.expiryDate) {
      setPrescriptionError('Issue and expiry date are required.');
      return;
    }

    if (prescriptionForm.expiryDate < prescriptionForm.issueDate) {
      setPrescriptionError('Expiry date must be after issue date.');
      return;
    }

    if (prescriptionForm.medications.length === 0) {
      setPrescriptionError('Add at least one medication row.');
      return;
    }

    for (const medication of prescriptionForm.medications) {
      if (!medication.medicationId) {
        setPrescriptionError('Select a medication for each row.');
        return;
      }
      if (Number(medication.quantity) < 1 || Number(medication.durationDays) < 1) {
        setPrescriptionError('Quantity and duration must be at least 1.');
        return;
      }
    }

    await createPrescriptionMutation.mutateAsync();
  };

  const updateMedicationRow = (
    index: number,
    field: keyof PrescriptionMedicationFormState,
    value: string
  ) => {
    setPrescriptionForm(prev => ({
      ...prev,
      medications: prev.medications.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      ),
    }));
  };

  const openPrescriptionForm = (consultationId: number) => {
    setActivePrescriptionConsultationId(consultationId);
    setPrescriptionForm(getInitialPrescriptionForm());
    setPrescriptionError('');
    setPrescriptionSuccess('');
  };

  if (
    appointmentsQuery.isLoading ||
    consultationsQuery.isLoading ||
    prescriptionsQuery.isLoading ||
    medicationsQuery.isLoading
  ) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (
    appointmentsQuery.isError ||
    consultationsQuery.isError ||
    prescriptionsQuery.isError ||
    medicationsQuery.isError
  ) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
        Failed to load consultation data.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My consultations</h1>
        <p className="text-sm text-slate-500 mt-1">
          Register consultations for completed appointments and track related prescriptions and analyses.
        </p>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      {prescriptionSuccess && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {prescriptionSuccess}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={<FileText className="h-5 w-5 text-blue-600" />} label="Consultations" value={stats.consultations} tone="bg-blue-50" />
        <SummaryCard icon={<Pill className="h-5 w-5 text-emerald-600" />} label="Prescriptions" value={stats.prescriptions} tone="bg-emerald-50" />
        <SummaryCard icon={<FlaskConical className="h-5 w-5 text-violet-600" />} label="Analyses" value={stats.analyses} tone="bg-violet-50" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Create consultation</h2>
              <p className="text-sm text-slate-500 mt-1">
                Only completed appointments without an existing consultation are available here.
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              <FilePlus2 className="h-5 w-5" />
            </div>
          </div>

          {eligibleAppointments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              There are no completed appointments waiting for a consultation.
            </div>
          ) : (
            <form onSubmit={handleConsultationSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Completed appointment</span>
                <select
                  value={form.appointmentId}
                  onChange={event => {
                    const nextId = event.target.value;
                    const nextAppointment = eligibleAppointments.find(
                      appointment => String(appointment.id) === nextId
                    );

                    setForm(prev => ({
                      ...prev,
                      appointmentId: nextId,
                      consultationDate: nextAppointment
                        ? toDateTimeLocal(nextAppointment.appointmentDate)
                        : prev.consultationDate,
                    }));
                  }}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {eligibleAppointments.map(appointment => (
                    <option key={appointment.id} value={appointment.id}>
                      #{appointment.id} | {appointment.patientName} | {formatDateTime(appointment.appointmentDate)}
                    </option>
                  ))}
                </select>
              </label>

              {selectedAppointment && (
                <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <InfoRow icon={<UserRound className="h-4 w-4" />} label={selectedAppointment.patientName} />
                    <InfoRow icon={<CalendarDays className="h-4 w-4" />} label={formatDateTime(selectedAppointment.appointmentDate)} />
                    <InfoRow icon={<Stethoscope className="h-4 w-4" />} label={`Appointment #${selectedAppointment.id}`} />
                    <InfoRow icon={<NotebookPen className="h-4 w-4" />} label={selectedAppointment.notes || 'No appointment notes'} />
                  </div>
                </div>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Diagnosis</span>
                <input
                  value={form.diagnosis}
                  onChange={event => setForm(prev => ({ ...prev, diagnosis: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the main diagnosis"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Consultation date</span>
                <input
                  type="datetime-local"
                  value={form.consultationDate}
                  onChange={event => setForm(prev => ({ ...prev, consultationDate: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Notes</span>
                <textarea
                  value={form.notes}
                  onChange={event => setForm(prev => ({ ...prev, notes: event.target.value }))}
                  rows={5}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Clinical observations, recommendations, follow-up notes..."
                />
              </label>

              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={createConsultationMutation.isPending}
                  className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
                >
                  {createConsultationMutation.isPending ? 'Saving...' : 'Create consultation'}
                </button>
              </div>
            </form>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Consultation history</h2>
              <p className="text-sm text-slate-500 mt-1">
                All consultations currently assigned to your doctor account.
              </p>
            </div>
          </div>

          {doctorConsultations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              No consultations have been created yet.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2 xl:grid-cols-[1.2fr_0.8fr_0.7fr_auto]">
                <label className="block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Search
                  </span>
                  <input
                    value={consultationSearch}
                    onChange={event => setConsultationSearch(event.target.value)}
                    placeholder="Patient, diagnosis, consultation ID..."
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Consultation date
                  </span>
                  <input
                    type="date"
                    value={consultationDateFilter}
                    onChange={event => setConsultationDateFilter(event.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Sort
                  </span>
                  <select
                    value={consultationSortDirection}
                    onChange={event => setConsultationSortDirection(event.target.value as 'desc' | 'asc')}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="desc">Newest first</option>
                    <option value="asc">Oldest first</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Per page
                  </span>
                  <select
                    value={consultationPageSize}
                    onChange={event => setConsultationPageSize(Number(event.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {[5, 10, 20].map(size => (
                      <option key={size} value={size}>
                        {size}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <p>
                  Showing {consultationRangeStart}-{consultationRangeEnd} of {filteredConsultations.length} consultations
                </p>
                {(consultationSearch || consultationDateFilter) && (
                  <button
                    type="button"
                    onClick={() => {
                      setConsultationSearch('');
                      setConsultationDateFilter('');
                    }}
                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>

              {filteredConsultations.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                  No consultations match the current filters.
                </div>
              ) : paginatedConsultations.map(consultation => {
                const consultationPrescriptions = prescriptionsByConsultationId.get(consultation.id) ?? [];
                const isPrescriptionOpen = activePrescriptionConsultationId === consultation.id;

                return (
                  <article key={consultation.id} className="rounded-xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-base font-semibold text-slate-900">{consultation.patientName}</h3>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                            Consultation #{consultation.id}
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-medium text-blue-700">{consultation.diagnosis}</p>
                        <p className="mt-1 text-sm text-slate-500">{formatDateTime(consultation.consultationDate)}</p>
                      </div>

                      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600 lg:min-w-56">
                        <p>Appointment #{consultation.appointmentId}</p>
                        <p className="mt-1">Prescriptions: {consultation.prescriptionCount}</p>
                        <p className="mt-1">Analyses: {consultation.analysisCount}</p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-slate-600">
                      {consultation.notes || 'No consultation notes were added.'}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => openPrescriptionForm(consultation.id)}
                        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
                      >
                        <Pill className="h-4 w-4" />
                        Add prescription
                      </button>
                      <Link
                        to="/doctor/appointments"
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <CalendarDays className="h-4 w-4" />
                        View appointments
                      </Link>
                    </div>

                    {consultationPrescriptions.length > 0 && (
                      <div className="mt-5 space-y-3">
                        {consultationPrescriptions.map(prescription => (
                          <div key={prescription.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-900">Prescription #{prescription.id}</p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {formatDate(prescription.issueDate)} - expires {formatDate(prescription.expiryDate)}
                                </p>
                              </div>
                              <div className="rounded-lg bg-white px-3 py-2 text-sm text-slate-600">
                                {prescription.medications.length} medication(s)
                              </div>
                            </div>
                            <p className="mt-3 text-sm text-slate-600">
                              {prescription.instructions || 'No prescription instructions added.'}
                            </p>
                            <div className="mt-3 grid gap-2">
                              {prescription.medications.map(medication => (
                                <div key={`${prescription.id}-${medication.medicationId}`} className="rounded-lg bg-white px-3 py-3 text-sm text-slate-600">
                                  <p className="font-medium text-slate-900">{medication.medicationName}</p>
                                  <p className="mt-1">
                                    {medication.dosage} | {formatFrequencyLabel(medication.frequency)} | {medication.durationDays} day(s) | qty {medication.quantity}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {isPrescriptionOpen && (
                      <form onSubmit={handlePrescriptionSubmit} className="mt-5 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900">New prescription</h4>
                            <p className="text-xs text-slate-500 mt-1">
                              Add medication instructions for consultation #{consultation.id}.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setActivePrescriptionConsultationId(null);
                              setPrescriptionError('');
                            }}
                            className="rounded-lg bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                          >
                            Close
                          </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Issue date</span>
                            <input
                              type="date"
                              value={prescriptionForm.issueDate}
                              onChange={event => setPrescriptionForm(prev => ({ ...prev, issueDate: event.target.value }))}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </label>
                          <label className="block">
                            <span className="mb-2 block text-sm font-medium text-slate-700">Expiry date</span>
                            <input
                              type="date"
                              value={prescriptionForm.expiryDate}
                              onChange={event => setPrescriptionForm(prev => ({ ...prev, expiryDate: event.target.value }))}
                              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </label>
                        </div>

                        <label className="block">
                          <span className="mb-2 block text-sm font-medium text-slate-700">Instructions</span>
                          <textarea
                            value={prescriptionForm.instructions}
                            onChange={event => setPrescriptionForm(prev => ({ ...prev, instructions: event.target.value }))}
                            rows={3}
                            placeholder="General prescription instructions..."
                            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </label>

                        <div className="space-y-3">
                          <div className="flex items-center justify-between gap-3">
                            <h5 className="text-sm font-semibold text-slate-900">Medications</h5>
                            <button
                              type="button"
                              onClick={() => setPrescriptionForm(prev => ({
                                ...prev,
                                medications: [...prev.medications, createMedicationRow()],
                              }))}
                              className="inline-flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors"
                            >
                              <Plus className="h-4 w-4" />
                              Add row
                            </button>
                          </div>

                          {medications.length === 0 ? (
                            <div className="rounded-lg border border-dashed border-slate-200 bg-white px-4 py-4 text-sm text-slate-500">
                              No medications are available yet in the system.
                            </div>
                          ) : (
                            prescriptionForm.medications.map((row, index) => (
                              <div key={`row-${index}`} className="grid gap-3 rounded-lg bg-white p-4 md:grid-cols-2 xl:grid-cols-[1.3fr_0.8fr_0.9fr_0.8fr_auto]">
                                <label className="block">
                                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">Medication</span>
                                  <select
                                    value={row.medicationId}
                                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                                      updateMedicationRow(index, 'medicationId', event.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    <option value="">Select medication</option>
                                    {medications.map(medication => (
                                      <option key={medication.id} value={medication.id}>
                                        {medication.name} ({medication.dosage})
                                      </option>
                                    ))}
                                  </select>
                                </label>

                                <label className="block">
                                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">Quantity</span>
                                  <input
                                    type="number"
                                    min={1}
                                    value={row.quantity}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                      updateMedicationRow(index, 'quantity', event.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </label>

                                <label className="block">
                                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">Frequency</span>
                                  <select
                                    value={row.frequency}
                                    onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                                      updateMedicationRow(index, 'frequency', event.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                                    {frequencyOptions.map(option => (
                                      <option key={option.value} value={option.value}>{option.label}</option>
                                    ))}
                                  </select>
                                </label>

                                <label className="block">
                                  <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-slate-500">Days</span>
                                  <input
                                    type="number"
                                    min={1}
                                    value={row.durationDays}
                                    onChange={(event: ChangeEvent<HTMLInputElement>) =>
                                      updateMedicationRow(index, 'durationDays', event.target.value)
                                    }
                                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
                                </label>

                                <div className="flex items-end">
                                  <button
                                    type="button"
                                    onClick={() => setPrescriptionForm(prev => ({
                                      ...prev,
                                      medications: prev.medications.length === 1
                                        ? prev.medications
                                        : prev.medications.filter((_, rowIndex) => rowIndex !== index),
                                    }))}
                                    disabled={prescriptionForm.medications.length === 1}
                                    className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-3 py-3 text-sm text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-40"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {prescriptionError && (
                          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                            {prescriptionError}
                          </div>
                        )}

                        <div className="flex justify-end">
                          <button
                            type="submit"
                            disabled={createPrescriptionMutation.isPending || medications.length === 0}
                            className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
                          >
                            {createPrescriptionMutation.isPending ? 'Saving...' : 'Create prescription'}
                          </button>
                        </div>
                      </form>
                    )}
                  </article>
                );
              })}

              {filteredConsultations.length > 0 && (
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">
                    Page {consultationPage} of {totalConsultationPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setConsultationPage(prev => Math.max(1, prev - 1))}
                      disabled={consultationPage === 1}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      type="button"
                      onClick={() => setConsultationPage(prev => Math.min(totalConsultationPages, prev + 1))}
                      disabled={consultationPage === totalConsultationPages}
                      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </div>
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

function toDateTimeLocal(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  const hours = `${date.getHours()}`.padStart(2, '0');
  const minutes = `${date.getMinutes()}`.padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function toDateOnly(value: string) {
  return value.slice(0, 10);
}

function formatFrequencyLabel(value: string) {
  return frequencyOptions.find(option => option.value === value)?.label ?? value;
}
