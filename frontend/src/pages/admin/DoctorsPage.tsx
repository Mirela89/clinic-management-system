import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Mail, Phone, Plus, ShieldCheck, Stethoscope, UserRound } from 'lucide-react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import api from '../../api/axios';

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
  username: '',
  password: '',
  email: '',
  firstName: '',
  lastName: '',
  phone: '',
  specialization: '',
  licenseNumber: '',
  departmentId: '',
};

export default function DoctorsPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [form, setForm] = useState(initialForm);

  const { data: doctors = [], isLoading, isError } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const res = await api.get('/api/doctors');
      return res.data.data as DoctorResponse[];
    }
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['departments-admin'],
    queryFn: async () => {
      const res = await api.get('/api/departments');
      return res.data.data as DepartmentResponse[];
    }
  });

  const stats = useMemo(() => {
    const withDepartment = doctors.filter(doctor => doctor.departmentName).length;
    const uniqueSpecializations = new Set(
      doctors.map(doctor => doctor.specialization.trim()).filter(Boolean)
    ).size;

    return {
      total: doctors.length,
      withDepartment,
      uniqueSpecializations,
    };
  }, [doctors]);

  const createDoctorMutation = useMutation({
    mutationFn: async () => {
      setFormError('');
      setSuccessMessage('');

      let createdUserId: number | null = null;

      try {
        const userRes = await api.post('/api/users', {
          username: form.username.trim(),
          password: form.password,
          email: form.email.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || null,
          role: 'DOCTOR',
        });

        createdUserId = (userRes.data.data as UserResponse).id;

        await api.post('/api/doctors', {
          userId: createdUserId,
          specialization: form.specialization.trim(),
          licenseNumber: form.licenseNumber.trim() || null,
          departmentId: form.departmentId ? Number(form.departmentId) : null,
        });
      } catch (error) {
        if (createdUserId) {
          try {
            await api.delete(`/api/users/${createdUserId}`);
          } catch {
            // Best-effort cleanup to avoid leaving a DOCTOR user without a profile.
          }
        }
        throw error;
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['doctors'] }),
        queryClient.invalidateQueries({ queryKey: ['departments-admin'] }),
      ]);
      setSuccessMessage('Doctor created successfully.');
      setForm(initialForm);
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      setFormError(error.response?.data?.message || 'Failed to create doctor.');
    }
  });

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const openCreate = () => {
    setFormError('');
    setSuccessMessage('');
    setIsCreateOpen(true);
  };

  const closeCreate = () => {
    setIsCreateOpen(false);
    setFormError('');
    setForm(initialForm);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await createDoctorMutation.mutateAsync();
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
        Failed to load doctors.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Doctors</h1>
          <p className="text-sm text-slate-500 mt-1">
            Create doctor accounts and manage the clinicians already available in the system.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add doctor
        </button>
      </div>

      {successMessage && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<UserRound className="h-5 w-5 text-blue-600" />}
          label="Total doctors"
          value={stats.total.toString()}
          tone="bg-blue-50"
        />
        <StatCard
          icon={<ShieldCheck className="h-5 w-5 text-emerald-600" />}
          label="Assigned to department"
          value={stats.withDepartment.toString()}
          tone="bg-emerald-50"
        />
        <StatCard
          icon={<Stethoscope className="h-5 w-5 text-violet-600" />}
          label="Specializations"
          value={stats.uniqueSpecializations.toString()}
          tone="bg-violet-50"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="px-4 py-3 text-left">Doctor</th>
              <th className="px-4 py-3 text-left">Specialization</th>
              <th className="px-4 py-3 text-left">Department</th>
              <th className="px-4 py-3 text-left">License</th>
              <th className="px-4 py-3 text-left">Contact</th>
            </tr>
          </thead>
          <tbody>
            {doctors.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-500">
                  No doctors yet. Add the first doctor from the button above.
                </td>
              </tr>
            ) : (
              doctors.map((doctor, index) => (
                <tr key={doctor.userId} className={index % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                        <UserRound className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900">
                          Dr. {doctor.user.firstName} {doctor.user.lastName}
                        </p>
                        <p className="text-xs text-slate-500">@{doctor.user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-slate-700">{doctor.specialization}</td>
                  <td className="px-4 py-4 text-slate-700">{doctor.departmentName || 'Unassigned'}</td>
                  <td className="px-4 py-4 text-slate-700">{doctor.licenseNumber || 'Not set'}</td>
                  <td className="px-4 py-4">
                    <div className="space-y-1 text-slate-600">
                      <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5" />
                        <span>{doctor.user.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{doctor.user.phone || 'No phone'}</span>
                      </div>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <h2 className="text-xl font-semibold text-slate-900">Create doctor</h2>
              <p className="mt-1 text-sm text-slate-500">
                This creates both the login account with role `DOCTOR` and the doctor profile.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6 px-6 py-6">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField label="Username" required>
                  <input
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <FormField label="First name" required>
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <FormField label="Last name" required>
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <FormField label="Email" required>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <FormField label="Phone">
                  <input
                    name="phone"
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <FormField label="Specialization" required>
                  <input
                    name="specialization"
                    value={form.specialization}
                    onChange={handleChange}
                    required
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <FormField label="License number">
                  <input
                    name="licenseNumber"
                    value={form.licenseNumber}
                    onChange={handleChange}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </FormField>
                <div className="md:col-span-2">
                  <FormField label="Department">
                    <select
                      name="departmentId"
                      value={form.departmentId}
                      onChange={handleChange}
                      className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">No department yet</option>
                      {departments.map(department => (
                        <option key={department.id} value={department.id}>
                          {department.name}
                        </option>
                      ))}
                    </select>
                  </FormField>
                </div>
              </div>

              {formError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeCreate}
                  className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createDoctorMutation.isPending}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white hover:bg-slate-800 transition-colors disabled:opacity-60"
                >
                  <Plus className="h-4 w-4" />
                  {createDoctorMutation.isPending ? 'Creating...' : 'Create doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, tone }: {
  icon: ReactNode;
  label: string;
  value: string;
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

function FormField({ label, required = false, children }: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-slate-700">
        {label} {required ? <span className="text-rose-500">*</span> : null}
      </span>
      {children}
    </label>
  );
}
