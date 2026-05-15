import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import api from '../../api/axios';

export default function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    if (!user || !loggedIn) return;
    if (user.role === 'ADMIN') navigate('/dashboard');
    else if (user.role === 'DOCTOR') navigate('/doctor/dashboard');
    else navigate('/patient/dashboard');
  }, [user, loggedIn]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password, rememberMe);
      setLoggedIn(true);
    } catch {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-[44%] bg-slate-900 flex-col p-10 relative overflow-hidden flex-shrink-0">

        {/* Decorative circles */}
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-blue-500/10" />
        <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full border border-blue-500/10" />
        <div className="absolute bottom-16 -left-10 w-48 h-48 rounded-full border border-indigo-500/10" />

        {/* Logo */}
        <div className="flex items-center gap-3 mb-auto">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="ti ti-heart-rate-monitor text-white text-xl" aria-hidden="true" />
          </div>
          <span className="text-white font-medium text-base tracking-tight">MediCare+</span>
        </div>

        {/* Main message */}
        <div className="mb-auto pt-16">
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">
            Clinic management
          </p>
          <h1 className="text-white text-3xl font-medium leading-snug tracking-tight mb-5">
            Healthier starts<br />
            with a good<br />
            doctor visit.
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
            Book an appointment at MediCare+ in minutes. Choose your specialist, pick your slot, and leave the rest to us.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-8 pt-8 border-t border-white/5">
          <div>
            <p className="text-white text-xl font-medium tracking-tight">248</p>
            <p className="text-slate-500 text-xs mt-0.5">Patients</p>
          </div>
          <div>
            <p className="text-white text-xl font-medium tracking-tight">18</p>
            <p className="text-slate-500 text-xs mt-0.5">Doctors</p>
          </div>
          <div>
            <p className="text-white text-xl font-medium tracking-tight">6</p>
            <p className="text-slate-500 text-xs mt-0.5">Departments</p>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">

          {/* Greeting */}
          <div className="mb-8">
            <h2 className="text-2xl font-medium text-slate-900 tracking-tight mb-1.5">
              Welcome back
            </h2>
            <p className="text-sm text-slate-400">
              Sign in to your account to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <i className="ti ti-user absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" aria-hidden="true" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-3 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-slate-700">
                  Password
                </label>
                <span className="text-xs text-blue-500 cursor-pointer hover:underline">
                  Forgot password?
                </span>
              </div>
              <div className="relative">
                <i className="ti ti-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-base pointer-events-none" aria-hidden="true" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-10 py-3 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`ti ${showPassword ? 'ti-eye-off' : 'ti-eye'} text-base`} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Remember me */}
            <label className="flex items-center gap-2.5 cursor-pointer" onClick={() => setRememberMe(p => !p)}>
              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                rememberMe ? 'bg-blue-500 border-blue-500' : 'bg-white border-slate-200'
              }`}>
                {rememberMe && (
                  <i className="ti ti-check text-white" style={{ fontSize: '11px' }} aria-hidden="true" />
                )}
              </div>
              <span className="text-sm text-slate-500">Remember me for 7 days</span>
            </label>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-sm rounded-xl px-4 py-3 flex items-center gap-2">
                <i className="ti ti-alert-circle text-base flex-shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl text-sm transition-colors disabled:opacity-50 mt-1"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3 my-1">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400">or</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Register */}
            <p className="text-center text-sm text-slate-400">
              New patient?{' '}
              <Link to="/register" className="text-blue-500 font-medium hover:underline">
                Create an account
              </Link>
            </p>
          </form>

          {/* Footer */}
          <p className="text-center text-xs text-slate-300 mt-10">
            By signing in, you agree to our{' '}
            <span className="text-slate-400 cursor-pointer hover:underline">Terms of Service</span>
            {' '}and{' '}
            <span className="text-slate-400 cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}