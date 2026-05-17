import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import type { ChangeEvent, FormEvent } from "react";
import api from "../../api/axios";

interface DoctorResponse {
  userId: number;
  user: {
    id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    role: string;
  };
  specialization: string;
  licenseNumber: string | null;
  departmentId: number | null;
  departmentName: string | null;
}

interface DepartmentResponse {
  id: number;
  name: string;
  description: string;
  floor: number;
  doctorCount: number;
}

interface UserResponse {
  id: number;
}

const initialForm = {
  username: "",
  password: "",
  email: "",
  firstName: "",
  lastName: "",
  phone: "",
  specialization: "",
  licenseNumber: "",
  departmentId: "",
};

export default function DoctorsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [form, setForm] = useState(initialForm);

  const {
    data: doctors = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["doctors"],
    queryFn: async () => {
      const res = await api.get("/api/doctors");
      return res.data.data as DoctorResponse[];
    },
  });

  const { data: departments = [] } = useQuery({
    queryKey: ["departments-admin"],
    queryFn: async () => {
      const res = await api.get("/api/departments");
      return res.data.data as DepartmentResponse[];
    },
  });

  const stats = useMemo(() => {
    const withDepartment = doctors.filter((d) => d.departmentName).length;
    const uniqueSpecializations = new Set(
      doctors.map((d) => d.specialization.trim()).filter(Boolean),
    ).size;
    return { total: doctors.length, withDepartment, uniqueSpecializations };
  }, [doctors]);

  const createDoctorMutation = useMutation({
    mutationFn: async () => {
      setFormError("");
      setSuccessMessage("");
      let createdUserId: number | null = null;
      try {
        const userRes = await api.post("/api/users", {
          username: form.username.trim(),
          password: form.password,
          email: form.email.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || null,
          role: "DOCTOR",
        });
        createdUserId = (userRes.data.data as UserResponse).id;
        await api.post("/api/doctors", {
          userId: createdUserId,
          specialization: form.specialization.trim(),
          licenseNumber: form.licenseNumber.trim() || null,
          departmentId: form.departmentId ? Number(form.departmentId) : null,
        });
      } catch (error) {
        if (createdUserId) {
          try {
            await api.delete(`/api/users/${createdUserId}`);
          } catch {}
        }
        throw error;
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["doctors"] }),
        queryClient.invalidateQueries({ queryKey: ["departments-admin"] }),
      ]);
      setSuccessMessage("Doctor created successfully.");
      setForm(initialForm);
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      setFormError(error.response?.data?.message || "Failed to create doctor.");
    },
  });

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await createDoctorMutation.mutateAsync();
  };

  if (isLoading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );

  if (isError)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
        Failed to load doctors.
      </div>
    );

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Doctors
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Manage clinicians and create new doctor accounts
          </p>
        </div>
        <button
          onClick={() => {
            setIsCreateOpen(true);
            setFormError("");
            setSuccessMessage("");
          }}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
        >
          <i className="ti ti-plus text-base" aria-hidden="true" />
          Add doctor
        </button>
      </div>

      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm rounded-xl px-4 py-3 mb-4 flex items-center gap-2">
          <i className="ti ti-circle-check text-base" aria-hidden="true" />
          {successMessage}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard
          icon="ti-stethoscope"
          label="Total doctors"
          value={stats.total}
          color="text-blue-500"
          bg="bg-blue-50"
        />
        <StatCard
          icon="ti-building-hospital"
          label="Assigned to dept."
          value={stats.withDepartment}
          color="text-emerald-500"
          bg="bg-emerald-50"
        />
        <StatCard
          icon="ti-award"
          label="Specializations"
          value={stats.uniqueSpecializations}
          color="text-purple-500"
          bg="bg-purple-50"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="text-left px-4 py-3 font-medium">Doctor</th>
              <th className="text-left px-4 py-3 font-medium">
                Specialization
              </th>
              <th className="text-left px-4 py-3 font-medium">Department</th>
              <th className="text-left px-4 py-3 font-medium">License</th>
              <th className="text-left px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {doctors.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-10 text-center text-slate-400 text-sm"
                >
                  No doctors yet. Add the first doctor from the button above.
                </td>
              </tr>
            ) : (
              doctors.map((doctor, i) => {
                const initials =
                  `${doctor.user.firstName[0]}${doctor.user.lastName[0]}`.toUpperCase();
                return (
                  <tr
                    key={doctor.userId}
                    className={`border-t border-slate-50 hover:bg-slate-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-medium flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">
                            Dr. {doctor.user.firstName} {doctor.user.lastName}
                          </p>
                          <p className="text-xs text-slate-400">
                            @{doctor.user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {doctor.specialization}
                    </td>
                    <td className="px-4 py-3">
                      {doctor.departmentName ? (
                        <span className="text-slate-600">
                          {doctor.departmentName}
                        </span>
                      ) : (
                        <span className="text-slate-300 text-xs">
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {doctor.licenseNumber || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <i
                            className="ti ti-mail text-slate-300"
                            aria-hidden="true"
                          />
                          {doctor.user.email}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <i
                            className="ti ti-phone text-slate-300"
                            aria-hidden="true"
                          />
                          {doctor.user.phone || "—"}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => navigate(`/doctors/${doctor.userId}`)}
                        className="text-xs text-blue-500 hover:text-blue-700 border border-blue-100 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  Add doctor
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Creates a login account and doctor profile
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCreateOpen(false);
                  setFormError("");
                  setForm(initialForm);
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <i className="ti ti-x text-lg" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Username" required>
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <FormField label="Password" required>
                  <input
                    type="password"
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    minLength={6}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <FormField label="First name" required>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <FormField label="Last name" required>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <FormField label="Email" required>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <FormField label="Phone">
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <FormField label="Specialization" required>
                  <input
                    name="specialization"
                    value={form.specialization}
                    onChange={handleChange}
                    required
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <FormField label="License number">
                  <input
                    name="licenseNumber"
                    value={form.licenseNumber}
                    onChange={handleChange}
                    className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <div className="sm:col-span-2">
                  <FormField label="Department">
                    <select
                      name="departmentId"
                      value={form.departmentId}
                      onChange={handleChange}
                      className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>

              {formError && (
                <div className="mt-4 bg-red-50 border border-red-100 text-red-500 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                  <i
                    className="ti ti-alert-circle text-base flex-shrink-0"
                    aria-hidden="true"
                  />
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateOpen(false);
                    setFormError("");
                    setForm(initialForm);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDoctorMutation.isPending}
                  className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <i className="ti ti-plus text-sm" aria-hidden="true" />
                  {createDoctorMutation.isPending
                    ? "Creating..."
                    : "Create doctor"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: string;
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-5">
      <div
        className={`w-9 h-9 ${bg} rounded-lg flex items-center justify-center mb-3`}
      >
        <i className={`ti ${icon} ${color} text-base`} aria-hidden="true" />
      </div>
      <p className="text-2xl font-semibold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
    </div>
  );
}

function FormField({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
    </div>
  );
}
