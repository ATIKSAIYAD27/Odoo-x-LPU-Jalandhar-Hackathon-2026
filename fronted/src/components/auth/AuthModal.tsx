import React, { useState } from 'react';
import { inventoryStore } from '../../services/inventoryStore';
import { toastService } from '../../services/toastService';
import { User, UserRole } from '../../types/inventory';
import {
  Lock,
  Mail,
  User as UserIcon,
  Shield,
  Truck,
  ArrowRight,
  KeyRound,
  CheckCircle2,
  X,
  Building
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: User) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('manager');
  const [warehouseId, setWarehouseId] = useState('wh-1');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const warehouses = inventoryStore.getWarehouses();

  if (!isOpen) return null;

  const handleDemoLogin = (targetRole: UserRole) => {
    const demoEmail = targetRole === 'manager' ? 'manager@stocksense.io' : 'staff@stocksense.io';
    setEmail(demoEmail);
    setPassword('demo-access-2026');
    const res = inventoryStore.login(demoEmail, 'demo-access-2026');
    if (res.success && res.user) {
      toastService.success(
        `Welcome Back, ${res.user.name}`,
        `Signed in as ${res.user.role === 'manager' ? 'Inventory Manager' : 'Warehouse Staff'}`
      );
      onAuthSuccess(res.user);
      onClose();
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      const res = inventoryStore.login(email, password);
      if (res.success && res.user) {
        toastService.success(`Welcome, ${res.user.name}`, 'Session established.');
        onAuthSuccess(res.user);
        onClose();
      } else {
        toastService.alert('Login Failed', res.error || 'Check your credentials.');
      }
    }, 250);
  };

  const handleSignupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toastService.alert('Missing Details', 'Please provide both full name and email.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const res = inventoryStore.signup({
        name,
        email,
        role,
        warehouseId
      });

      if (res.success && res.user) {
        toastService.success(`Account Created`, `Registered as ${res.user.role.toUpperCase()}`);
        onAuthSuccess(res.user);
        onClose();
      } else {
        toastService.alert('Registration Error', res.error || 'Failed to create account.');
      }
    }, 250);
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toastService.alert('Required Field', 'Enter your account email to receive an OTP code.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const res = inventoryStore.requestPasswordResetOTP(email);
      if (res.success && res.otp) {
        setGeneratedOtp(res.otp);
        toastService.info('Verification Code Sent', `Security OTP: ${res.otp}`);
      }
    }, 200);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const res = inventoryStore.verifyOTPAndReset(email, otpCode);
      if (res.success) {
        toastService.success('Code Verified', 'Password reset! Sign in with your email.');
        setMode('login');
      } else {
        toastService.alert('Verification Failed', res.message);
      }
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden p-6 card-3d">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 p-1 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-600/30 mb-3">
            <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center">
              <Lock className="w-6 h-6 text-indigo-400" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-slate-900 tracking-tight">
            {mode === 'login' && 'Sign In to StockSense'}
            {mode === 'signup' && 'Create StockSense Account'}
            {mode === 'forgot' && 'Reset Password & OTP'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'login' && 'Select your role or enter credentials to access your dashboard'}
            {mode === 'signup' && 'Provision a new Inventory Manager or Warehouse Staff account'}
            {mode === 'forgot' && 'Enter your verified email address to receive a 6-digit OTP code'}
          </p>
        </div>

        {/* Quick Demo Access Bar */}
        {mode === 'login' && (
          <div className="mb-6 p-3 rounded-xl bg-white/80 border border-slate-200">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 text-center">
              Instant 1-Click Role Login
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('manager')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-semibold transition-all group"
              >
                <Shield className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span>Manager Demo</span>
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('staff')}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-600 text-xs font-semibold transition-all group"
              >
                <Truck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>Staff Demo</span>
              </button>
            </div>
          </div>
        )}

        {/* Mode Tab Switcher */}
        <div className="flex rounded-lg bg-slate-50 p-1 mb-5 border border-slate-200">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === 'login' ? 'bg-indigo-600 text-slate-800 font-semibold shadow' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === 'signup' ? 'bg-indigo-600 text-slate-800 font-semibold shadow' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            New User
          </button>
          <button
            onClick={() => setMode('forgot')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${
              mode === 'forgot' ? 'bg-indigo-600 text-slate-800 font-semibold shadow' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            OTP Reset
          </button>
        </div>

        {/* LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="manager@stocksense.io"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-slate-600">Password</label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[11px] text-indigo-600 hover:text-indigo-700"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-slate-800 rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all mt-2"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* SIGNUP FORM */}
        {mode === 'signup' && (
          <form onSubmit={handleSignupSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jordan Miller"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Work Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jordan@company.com"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">System Role</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('manager')}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    role === 'manager'
                      ? 'border-indigo-500 bg-indigo-100 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-indigo-600">
                    <Shield className="w-3.5 h-3.5" />
                    Manager
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Full ERP & catalog control</div>
                </button>

                <button
                  type="button"
                  onClick={() => setRole('staff')}
                  className={`p-2 rounded-lg border text-left transition-all ${
                    role === 'staff'
                      ? 'border-amber-500 bg-amber-100 text-slate-900'
                      : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-amber-600">
                    <Truck className="w-3.5 h-3.5" />
                    Staff
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Floor operations & moves</div>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Assigned Warehouse</label>
              <div className="relative">
                <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <select
                  value={warehouseId}
                  onChange={(e) => setWarehouseId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.location})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-slate-800 rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all mt-2"
            >
              {loading ? 'Registering...' : 'Complete Registration'}
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* FORGOT PASSWORD / OTP FORM */}
        {mode === 'forgot' && (
          <div className="space-y-4">
            {!generatedOtp ? (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Registered Account Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. manager@stocksense.io"
                      required
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-slate-800 rounded-lg text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
                >
                  {loading ? 'Generating OTP...' : 'Send Verification OTP'}
                  <KeyRound className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="p-3 rounded-xl bg-indigo-100 border border-indigo-200 text-center">
                  <div className="text-[11px] text-indigo-600">Simulated SMS/Email OTP Dispatched:</div>
                  <div className="text-xl font-mono font-bold text-slate-900 tracking-widest mt-1">
                    {generatedOtp}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">Valid for 10 minutes</div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Enter 6-Digit OTP</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="Enter received code"
                    required
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-center font-mono text-base tracking-widest text-slate-800 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-slate-800 rounded-lg text-xs font-semibold shadow-lg shadow-emerald-600/25 transition-all"
                >
                  {loading ? 'Verifying...' : 'Verify OTP & Reset'}
                  <CheckCircle2 className="w-4 h-4" />
                </button>
              </form>
            )}

            <button
              onClick={() => {
                setGeneratedOtp(null);
                setMode('login');
              }}
              className="w-full text-center text-xs text-slate-500 hover:text-slate-800"
            >
              Back to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
