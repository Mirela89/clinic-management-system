import { useAuth } from "../../context/useAuth";
import { Calendar, Users, FileText, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function DoctorDashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, Dr. {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-gray-500 mt-1">Here's your overview for today.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={<Calendar className="h-6 w-6" />}
          label="Today's Appointments"
          value="—"
          color="blue"
          link="/doctor/appointments"
        />
        <StatCard
          icon={<Users className="h-6 w-6" />}
          label="My Patients"
          value="—"
          color="green"
          link="/doctor/patients"
        />
        <StatCard
          icon={<FileText className="h-6 w-6" />}
          label="Consultations"
          value="—"
          color="purple"
          link="/doctor/consultations"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Link
            to="/doctor/appointments"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-center"
          >
            <Calendar className="h-6 w-6 text-blue-600" />
            <span className="text-sm font-medium text-gray-700">
              My Schedule
            </span>
          </Link>
          <Link
            to="/doctor/consultations/new"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-colors text-center"
          >
            <FileText className="h-6 w-6 text-green-600" />
            <span className="text-sm font-medium text-gray-700">
              New Consultation
            </span>
          </Link>
          <Link
            to="/doctor/patients"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-colors text-center"
          >
            <Users className="h-6 w-6 text-purple-600" />
            <span className="text-sm font-medium text-gray-700">
              My Patients
            </span>
          </Link>
          <Link
            to="/doctor/schedule"
            className="flex flex-col items-center gap-2 p-4 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-colors text-center"
          >
            <Clock className="h-6 w-6 text-orange-600" />
            <span className="text-sm font-medium text-gray-700">
              My Schedule
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  link,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: "blue" | "green" | "purple";
  link: string;
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <Link
      to={link}
      className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-blue-200 transition-colors"
    >
      <div className={`inline-flex p-2 rounded-lg ${colors[color]} mb-4`}>
        {icon}
      </div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </Link>
  );
}
