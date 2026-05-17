import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { FormEvent } from "react";
import { CalendarDays, Clock3, Pencil, Plus, Trash2 } from "lucide-react";
import api from "../../api/axios";
import { useAuth } from "../../context/useAuth";

interface DoctorScheduleResponse {
  id: number;
  doctorId: number;
  doctorFullName: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isAvailable: boolean;
}

type DayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

type ScheduleFormState = {
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
  isAvailable: boolean;
};

const dayOptions: Array<{ value: DayOfWeek; label: string }> = [
  { value: "MONDAY", label: "Monday" },
  { value: "TUESDAY", label: "Tuesday" },
  { value: "WEDNESDAY", label: "Wednesday" },
  { value: "THURSDAY", label: "Thursday" },
  { value: "FRIDAY", label: "Friday" },
  { value: "SATURDAY", label: "Saturday" },
  { value: "SUNDAY", label: "Sunday" },
];

const initialForm: ScheduleFormState = {
  dayOfWeek: "MONDAY",
  startTime: "09:00",
  endTime: "13:00",
  slotDurationMinutes: 30,
  isAvailable: true,
};

export default function DoctorSchedulePage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [form, setForm] = useState<ScheduleFormState>(initialForm);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(
    null,
  );
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const doctorId = user?.id;

  const {
    data: schedules = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["doctor-schedules", doctorId],
    enabled: !!doctorId,
    queryFn: async () => {
      const res = await api.get(`/api/doctor-schedules/doctor/${doctorId}`);
      return res.data.data as DoctorScheduleResponse[];
    },
  });

  const orderedSchedules = useMemo(() => {
    const orderMap = new Map(
      dayOptions.map((option, index) => [option.value, index]),
    );
    return [...schedules].sort((a, b) => {
      const orderA = orderMap.get(a.dayOfWeek) ?? 0;
      const orderB = orderMap.get(b.dayOfWeek) ?? 0;
      return orderA - orderB;
    });
  }, [schedules]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!doctorId) throw new Error("Doctor account not available.");

      const payload = {
        doctorId,
        dayOfWeek: form.dayOfWeek,
        startTime: `${form.startTime}:00`,
        endTime: `${form.endTime}:00`,
        slotDurationMinutes: form.slotDurationMinutes,
        isAvailable: form.isAvailable,
      };

      if (editingScheduleId) {
        return api.put(`/api/doctor-schedules/${editingScheduleId}`, payload);
      }

      return api.post("/api/doctor-schedules", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["doctor-schedules", doctorId],
      });
      setSuccessMessage(
        editingScheduleId
          ? "Schedule updated successfully."
          : "Schedule created successfully.",
      );
      resetForm();
    },
    onError: (error: any) => {
      setFormError(error.response?.data?.message || "Failed to save schedule.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (scheduleId: number) =>
      api.delete(`/api/doctor-schedules/${scheduleId}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["doctor-schedules", doctorId],
      });
      setSuccessMessage("Schedule deleted successfully.");
      if (editingScheduleId) {
        resetForm();
      }
    },
    onError: (error: any) => {
      setFormError(
        error.response?.data?.message || "Failed to delete schedule.",
      );
    },
  });

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFormError("");
    setSuccessMessage("");

    if (form.endTime <= form.startTime) {
      setFormError("End time must be later than start time.");
      return;
    }

    const startMinutes = toMinutes(form.startTime);
    const endMinutes = toMinutes(form.endTime);
    if (endMinutes - startMinutes < form.slotDurationMinutes) {
      setFormError(
        "Working interval must be at least as long as the slot duration.",
      );
      return;
    }

    await saveMutation.mutateAsync();
  };

  const startEditing = (schedule: DoctorScheduleResponse) => {
    setEditingScheduleId(schedule.id);
    setFormError("");
    setSuccessMessage("");
    setForm({
      dayOfWeek: schedule.dayOfWeek,
      startTime: schedule.startTime.slice(0, 5),
      endTime: schedule.endTime.slice(0, 5),
      slotDurationMinutes: schedule.slotDurationMinutes,
      isAvailable: schedule.isAvailable,
    });
  };

  const resetForm = () => {
    setForm(initialForm);
    setEditingScheduleId(null);
    setFormError("");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
        Failed to load your schedule.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My schedule</h1>
        <p className="text-sm text-slate-500 mt-1">
          Define the weekly intervals patients can use when booking appointments
          with you.
        </p>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                {editingScheduleId ? "Edit interval" : "Add interval"}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                One interval per weekday is allowed by the backend.
              </p>
            </div>
            <div className="rounded-xl bg-blue-50 p-3 text-blue-600">
              {editingScheduleId ? (
                <Pencil className="h-5 w-5" />
              ) : (
                <Plus className="h-5 w-5" />
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Day
              </span>
              <select
                value={form.dayOfWeek}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    dayOfWeek: event.target.value as DayOfWeek,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {dayOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  Start time
                </span>
                <input
                  type="time"
                  value={form.startTime}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      startTime: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">
                  End time
                </span>
                <input
                  type="time"
                  value={form.endTime}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      endTime: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-slate-700">
                Slot duration
              </span>
              <select
                value={form.slotDurationMinutes}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    slotDurationMinutes: Number(event.target.value),
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={15}>15 minutes</option>
                <option value={20}>20 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>60 minutes</option>
              </select>
            </label>

            <label className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                type="checkbox"
                checked={form.isAvailable}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    isAvailable: event.target.checked,
                  }))
                }
                className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-slate-700">
                Visible to patients for booking
              </span>
            </label>

            {formError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {formError}
              </div>
            )}

            <div className="flex justify-end gap-3">
              {editingScheduleId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Cancel edit
                </button>
              )}
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
              >
                {saveMutation.isPending
                  ? "Saving..."
                  : editingScheduleId
                    ? "Update interval"
                    : "Save interval"}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <SummaryCard
              icon={<CalendarDays className="h-5 w-5 text-blue-600" />}
              label="Configured days"
              value={orderedSchedules.length.toString()}
              tone="bg-blue-50"
            />
            <SummaryCard
              icon={<Clock3 className="h-5 w-5 text-emerald-600" />}
              label="Bookable days"
              value={orderedSchedules
                .filter((schedule) => schedule.isAvailable)
                .length.toString()}
              tone="bg-emerald-50"
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Weekly schedule
            </h2>

            {orderedSchedules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                You do not have any schedule intervals yet.
              </div>
            ) : (
              <div className="space-y-3">
                {orderedSchedules.map((schedule) => (
                  <article
                    key={schedule.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-base font-semibold text-slate-900">
                            {formatDayLabel(schedule.dayOfWeek)}
                          </h3>
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                              schedule.isAvailable
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {schedule.isAvailable ? "Bookable" : "Hidden"}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-slate-600">
                          {schedule.startTime.slice(0, 5)} -{" "}
                          {schedule.endTime.slice(0, 5)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {schedule.slotDurationMinutes}-minute booking slots
                        </p>
                      </div>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(schedule)}
                          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteMutation.mutate(schedule.id)}
                          disabled={deleteMutation.isPending}
                          className="inline-flex items-center gap-2 rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-700 hover:bg-rose-50 transition-colors disabled:opacity-60"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className={`mb-4 inline-flex rounded-xl p-3 ${tone}`}>{icon}</div>
      <p className="text-3xl font-semibold text-slate-900">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </div>
  );
}

function formatDayLabel(day: DayOfWeek) {
  return dayOptions.find((option) => option.value === day)?.label ?? day;
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}
