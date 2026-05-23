import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/useAuth";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from '../../api/axios';

interface NavItem {
  label: string;
  path: string;
  icon: string;
}

const adminNav: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: "ti-layout-dashboard" },
  { label: "Patients", path: "/patients", icon: "ti-users" },
  { label: "Doctors", path: "/doctors", icon: "ti-stethoscope" },
  { label: "Appointments", path: "/appointments", icon: "ti-calendar" },
  { label: "Consultations", path: "/consultations", icon: "ti-file-text" },
  { label: "Departments", path: "/departments", icon: "ti-building-hospital" },
  { label: "Insurances", path: "/insurances", icon: "ti-shield-check" },
  { label: 'Medications', path: '/medications', icon: 'ti-pill' },
];

const doctorNav: NavItem[] = [
  {
    label: "Dashboard",
    path: "/doctor/dashboard",
    icon: "ti-layout-dashboard",
  },
  { label: "Appointments", path: "/doctor/appointments", icon: "ti-calendar" },
  { label: "My Patients", path: "/doctor/patients", icon: "ti-users" },
  {
    label: "Consultations",
    path: "/doctor/consultations",
    icon: "ti-file-text",
  },
  { label: "Schedule", path: "/doctor/schedule", icon: "ti-clock" },
  { label: 'Notifications', path: '/notifications', icon: 'ti-bell' },
];

const patientNav: NavItem[] = [
  {
    label: "Dashboard",
    path: "/patient/dashboard",
    icon: "ti-layout-dashboard",
  },
  { label: "Appointments", path: "/patient/appointments", icon: "ti-calendar" },
  {
    label: "Book Appointment",
    path: "/patient/book-appointment",
    icon: "ti-calendar-plus",
  },
  {
    label: "Consultations",
    path: "/patient/consultations",
    icon: "ti-file-text",
  },
  { label: "Prescriptions", path: "/patient/prescriptions", icon: "ti-pill" },
  { label: 'Notifications', path: '/notifications', icon: 'ti-bell' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const navItems =
    user?.role === "ADMIN"
      ? adminNav
      : user?.role === "DOCTOR"
        ? doctorNav
        : patientNav;

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "U";

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const res = await api.get(`/api/notifications/user/${user!.id}`);
      return res.data.data as any[];
    },
    enabled: !!user?.id,
    refetchInterval: 30 * 1000,
    staleTime: 0,
  });

  const unreadCount = notifications.filter((n: any) => n.status !== 'READ').length;

  return (
    <aside className="w-56 bg-slate-900 flex flex-col flex-shrink-0 h-screen">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
          <i
            className="ti ti-heart-rate-monitor text-white text-lg"
            aria-hidden="true"
          />
        </div>
        <span className="text-white font-medium text-sm">MediCare+</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          const isNotifications = item.path === '/notifications';
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
              {isNotifications && unreadCount > 0 && (
                <span className="ml-auto bg-blue-500 text-white text-xs font-medium px-1.5 py-0.5 rounded-full">
                  {unreadCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User + Logout */}
      <div className="px-3 py-4 border-t border-slate-800">
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800/50 transition-colors mb-1"
        >
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300 font-medium flex-shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-slate-500 text-xs">{user?.role}</p>
          </div>
        </Link>
        <button
          onClick={() => setShowLogoutModal(true)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800/50 transition-colors w-full"
        >
          <i className="ti ti-logout text-base" aria-hidden="true" />
          Sign out
        </button>
      </div>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-80 shadow-xl">
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center mx-auto mb-4">
              <i
                className="ti ti-logout text-red-400 text-xl"
                aria-hidden="true"
              />
            </div>
            <h3 className="text-base font-semibold text-slate-900 text-center mb-1">
              Sign out
            </h3>
            <p className="text-sm text-slate-400 text-center mb-6">
              Are you sure you want to sign out of your account?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-2.5 rounded-xl text-sm transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
