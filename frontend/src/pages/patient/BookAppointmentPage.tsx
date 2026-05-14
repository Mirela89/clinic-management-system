import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, CalendarDays, Clock3, NotebookPen, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/useAuth';

interface DoctorResponse {
  userId: number;
  user: {
    firstName: string;
    lastName: string;
  };
  specialization: string;
  licenseNumber: string | null;
  departmentName: string | null;
}

interface DoctorScheduleResponse {
  id: number;
  doctorId: number;
  doctorFullName: string;
  dayOfWeek: keyof typeof dayIndexMap;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isAvailable: boolean;
}

const dayIndexMap = {
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
} as const;

const dayLabels: Record<keyof typeof dayIndexMap, string> = {
  MONDAY: 'Mon',
  TUESDAY: 'Tue',
  WEDNESDAY: 'Wed',
  THURSDAY: 'Thu',
  FRIDAY: 'Fri',
  SATURDAY: 'Sat',
  SUNDAY: 'Sun',
};

export default function BookAppointmentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const { data: doctors = [], isLoading: doctorsLoading, isError: doctorsError } = useQuery({
    queryKey: ['patient-book-doctors'],
    queryFn: async () => {
      const res = await api.get('/api/doctors');
      return res.data.data as DoctorResponse[];
    }
  });

  const { data: schedules = [], isLoading: schedulesLoading } = useQuery({
    queryKey: ['patient-book-schedules', selectedDoctorId],
    enabled: selectedDoctorId !== null,
    queryFn: async () => {
      const res = await api.get(`/api/doctor-schedules/doctor/${selectedDoctorId}`);
      return (res.data.data as DoctorScheduleResponse[]).filter(schedule => schedule.isAvailable);
    }
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedDoctorId || !user?.id) {
        throw new Error('Missing doctor or patient information.');
      }

      return api.post('/api/appointments', {
        appointmentDate: `${appointmentDate}T${appointmentTime}:00`,
        durationMinutes,
        status: 'SCHEDULED',
        notes: notes.trim() || null,
        patientId: user.id,
        doctorId: selectedDoctorId,
      });
    },
    onSuccess: () => {
      navigate('/patient/appointments');
    },
    onError: (error: any) => {
      setFormError(error.response?.data?.message || 'Failed to create the appointment.');
    }
  });

  const selectedDoctor = useMemo(
    () => doctors.find(doctor => doctor.userId === selectedDoctorId) ?? null,
    [doctors, selectedDoctorId]
  );

  const availableDays = useMemo(
    () => schedules.map(schedule => schedule.dayOfWeek),
    [schedules]
  );

  const availableDateOptions = useMemo(() => {
    const options: Array<{
      dateValue: string;
      schedule: DoctorScheduleResponse;
      formattedShort: string;
      formattedLong: string;
    }> = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let offset = 0; offset < 21; offset += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + offset);

      const matchingSchedule = schedules.find(
        schedule => dayIndexMap[schedule.dayOfWeek] === date.getDay()
      );

      if (!matchingSchedule) continue;

      options.push({
        dateValue: formatDateValue(date),
        schedule: matchingSchedule,
        formattedShort: date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
        }),
        formattedLong: date.toLocaleDateString('en-GB', {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        }),
      });
    }

    return options;
  }, [schedules]);

  const selectedSchedule = useMemo(() => {
    if (!appointmentDate) return null;
    const selectedDayIndex = new Date(`${appointmentDate}T00:00:00`).getDay();
    return schedules.find(schedule => dayIndexMap[schedule.dayOfWeek] === selectedDayIndex) ?? null;
  }, [appointmentDate, schedules]);

  const durationOptions = useMemo(() => {
    if (!selectedSchedule) return [15, 30, 45, 60];
    return [15, 30, 45, 60].filter(option => option <= selectedSchedule.slotDurationMinutes);
  }, [selectedSchedule]);

  const availableTimeSlots = useMemo(() => {
    if (!selectedSchedule) return [];

    const slotStep = selectedSchedule.slotDurationMinutes;
    const firstStart = timeToMinutes(selectedSchedule.startTime);
    const lastStart = timeToMinutes(selectedSchedule.endTime) - durationMinutes;
    const slots: string[] = [];

    for (let current = firstStart; current <= lastStart; current += slotStep) {
      slots.push(minutesToTime(current));
    }

    return slots;
  }, [durationMinutes, selectedSchedule]);

  useEffect(() => {
    setAppointmentDate('');
    setAppointmentTime('');
    setFormError('');
  }, [selectedDoctorId]);

  useEffect(() => {
    if (availableDateOptions.length === 0) {
      setAppointmentDate('');
      return;
    }

    const stillValid = availableDateOptions.some(option => option.dateValue === appointmentDate);
    if (!stillValid) {
      setAppointmentDate(availableDateOptions[0].dateValue);
    }
  }, [appointmentDate, availableDateOptions]);

  useEffect(() => {
    if (!selectedSchedule) {
      setAppointmentTime('');
      return;
    }

    if (!durationOptions.includes(durationMinutes)) {
      setDurationMinutes(durationOptions[durationOptions.length - 1]);
      return;
    }

    if (availableTimeSlots.length === 0) {
      setAppointmentTime('');
      return;
    }

    if (!availableTimeSlots.includes(appointmentTime)) {
      setAppointmentTime(availableTimeSlots[0]);
    }
  }, [appointmentTime, availableTimeSlots, durationMinutes, durationOptions, selectedSchedule]);

  const handleSelectDoctor = (doctorId: number) => {
    setSelectedDoctorId(doctorId);
    setFormError('');
  };

  const goToDetails = () => {
    if (!selectedDoctorId) {
      setFormError('Choose a doctor before continuing.');
      return;
    }

    setFormError('');
    setStep(2);
  };

  const goToReview = () => {
    if (!appointmentDate || !appointmentTime) {
      setFormError('Choose both a date and a time for the appointment.');
      return;
    }

    if (!selectedSchedule) {
      setFormError('No working schedule was found for the selected date.');
      return;
    }

    if (durationMinutes > selectedSchedule.slotDurationMinutes) {
      setFormError(`Duration cannot exceed ${selectedSchedule.slotDurationMinutes} minutes for this slot.`);
      return;
    }

    if (!availableTimeSlots.includes(appointmentTime)) {
      setFormError('Choose one of the available time slots shown below.');
      return;
    }

    setFormError('');
    setStep(3);
  };

  const submitAppointment = async () => {
    setFormError('');
    await mutation.mutateAsync();
  };

  if (doctorsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (doctorsError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
        Failed to load doctors. Make sure the backend is running.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Book an appointment</h1>
        <p className="text-sm text-slate-500 mt-1">
          Choose a doctor, pick one of the available intervals, then review your request.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StepCard number={1} label="Choose doctor" active={step === 1} done={step > 1} />
        <StepCard number={2} label="Set schedule" active={step === 2} done={step > 2} />
        <StepCard number={3} label="Review" active={step === 3} done={false} />
      </div>

      {step === 1 && (
        <div className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-2">
            {doctors.map(doctor => {
              const isSelected = doctor.userId === selectedDoctorId;

              return (
                <button
                  key={doctor.userId}
                  type="button"
                  onClick={() => handleSelectDoctor(doctor.userId)}
                  className={`rounded-2xl border p-5 text-left transition-all ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">
                        Dr. {doctor.user.firstName} {doctor.user.lastName}
                      </p>
                      <p className="mt-1 text-sm text-blue-700">{doctor.specialization}</p>
                    </div>
                    {isSelected && <BadgeCheck className="h-5 w-5 text-blue-600" />}
                  </div>
                  <div className="mt-4 grid gap-2 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="h-4 w-4" />
                      <span>{doctor.departmentName || 'General practice'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <NotebookPen className="h-4 w-4" />
                      <span>{doctor.licenseNumber || 'License number unavailable'}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={goToDetails}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
            >
              Continue
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 2 && selectedDoctor && (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <p className="text-lg font-semibold text-slate-900">
                Dr. {selectedDoctor.user.firstName} {selectedDoctor.user.lastName}
              </p>
              <p className="text-sm text-slate-500 mt-1">{selectedDoctor.specialization}</p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Available dates</span>
                {availableDateOptions.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    This doctor does not have any available dates in the next 3 weeks.
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {availableDateOptions.map(option => {
                      const isSelected = appointmentDate === option.dateValue;

                      return (
                        <button
                          key={option.dateValue}
                          type="button"
                          onClick={() => {
                            setAppointmentDate(option.dateValue);
                            setFormError('');
                          }}
                          className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          <p className="text-sm font-semibold text-slate-900">{option.formattedShort}</p>
                          <p className="mt-1 text-xs text-slate-500">{option.formattedLong}</p>
                          <p className="mt-2 text-xs text-blue-700">
                            {option.schedule.startTime.slice(0, 5)} - {option.schedule.endTime.slice(0, 5)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Duration</span>
                <select
                  value={durationMinutes}
                  onChange={event => {
                    setDurationMinutes(Number(event.target.value));
                    setFormError('');
                  }}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {durationOptions.map(option => (
                    <option key={option} value={option}>{option} minutes</option>
                  ))}
                </select>
              </label>

              <div className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Selected interval</span>
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  {selectedSchedule
                    ? `${selectedSchedule.startTime.slice(0, 5)} - ${selectedSchedule.endTime.slice(0, 5)} every ${selectedSchedule.slotDurationMinutes} min`
                    : 'Choose an available date first.'}
                </div>
              </div>

              <div className="md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Available time slots</span>
                {availableTimeSlots.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">
                    No time slots available for the current duration. Try a shorter appointment or another date.
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {availableTimeSlots.map(slot => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => {
                          setAppointmentTime(slot);
                          setFormError('');
                        }}
                        className={`rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                          appointmentTime === slot
                            ? 'border-blue-500 bg-blue-500 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium text-slate-700">Notes for the doctor</span>
                <textarea
                  value={notes}
                  onChange={event => setNotes(event.target.value)}
                  rows={4}
                  placeholder="Describe symptoms or the reason for your visit."
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Doctor schedule</h2>
            <p className="mt-1 text-sm text-slate-500">
              These are the weekly intervals currently published by the doctor.
            </p>

            {schedulesLoading ? (
              <div className="mt-6 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : schedules.length === 0 ? (
              <div className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No published schedule for this doctor yet.
              </div>
            ) : (
              <>
                <div className="mt-6 flex flex-wrap gap-2">
                  {availableDays.map(day => (
                    <span key={day} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {dayLabels[day]}
                    </span>
                  ))}
                </div>
                <div className="mt-5 space-y-3">
                  {schedules.map(schedule => (
                    <div key={schedule.id} className="rounded-xl border border-slate-200 px-4 py-3">
                      <p className="text-sm font-medium text-slate-800">{dayLabels[schedule.dayOfWeek]}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {schedule.startTime.slice(0, 5)} - {schedule.endTime.slice(0, 5)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Slot duration: {schedule.slotDurationMinutes} minutes
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {formError && (
            <div className="xl:col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          )}

          <div className="xl:col-span-2 flex justify-between">
            <button
              type="button"
              onClick={() => { setStep(1); setFormError(''); }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={goToReview}
              disabled={!appointmentDate || !appointmentTime}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Review booking
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {step === 3 && selectedDoctor && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Review your appointment</h2>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <ReviewCard
                icon={<Stethoscope className="h-4 w-4" />}
                label="Doctor"
                value={`Dr. ${selectedDoctor.user.firstName} ${selectedDoctor.user.lastName}`}
              />
              <ReviewCard
                icon={<CalendarDays className="h-4 w-4" />}
                label="Date"
                value={appointmentDate ? formatReviewDate(appointmentDate) : 'Not selected'}
              />
              <ReviewCard
                icon={<Clock3 className="h-4 w-4" />}
                label="Time and duration"
                value={`${appointmentTime || '--:--'} / ${durationMinutes} minutes`}
              />
              <ReviewCard
                icon={<NotebookPen className="h-4 w-4" />}
                label="Notes"
                value={notes || 'No notes added'}
              />
            </div>
          </div>

          {formError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {formError}
            </div>
          )}

          <div className="flex justify-between">
            <button
              type="button"
              onClick={() => { setStep(2); setFormError(''); }}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              type="button"
              onClick={submitAppointment}
              disabled={mutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {mutation.isPending ? 'Scheduling...' : 'Confirm appointment'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepCard({ number, label, active, done }: {
  number: number;
  label: string;
  active: boolean;
  done: boolean;
}) {
  return (
    <div className={`rounded-2xl border px-4 py-4 ${active ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center gap-3">
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
          done ? 'bg-blue-600 text-white' : active ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
        }`}>
          {done ? <BadgeCheck className="h-4 w-4" /> : number}
        </div>
        <span className={`text-sm font-medium ${active ? 'text-blue-900' : 'text-slate-700'}`}>{label}</span>
      </div>
    </div>
  );
}

function ReviewCard({ icon, label, value }: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm text-slate-900">{value}</p>
    </div>
  );
}

function formatDateValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function timeToMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(value: number) {
  const hours = `${Math.floor(value / 60)}`.padStart(2, '0');
  const minutes = `${value % 60}`.padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatReviewDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
