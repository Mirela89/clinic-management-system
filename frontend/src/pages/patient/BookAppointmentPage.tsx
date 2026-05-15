import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/useAuth';
import api from '../../api/axios';

interface Doctor {
  userId: number;
  user: { firstName: string; lastName: string; };
  specialization: string;
  departmentName: string | null;
}

interface Schedule {
  id: number;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isAvailable: boolean;
}

const DAY_ORDER = ['MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY','SUNDAY'];
const DAY_LABELS: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun'
};
const DAY_FULL: Record<string, string> = {
  MONDAY: 'Monday', TUESDAY: 'Tuesday', WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday', FRIDAY: 'Friday', SATURDAY: 'Saturday', SUNDAY: 'Sunday'
};
const DAY_JS_INDEX: Record<string, number> = {
  SUNDAY: 0, MONDAY: 1, TUESDAY: 2, WEDNESDAY: 3,
  THURSDAY: 4, FRIDAY: 5, SATURDAY: 6
};

function generateSlots(startTime: string, endTime: string, duration: number): string[] {
  const slots: string[] = [];
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  let current = sh * 60 + sm;
  const end = eh * 60 + em;
  while (current + duration <= end) {
    const h = Math.floor(current / 60).toString().padStart(2, '0');
    const m = (current % 60).toString().padStart(2, '0');
    slots.push(`${h}:${m}`);
    current += duration;
  }
  return slots;
}

