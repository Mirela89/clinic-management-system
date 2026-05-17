import { useAuth } from "../../context/useAuth";

export default function DashboardPage() {
  const { user } = useAuth();

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">
          Good morning, {user?.firstName}
        </h1>
        <p className="text-gray-400 text-sm mt-1">{today}</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon="ti-users"
          label="Total Patients"
          value="—"
          trend="+12 this week"
          trendColor="text-emerald-500"
          iconBg="bg-blue-50"
          iconColor="text-blue-500"
        />
        <StatCard
          icon="ti-calendar-check"
          label="Today's Appointments"
          value="—"
          trend="Scheduled"
          trendColor="text-blue-500"
          iconBg="bg-emerald-50"
          iconColor="text-emerald-500"
        />
        <StatCard
          icon="ti-stethoscope"
          label="Active Doctors"
          value="—"
          trend="On duty"
          trendColor="text-orange-500"
          iconBg="bg-orange-50"
          iconColor="text-orange-500"
        />
        <StatCard
          icon="ti-building-hospital"
          label="Departments"
          value="—"
          trend="Total"
          trendColor="text-purple-500"
          iconBg="bg-purple-50"
          iconColor="text-purple-500"
        />
      </div>

      {/* Recent activity placeholder */}
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-medium text-gray-700 mb-4">
          Recent appointments
        </h2>
        <p className="text-sm text-gray-400 text-center py-8">
          No data yet — connect the API to display recent appointments.
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  trend,
  trendColor,
  iconBg,
  iconColor,
}: {
  icon: string;
  label: string;
  value: string;
  trend: string;
  trendColor: string;
  iconBg: string;
  iconColor: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <div className={`${iconBg} p-2.5 rounded-lg`}>
          <i className={`ti ${icon} ${iconColor} text-xl`} aria-hidden="true" />
        </div>
      </div>
      <p className="text-2xl font-semibold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
        {label}
      </p>
      <p className={`text-xs ${trendColor}`}>{trend}</p>
    </div>
  );
}
