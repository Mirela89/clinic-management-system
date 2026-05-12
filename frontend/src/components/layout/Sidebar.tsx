import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const adminNav: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'ti-layout-dashboard' },
  { label: 'Patients', path: '/patients', icon: 'ti-users' },
  { label: 'Doctors', path: '/doctors', icon: 'ti-stethoscope' },
  { label: 'Appointments', path: '/appointments', icon: 'ti-calendar' },
  { label: 'Consultations', path: '/consultations', icon: 'ti-file-text' },
  { label: 'Departments', path: '/departments', icon: 'ti-building-hospital' },
];

const doctorNav: NavItem[] = [
  { label: 'Dashboard', path: '/doctor/dashboard', icon: 'ti-layout-dashboard' },
  { label: 'Appointments', path: '/doctor/appointments', icon: 'ti-calendar' },
  { label: 'My Patients', path: '/doctor/patients', icon: 'ti-users' },
  { label: 'Consultations', path: '/doctor/consultations', icon: 'ti-file-text' },
  { label: 'Schedule', path: '/doctor/schedule', icon: 'ti-clock' },
];

const patientNav: NavItem[] = [
  { label: 'Dashboard', path: '/patient/dashboard', icon: 'ti-layout-dashboard' },
  { label: 'Appointments', path: '/patient/appointments', icon: 'ti-calendar' },
  { label: 'Consultations', path: '/patient/consultations', icon: 'ti-file-text' },
  { label: 'Prescriptions', path: '/patient/prescriptions', icon: 'ti-pill' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = user?.role === 'ADMIN' ? adminNav
    : user?.role === 'DOCTOR' ? doctorNav
    : patientNav;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : 'U';

  return (
    <aside className="w-56 bg-slate-900 flex flex-col flex-shrink-0 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <i className="ti ti-heart-rate-monitor text-white text-lg" aria-hidden="true" />
        </div>
        <span className="text-white font-medium text-sm">MediCare+</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                isActive
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <i className={`ti ${item.icon} text-base ${isActive ? 'text-blue-400' : ''}`} aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-2 mb-1">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300 font-medium flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-slate-500 text-xs">{user?.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800/50 transition-colors w-full"
        >
          <i className="ti ti-logout text-base" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </aside>
  );
}