function getNextDatesForDay(dayName: string, count = 4): Date[] {
  const targetIndex = DAY_JS_INDEX[dayName];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dates: Date[] = [];
  let d = new Date(today);
  d.setDate(today.getDate() + 1);
  while (dates.length < count) {
    if (d.getDay() === targetIndex) dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  const labels = ['Speciality', 'Doctor', 'Date & Time', 'Confirm'];
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
              i + 1 < current ? 'bg-blue-500 text-white'
              : i + 1 === current ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-400'
            }`}>
              {i + 1 < current
                ? <i className="ti ti-check text-xs" aria-hidden="true" />
                : i + 1}
            </div>
            <span className={`text-xs hidden sm:block ${i + 1 === current ? 'text-slate-700 font-medium' : 'text-slate-400'}`}>
              {labels[i]}
            </span>
          </div>
          {i < total - 1 && (
            <div className={`h-px w-8 mb-4 ${i + 1 < current ? 'bg-blue-500' : 'bg-slate-200'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function BookAppointmentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedSpeciality, setSelectedSpeciality] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedDay, setSelectedDay] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { data: doctors = [], isLoading: loadingDoctors } = useQuery({
    queryKey: ['all-doctors'],
    queryFn: async () => {
      const res = await api.get('/api/doctors');
      return res.data.data as Doctor[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const specialities = [...new Set(doctors.map(d => d.specialization).filter(Boolean))].sort();
  const filteredDoctors = doctors.filter(d => d.specialization === selectedSpeciality);

  const { data: schedules = [], isLoading: loadingSchedule } = useQuery({
    queryKey: ['doctor-schedule', selectedDoctor?.userId],
    queryFn: async () => {
      const res = await api.get(`/api/doctor-schedules/doctor/${selectedDoctor!.userId}`);
      return (res.data.data as Schedule[]).filter(s => s.isAvailable);
    },
    enabled: !!selectedDoctor,
    staleTime: 5 * 60 * 1000,
  });

  const selectedSchedule = schedules.find(s => s.dayOfWeek === selectedDay);
  const slots = selectedSchedule
    ? generateSlots(selectedSchedule.startTime, selectedSchedule.endTime, selectedSchedule.slotDurationMinutes)
    : [];

  const handleConfirm = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot || !user) return;
    setSubmitting(true);
    setError('');
    try {
      const [h, m] = selectedSlot.split(':');
      const dt = new Date(selectedDate);
      dt.setHours(Number(h), Number(m), 0, 0);

      // Construieste data fara conversie UTC
      const pad = (n: number) => n.toString().padStart(2, '0');
      const appointmentDate = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;

      await api.post('/api/appointments', {
        patientId: user.id,
        doctorId: selectedDoctor.userId,
        appointmentDate,
        durationMinutes: selectedSchedule?.slotDurationMinutes || 30,
        status: 'SCHEDULED',
        notes: notes.trim() || null,
      });
      navigate('/patient/appointments');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <button
          onClick={() => step > 1 ? setStep(s => s - 1) : navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition-colors mb-4"
        >
          <i className="ti ti-arrow-left text-sm" aria-hidden="true" />
          {step > 1 ? 'Back' : 'Cancel'}
        </button>
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Book an appointment</h1>
        <p className="text-slate-400 text-sm mt-1">Choose your specialist and find a time that works for you</p>
      </div>

      <StepIndicator current={step} total={4} />

      {/* STEP 1 — Specialitate */}
      {step === 1 && (
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Choose a speciality</h2>
          <p className="text-sm text-slate-400 mb-5">What type of doctor do you need?</p>

          {loadingDoctors ? (
            <div className="grid grid-cols-2 gap-3">
              {[1,2,3,4].map(i => (
                <div key={i} className="animate-pulse h-14 bg-slate-100 rounded-xl" />
              ))}
            </div>
          ) : specialities.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">No specialities available.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {specialities.map(s => (
                <button
                  key={s}
                  onClick={() => { setSelectedSpeciality(s); setSelectedDoctor(null); setStep(2); }}
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="w-8 h-8 bg-blue-50 group-hover:bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors">
                    <i className="ti ti-stethoscope text-blue-500 text-sm" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-medium text-slate-700">{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 2 — Doctor */}
      {step === 2 && (
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Choose a doctor</h2>
          <p className="text-sm text-slate-400 mb-5">
            {filteredDoctors.length} doctor{filteredDoctors.length !== 1 ? 's' : ''} available in {selectedSpeciality}
          </p>

          <div className="flex flex-col gap-3">
            {filteredDoctors.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No doctors available for this speciality.</p>
            ) : filteredDoctors.map(doctor => {
              const initials = `${doctor.user.firstName[0]}${doctor.user.lastName[0]}`.toUpperCase();
              return (
                <button
                  key={doctor.userId}
                  onClick={() => {
                    setSelectedDoctor(doctor);
                    setSelectedDay('');
                    setSelectedDate(null);
                    setSelectedSlot('');
                    setStep(3);
                  }}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">
                      Dr. {doctor.user.firstName} {doctor.user.lastName}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {doctor.specialization}
                      {doctor.departmentName && ` · ${doctor.departmentName}`}
                    </p>
                  </div>
                  <i className="ti ti-chevron-right text-slate-300 ml-auto flex-shrink-0" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3 — Zi + Data + Ora + Notes */}
      {step === 3 && (
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Choose a date & time</h2>
          <p className="text-sm text-slate-400 mb-5">
            Dr. {selectedDoctor?.user.firstName} {selectedDoctor?.user.lastName}'s availability:
          </p>

          {loadingSchedule ? (
            <div className="flex gap-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="animate-pulse h-10 w-16 bg-slate-100 rounded-lg" />
              ))}
            </div>
          ) : schedules.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">
              This doctor has no available schedule yet.
            </p>
          ) : (
            <>
              {/* Zilele disponibile */}
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Available days</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {DAY_ORDER.filter(d => schedules.some(s => s.dayOfWeek === d)).map(day => (
                  <button
                    key={day}
                    onClick={() => { setSelectedDay(day); setSelectedDate(null); setSelectedSlot(''); }}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                      selectedDay === day
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {DAY_LABELS[day]}
                  </button>
                ))}
              </div>

              {/* Datele disponibile */}
              {selectedDay && (
                <>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">
                    Select a date — {DAY_FULL[selectedDay]}s
                  </p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {getNextDatesForDay(selectedDay).map((date, i) => (
                      <button
                        key={i}
                        onClick={() => { setSelectedDate(date); setSelectedSlot(''); }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                          selectedDate?.toDateString() === date.toDateString()
                            ? 'bg-slate-900 text-white border-slate-900'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {formatDate(date)}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Sloturi orare */}
              {selectedDate && slots.length > 0 && (
                <>
                  <p className="text-xs text-slate-400 uppercase tracking-wide mb-3">Available times</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                    {slots.map(slot => (
                      <button
                        key={slot}
                        onClick={() => setSelectedSlot(slot)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                          selectedSlot === slot
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                </>
              )}

              {/* Notes — apare dupa selectarea slotului */}
              {selectedSlot && (
                <>
                  <div className="mb-6">
                    <label className="block text-xs text-slate-400 uppercase tracking-wide mb-2">
                      Notes for the doctor
                      <span className="text-slate-300 font-normal ml-1">(optional)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Describe your symptoms or reason for visit..."
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  <button
                    onClick={() => setStep(4)}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    Continue
                    <i className="ti ti-arrow-right text-sm" aria-hidden="true" />
                  </button>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* STEP 4 — Confirmare */}
      {step === 4 && (
        <div className="bg-white rounded-xl border border-slate-100 p-6">
          <h2 className="text-base font-semibold text-slate-900 mb-1">Confirm your appointment</h2>
          <p className="text-sm text-slate-400 mb-6">Please review the details before confirming</p>

          <div className="flex flex-col gap-0 mb-6 border border-slate-100 rounded-xl overflow-hidden">
            <SummaryRow icon="ti-stethoscope" label="Speciality" value={selectedSpeciality} />
            <SummaryRow
              icon="ti-user-check"
              label="Doctor"
              value={`Dr. ${selectedDoctor?.user.firstName} ${selectedDoctor?.user.lastName}`}
            />
            <SummaryRow
              icon="ti-calendar"
              label="Date"
              value={selectedDate ? formatDate(selectedDate) : ''}
            />
            <SummaryRow icon="ti-clock" label="Time" value={selectedSlot} />
            <SummaryRow
              icon="ti-hourglass"
              label="Duration"
              value={`${selectedSchedule?.slotDurationMinutes || 30} minutes`}
            />
            {notes.trim() && (
              <SummaryRow icon="ti-notes" label="Notes" value={notes.trim()} />
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-xl px-4 py-3 flex items-center gap-2 mb-4">
              <i className="ti ti-alert-circle text-base flex-shrink-0" aria-hidden="true" />
              {error}
            </div>
          )}

          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Booking...
              </>
            ) : (
              <>
                <i className="ti ti-calendar-plus text-base" aria-hidden="true" />
                Confirm booking
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

function SummaryRow({ icon, label, value }: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-50 last:border-0 bg-white">
      <div className="w-7 h-7 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <i className={`ti ${icon} text-slate-400 text-sm`} aria-hidden="true" />
      </div>
      <div className="flex items-center justify-between w-full">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-900">{value}</p>
      </div>
    </div>
  );
}