import { useQuery } from '@tanstack/react-query';
import { Droplets, Mail, MapPin, Phone, ShieldPlus, UserCircle2 } from 'lucide-react';
import api from '../../api/axios';
import { useAuth } from '../../context/useAuth';

interface PatientResponse {
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
  cnp: string;
  dateOfBirth: string;
  address: string | null;
  bloodType: string | null;
  insuranceId: number | null;
  insuranceProviderName: string | null;
}

export default function PatientProfilePage() {
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['patient-profile', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await api.get(`/api/patients/${user?.id}`);
      return res.data.data as PatientResponse;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4">
        Failed to load patient profile.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">My profile</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review the personal and medical details attached to your account.
        </p>
      </div>

      <section className="rounded-3xl bg-slate-900 p-6 text-white">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
              <UserCircle2 className="h-8 w-8" />
            </div>
            <div>
              <p className="text-2xl font-semibold">
                {data.user.firstName} {data.user.lastName}
              </p>
              <p className="mt-1 text-sm text-slate-300">@{data.user.username}</p>
            </div>
          </div>
          <div className="rounded-2xl bg-white/10 px-4 py-3 text-sm text-slate-200">
            Patient account
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Contact details</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <InfoCard icon={<Mail className="h-4 w-4" />} label="Email" value={data.user.email} />
            <InfoCard icon={<Phone className="h-4 w-4" />} label="Phone" value={data.user.phone || 'Not provided'} />
            <InfoCard icon={<MapPin className="h-4 w-4" />} label="Address" value={data.address || 'Not provided'} />
            <InfoCard icon={<ShieldPlus className="h-4 w-4" />} label="Insurance" value={data.insuranceProviderName || 'No insurance linked'} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Medical summary</h2>
          <div className="mt-5 grid gap-4">
            <InfoCard icon={<Droplets className="h-4 w-4" />} label="Blood type" value={formatBloodType(data.bloodType)} />
            <InfoCard icon={<UserCircle2 className="h-4 w-4" />} label="Date of birth" value={formatDate(data.dateOfBirth)} />
            <InfoCard icon={<ShieldPlus className="h-4 w-4" />} label="CNP" value={data.cnp} />
          </div>
        </section>
      </div>
    </div>
  );
}

function InfoCard({ icon, label, value }: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-slate-600">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-sm text-slate-900 leading-6">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatBloodType(value: string | null) {
  return value ? value.replace('_POSITIVE', '+').replace('_NEGATIVE', '-').replace('_', '') : 'Not provided';
}
