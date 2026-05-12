import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/useAuth';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import PatientsPage from './pages/admin/PatientsPage';
import DoctorDashboardPage from './pages/doctor/DoctorDashboardPage';
import RegisterPage from './pages/auth/RegisterPage';
import PatientDashboardPage from './pages/patient/PatientDashboardPage';
import CompleteProfilePage from './pages/auth/CompleteProfilePage';
import ServerErrorPage from './pages/error/ServerErrorPage';
import NotFoundPage from './pages/error/NotFoundPage';
import UnauthorizedPage from './pages/error/UnauthorizedPage';

function ProtectedRoute({ children, roles }: {
  children: React.ReactNode;
  roles?: string[]
}) {
  const { user, loading, isAuthenticated, hasProfile } = useAuth();
  const location = useLocation();

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Dacă e PATIENT și hasProfile nu e încă determinat - asteapta
  if (user?.role === 'PATIENT' && hasProfile === null) return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  );

  if (user?.role === 'PATIENT' &&
      hasProfile === false &&
      location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
      } />
      <Route path="/register" element={
        isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
      } />
      <Route path="/complete-profile" element={
        isAuthenticated ? <CompleteProfilePage /> : <Navigate to="/login" replace />
      } />
      <Route path="/500" element={<ServerErrorPage />} />
      <Route path="/unauthorized" element={<UnauthorizedPage />} />
      <Route path="*" element={<NotFoundPage />} />

      {/* Un singur Layout pentru toate rutele protejate */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Admin routes */}
        <Route path="dashboard" element={
          <ProtectedRoute roles={['ADMIN']}>
            <DashboardPage />
          </ProtectedRoute>
        } />
        <Route path="patients" element={
          <ProtectedRoute roles={['ADMIN', 'DOCTOR']}>
            <PatientsPage />
          </ProtectedRoute>
        } />

        {/* Doctor routes */}
        <Route path="doctor/dashboard" element={
          <ProtectedRoute roles={['DOCTOR']}>
            <DoctorDashboardPage />
          </ProtectedRoute>
        } />

        {/* Patient routes */}
        <Route path="patient/dashboard" element={
          <ProtectedRoute roles={['PATIENT']}>
            <PatientDashboardPage />
          </ProtectedRoute>
        } />

      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}