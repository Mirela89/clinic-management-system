import { useAuth } from '../../context/useAuth';
import { Calendar, FileText, Pill } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PatientDashboardPage() {
  const { user } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, {user?.firstName} {user?.lastName}!
        </h1>
        <p className="text-gray-500 mt-1">Manage your health appointments and records.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <Link to="/patient/appointments"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-blue-200 transition-colors">
          <div className="bg-blue-50 text-blue-600 inline-flex p-2 rounded-lg mb-4">
            <Calendar className="h-6 w-6" />
          </div>
          <div className="text-lg font-semibold text-gray-800">My Appointments</div>
          <div className="text-sm text-gray-500 mt-1">View and manage your appointments</div>
        </Link>

        <Link to="/patient/consultations"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-green-200 transition-colors">
          <div className="bg-green-50 text-green-600 inline-flex p-2 rounded-lg mb-4">
            <FileText className="h-6 w-6" />
          </div>
          <div className="text-lg font-semibold text-gray-800">My Consultations</div>
          <div className="text-sm text-gray-500 mt-1">View your medical history</div>
        </Link>

        <Link to="/patient/prescriptions"
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-purple-200 transition-colors">
          <div className="bg-purple-50 text-purple-600 inline-flex p-2 rounded-lg mb-4">
            <Pill className="h-6 w-6" />
          </div>
          <div className="text-lg font-semibold text-gray-800">My Prescriptions</div>
          <div className="text-sm text-gray-500 mt-1">View your active prescriptions</div>
        </Link>
      </div>
    </div>
  );
}