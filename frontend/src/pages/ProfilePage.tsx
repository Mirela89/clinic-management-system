import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
          My Profile
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          View and manage your account information
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT COLUMN — 1/3 */}
        <div className="flex flex-col gap-4">
          <AvatarCard user={user} />
          <AccountDetailsCard user={user} />
        </div>

        {/* RIGHT COLUMN — 2/3 */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {user?.role === "PATIENT" && <PatientSection userId={user.id} />}
          {user?.role === "DOCTOR" && <DoctorSection userId={user.id} />}
          {user?.role === "ADMIN" && <AdminSection />}
          <SecurityCard />
        </div>
      </div>
    </div>
  );
}

// ==================== AVATAR CARD ====================
function AvatarCard({ user }: { user: any }) {
  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "U";

  const roleColors: Record<string, string> = {
    ADMIN: "bg-purple-100 text-purple-700",
    DOCTOR: "bg-blue-100 text-blue-700",
    PATIENT: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6 flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-white font-medium text-2xl mb-4">
        {initials}
      </div>
      <h2 className="text-base font-semibold text-slate-900">
        {user?.firstName} {user?.lastName}
      </h2>
      <p className="text-slate-400 text-sm mt-0.5">@{user?.username}</p>
      <span
        className={`inline-block mt-3 text-xs font-medium px-3 py-1 rounded-full ${roleColors[user?.role] || "bg-slate-100 text-slate-600"}`}
      >
        {user?.role}
      </span>
    </div>
  );
}

// ==================== ACCOUNT DETAILS CARD ====================
function AccountDetailsCard({ user }: { user: any }) {
  const [address, setAddress] = useState("");

  const { data: patientData } = useQuery({
    queryKey: ["patient-contact", user?.id],
    queryFn: async () => {
      const res = await api.get(`/api/patients/${user.id}`);
      return res.data.data;
    },
    enabled: user?.role === "PATIENT",
  });

  useEffect(() => {
    if (patientData?.address) {
      setAddress(patientData.address);
    }
  }, [patientData]);

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide mb-4">
        Contact
      </h3>
      <div className="flex flex-col gap-3">
        <InfoRow icon="ti-mail" label="Email" value={user?.email} />
        <InfoRow icon="ti-phone" label="Phone" value={user?.phone || "—"} />
        {user?.role === "PATIENT" && (
          <InfoRow icon="ti-map-pin" label="Address" value={address || "—"} />
        )}
      </div>
    </div>
  );
}

// ==================== PATIENT SECTION ====================
function PatientSection({ userId }: { userId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["patient-profile", userId],
    queryFn: async () => {
      const res = await api.get(`/api/patients/${userId}`);
      return res.data.data;
    },
  });

  const bloodTypeLabels: Record<string, string> = {
    A_POSITIVE: "A+",
    A_NEGATIVE: "A-",
    B_POSITIVE: "B+",
    B_NEGATIVE: "B-",
    AB_POSITIVE: "AB+",
    AB_NEGATIVE: "AB-",
    O_POSITIVE: "O+",
    O_NEGATIVE: "O-",
  };

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
          <i
            className="ti ti-clipboard-list text-blue-500 text-base"
            aria-hidden="true"
          />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
          Medical Profile
        </h3>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
              <div className="h-5 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <InfoBlock label="CNP" value={data?.cnp} />
          <InfoBlock label="Date of Birth" value={data?.dateOfBirth} />
          <InfoBlock
            label="Blood Type"
            value={data?.bloodType ? bloodTypeLabels[data.bloodType] : "—"}
          />
          <InfoBlock
            label="Insurance"
            value={data?.insuranceProviderName || "—"}
          />
        </div>
      )}
    </div>
  );
}

// ==================== DOCTOR SECTION ====================
function DoctorSection({ userId }: { userId: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["doctor-profile", userId],
    queryFn: async () => {
      const res = await api.get(`/api/doctors/${userId}`);
      return res.data.data;
    },
  });

  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
          <i
            className="ti ti-stethoscope text-blue-500 text-base"
            aria-hidden="true"
          />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
          Medical Profile
        </h3>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-3 bg-slate-100 rounded w-1/2 mb-2" />
              <div className="h-5 bg-slate-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4">
          <InfoBlock
            label="Specialization"
            value={data?.specialization || "—"}
          />
          <InfoBlock
            label="License Number"
            value={data?.licenseNumber || "—"}
          />
          <InfoBlock label="Department" value={data?.departmentName || "—"} />
        </div>
      )}
    </div>
  );
}

// ==================== ADMIN SECTION ====================
function AdminSection() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
          <i
            className="ti ti-shield text-purple-500 text-base"
            aria-hidden="true"
          />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
          Admin Access
        </h3>
      </div>
      <p className="text-sm text-slate-400">
        You have full administrative access to MediCare+.
      </p>
      <div className="grid grid-cols-2 gap-3 mt-4">
        {[
          { icon: "ti-users", label: "Manage Users" },
          { icon: "ti-building-hospital", label: "Manage Departments" },
          { icon: "ti-calendar", label: "All Appointments" },
          { icon: "ti-file-text", label: "Audit Logs" },
        ].map((item) => (
          <div
            key={item.label}
            className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2.5"
          >
            <i
              className={`ti ${item.icon} text-slate-400 text-sm`}
              aria-hidden="true"
            />
            <span className="text-sm text-slate-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== SECURITY CARD ====================
function SecurityCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
          <i
            className="ti ti-lock text-slate-500 text-base"
            aria-hidden="true"
          />
        </div>
        <h3 className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
          Security
        </h3>
      </div>
      <div className="flex items-center justify-between py-3 border-b border-slate-50">
        <div>
          <p className="text-sm font-medium text-slate-800">Password</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Last changed - unknown
          </p>
        </div>
        <button className="text-xs text-blue-500 hover:underline">
          Change
        </button>
      </div>
      <div className="flex items-center justify-between py-3">
        <div>
          <p className="text-sm font-medium text-slate-800">Active sessions</p>
          <p className="text-xs text-slate-400 mt-0.5">Current session only</p>
        </div>
        <span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full font-medium">
          Active
        </span>
      </div>
    </div>
  );
}

// ==================== REUSABLE COMPONENTS ====================
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-0.5">
        <i className={`ti ${icon} text-slate-300 text-xs`} aria-hidden="true" />
        <span className="text-xs text-slate-400">{label}</span>
      </div>
      <p className="text-sm font-medium text-slate-800 pl-4">{value || "—"}</p>
    </div>
  );
}

function InfoBlock({
  label,
  value,
  wide = false,
}: {
  label: string;
  value: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "col-span-2" : ""}>
      <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">
        {label}
      </p>
      <p className="text-sm font-medium text-slate-800">{value || "—"}</p>
    </div>
  );
}
