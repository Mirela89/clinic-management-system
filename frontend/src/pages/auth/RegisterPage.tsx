import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const STEPS_INFO = [
  { icon: 'ti-user-plus', text: 'Create your account' },
  { icon: 'ti-clipboard-list', text: 'Complete your medical profile' },
  { icon: 'ti-calendar-plus', text: 'Book your first appointment' },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validate = () => {
    if (!form.firstName || !form.lastName) {
      setError('First name and last name are required.');
      return false;
    }
    if (form.username.length < 3) {
      setError('Username must be at least 3 characters.');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(form.email)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return false;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!validate()) return;

    setLoading(true);
    try {
      await api.post('/api/auth/register', {
        username: form.username,
        password: form.password,
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        phone: form.phone || null,
      });
      setSuccess('Account created! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* LEFT PANEL — ascuns pe ecrane mici */}
      <div className="hidden lg:flex w-[44%] bg-slate-900 flex-col p-10 relative overflow-hidden flex-shrink-0">
        <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full border border-blue-500/10" />
        <div className="absolute -top-8 -right-8 w-44 h-44 rounded-full border border-blue-500/10" />
        <div className="absolute bottom-16 -left-10 w-48 h-48 rounded-full border border-indigo-500/10" />

        <div className="flex items-center gap-3 mb-auto">
          <div className="w-9 h-9 bg-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
            <i className="ti ti-heart-rate-monitor text-white text-xl" aria-hidden="true" />
          </div>
          <span className="text-white font-medium text-base tracking-tight">MediCare+</span>
        </div>

        <div className="mb-auto pt-16">
          <p className="text-slate-500 text-xs uppercase tracking-widest mb-4">Join MediCare+</p>
          <h1 className="text-white text-3xl font-medium leading-snug tracking-tight mb-5">
            Healthier starts<br />
            with a good<br />
            doctor visit.
          </h1>
          <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
            Create your account and book your first appointment at MediCare+ in minutes.
          </p>
        </div>

        <div className="flex flex-col gap-4 pt-8 border-t border-white/5">
          {STEPS_INFO.map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center flex-shrink-0">
                <i className={`ti ${step.icon} text-blue-400`} style={{ fontSize: '14px' }} aria-hidden="true" />
              </div>
              <span className="text-slate-400 text-sm">{step.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL — responsive */}
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-sm">

          {/* Logo pe mobile — vizibil doar pe ecrane mici */}
          <div className="flex lg:hidden items-center gap-2 justify-center mb-6">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <i className="ti ti-heart-rate-monitor text-white text-base" aria-hidden="true" />
            </div>
            <span className="text-slate-900 font-medium text-sm">MediCare+</span>
          </div>

          <div className="mb-5">
            <h2 className="text-xl sm:text-2xl font-medium text-slate-900 tracking-tight mb-1">
              Create account
            </h2>
            <p className="text-sm text-slate-400">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">

            {/* First + Last name */}
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  First name <span className="text-red-400">*</span>
                </label>
                <input
                  name="firstName"
                  value={form.firstName}
                  onChange={handleChange}
                  placeholder="John"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 sm:py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                  Last name <span className="text-red-400">*</span>
                </label>
                <input
                  name="lastName"
                  value={form.lastName}
                  onChange={handleChange}
                  placeholder="Doe"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 sm:py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Username <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <i className="ti ti-at absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" aria-hidden="true" />
                <input
                  name="username"
                  value={form.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2 sm:py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Email <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <i className="ti ti-mail absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" aria-hidden="true" />
                <input
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2 sm:py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Phone
                <span className="text-slate-400 font-normal ml-1">(optional)</span>
              </label>
              <div className="relative">
                <i className="ti ti-phone absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" aria-hidden="true" />
                <input
                  name="phone"
                  type="tel"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="0712 345 678"
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-4 py-2 sm:py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <i className="ti ti-lock absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" aria-hidden="true" />
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-9 py-2 sm:py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  <i className={`ti ${showPassword ? 'ti-eye-off' : 'ti-eye'} text-sm`} aria-hidden="true" />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1">
                Confirm password <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <i className="ti ti-lock-check absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none" aria-hidden="true" />
                <input
                  name="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="Repeat your password"
                  required
                  className={`w-full bg-white border rounded-xl pl-8 pr-9 py-2 sm:py-2.5 text-sm text-slate-800 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? 'border-red-200 bg-red-50'
                      : form.confirmPassword && form.password === form.confirmPassword
                      ? 'border-emerald-200 bg-emerald-50'
                      : 'border-slate-200'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-500 transition-colors"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  <i className={`ti ${showConfirm ? 'ti-eye-off' : 'ti-eye'} text-sm`} aria-hidden="true" />
                </button>
              </div>
              {form.confirmPassword && form.password !== form.confirmPassword && (
                <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                  <i className="ti ti-alert-circle text-xs" aria-hidden="true" />
                  Passwords do not match
                </p>
              )}
              {form.confirmPassword && form.password === form.confirmPassword && (
                <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                  <i className="ti ti-circle-check text-xs" aria-hidden="true" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-500 text-xs sm:text-sm rounded-xl px-3 py-2.5 flex items-center gap-2">
                <i className="ti ti-alert-circle text-base flex-shrink-0" aria-hidden="true" />
                {error}
              </div>
            )}

            {/* Success */}
            {success && (
              <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 text-xs sm:text-sm rounded-xl px-3 py-2.5 flex items-center gap-2">
                <i className="ti ti-circle-check text-base flex-shrink-0" aria-hidden="true" />
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-xl text-sm transition-colors disabled:opacity-50 mt-1"
            >
              {loading ? 'Creating account...' : 'Create account'}
            </button>

            <p className="text-center text-sm text-slate-400">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-500 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </form>

          <p className="text-center text-xs text-slate-300 mt-4">
            By creating an account, you agree to our{' '}
            <span className="text-slate-400 cursor-pointer hover:underline">Terms of Service</span>
            {' '}and{' '}
            <span className="text-slate-400 cursor-pointer hover:underline">Privacy Policy</span>
          </p>
        </div>
      </div>
    </div>
  );
}