import React, { useState, useEffect, useRef } from 'react';
import { inventoryStore } from '../../services/inventoryStore';
import { toastService } from '../../services/toastService';
import { User, UserRole, Warehouse } from '../../types/inventory';
import {
  Lock, Mail, User as UserIcon, Shield, Truck, ArrowRight,
  KeyRound, CheckCircle2, X, Building2, Brain, Sparkles,
  Orbit, Cpu, Zap, Eye, EyeOff, Fingerprint, Wifi, Activity,
  LockKeyhole, Globe, Clock, TrendingUp, ArrowUpRight, Bot
} from 'lucide-react';

interface LoginPageProps {
  onAuthSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onAuthSuccess }) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('manager');
  const [warehouseId, setWarehouseId] = useState('wh-1');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const mousePosRef = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const warehouses = inventoryStore.getWarehouses();

  // Mouse tracking for parallax (ref avoids restarting the particle loop)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mousePosRef.current = {
        x: (e.clientX / window.innerWidth - 0.5) * 2,
        y: (e.clientY / window.innerHeight - 0.5) * 2
      };
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Particle animation with mouse interaction
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: { x: number; y: number; vx: number; vy: number; r: number; color: string; opacity: number; pulse: number }[] = [];
    const colors = ['#6366f1', '#38bdf8', '#10b981', '#f59e0b', '#ec4899', '#a855f7'];

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: Math.random() * 2.5 + 0.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        opacity: Math.random() * 0.6 + 0.1,
        pulse: Math.random() * Math.PI * 2
      });
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Mouse repulsion
      const mx = mousePosRef.current.x * canvas.width * 0.3;
      const my = mousePosRef.current.y * canvas.height * 0.3;

      particles.forEach(p => {
        // Mouse interaction
        const dx = p.x - mx;
        const dy = p.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 150;
          p.vx += (dx / dist) * force * 0.02;
          p.vy += (dy / dist) * force * 0.02;
        }

        // Damping
        p.vx *= 0.999;
        p.vy *= 0.999;
        p.x += p.vx;
        p.y += p.vy;

        // Wrap
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        p.pulse += 0.02;

        // Draw connections
        for (let j = 0; j < particles.length; j++) {
          if (j <= particles.indexOf(p)) continue;
          const q = particles[j];
          const ddx = p.x - q.x;
          const ddy = p.y - q.y;
          const ddist = Math.sqrt(ddx * ddx + ddy * ddy);
          if (ddist < 120) {
            const alpha = (1 - ddist / 120) * 0.15;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        // Draw particle
        const glow = Math.sin(p.pulse) * 0.5 + 0.5;
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(0.5, p.r), 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.opacity * (0.8 + glow * 0.2);
        ctx.fill();

        // Glow halo
        ctx.beginPath();
        ctx.arc(p.x, p.y, Math.max(1, p.r * 3), 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(1, p.r * 3));
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.08;
        ctx.fill();
      });

      ctx.globalAlpha = 1;
      rafId = requestAnimationFrame(animate);
    };

    let rafId = requestAnimationFrame(animate);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  const handleDemoLogin = (targetRole: UserRole) => {
    const demoEmail =
      targetRole === 'admin' ? 'admin@stocksense.io' :
      targetRole === 'manager' ? 'manager@stocksense.io' : 'staff@stocksense.io';
    setEmail(demoEmail);
    setPassword('demo-access-2026');
    setLoading(true);
    setTimeout(() => {
      const res = inventoryStore.login(demoEmail, 'demo-access-2026');
      if (res.success && res.user) {
        toastService.success(`Welcome ${res.user.name}`, `Signed in as ${res.user.role === 'admin' ? 'Platform Administrator' : res.user.role === 'manager' ? 'Inventory Manager' : 'Warehouse Staff'}`);
        onAuthSuccess(res.user);
      } else if (res.error) {
        toastService.alert('Login Failed', res.error);
      }
      setLoading(false);
    }, 800);
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
      } else {
        toastService.alert('Login Failed', res.error || 'Check your credentials.');
      }
    }, 800);
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
      const res = inventoryStore.signup({ name, email, role, warehouseId });
      if (res.success && res.user) {
        toastService.success(`Account Created`, `Registered as ${res.user.role.toUpperCase()}`);
        onAuthSuccess(res.user);
      } else {
        toastService.alert('Registration Error', res.error || 'Failed to create account.');
      }
    }, 800);
  };

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toastService.alert('Required Field', 'Enter your account email.');
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
    }, 500);
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
    }, 500);
  };

  const tabs = [
    { label: 'Sign In', icon: Lock },
    { label: 'Create Account', icon: UserIcon },
    { label: 'Reset Password', icon: KeyRound }
  ];

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden" ref={containerRef}>
      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 z-0" />

      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-[1] bg-[#0a0e1a]" />
      <div className="absolute inset-0 z-[1] bg-gradient-to-br from-indigo-950/80 via-slate-900/70 to-slate-950/80" />

      {/* Animated Mesh Orbs */}
      <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
        <div className="login-mesh-orb login-mesh-orb-1" style={{ animationDelay: '0s' }} />
        <div className="login-mesh-orb login-mesh-orb-2" style={{ animationDelay: '-7s', animationDuration: '25s' }} />
        <div className="login-mesh-orb login-mesh-orb-3" style={{ animationDelay: '-14s', animationDuration: '30s' }} />
        <div className="login-mesh-orb login-mesh-orb-4" style={{ animationDelay: '-3s', animationDuration: '22s' }} />
      </div>

      {/* Floating Morphing Shapes */}
      <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
        <div className="login-morph-shape login-float-shape login-badge-float"
             style={{ top: '12%', left: '8%', width: '160px', height: '160px', border: '2px solid rgba(99,102,241,0.15)', background: 'rgba(99,102,241,0.03)' }} />
        <div className="login-morph-shape login-float-shape login-badge-float-2"
             style={{ top: '25%', right: '12%', width: '120px', height: '120px', border: '2px solid rgba(56,189,248,0.12)', background: 'rgba(56,189,248,0.03)', borderRadius: '40% 60% 70% 30%' }} />
        <div className="login-morph-shape login-float-shape login-badge-float-3"
             style={{ bottom: '15%', left: '15%', width: '140px', height: '140px', border: '2px solid rgba(16,185,129,0.1)', background: 'rgba(16,185,129,0.03)', borderRadius: '60% 40% 30% 70%' }} />
        <div className="login-morph-shape login-float-shape"
             style={{ bottom: '25%', right: '8%', width: '100px', height: '100px', border: '2px solid rgba(236,72,153,0.08)', background: 'rgba(236,72,153,0.03)', borderRadius: '50%' }} />
        <div className="login-float-shape"
             style={{ top: '45%', left: '3%', width: '60px', height: '60px', border: '1px solid rgba(245,158,11,0.1)', background: 'rgba(245,158,11,0.02)', borderRadius: '4px', animationDuration: '10s' }} />
        <div className="login-float-shape"
             style={{ top: '8%', right: '30%', width: '80px', height: '80px', border: '1px solid rgba(168,85,247,0.08)', background: 'rgba(168,85,247,0.02)', borderRadius: '30% 70%', animationDuration: '12s' }} />
      </div>

      {/* Animated Grid Background */}
      <div className="absolute inset-0 z-[2] login-grid-bg opacity-30 pointer-events-none" />

      {/* Shimmer accent lines */}
      <div className="absolute top-0 left-0 right-0 h-[1px] z-[3] bg-gradient-to-r from-transparent via-indigo-400/30 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] z-[3] bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent" />

      {/* Main Content */}
      <div className="relative z-[10] w-full flex items-center justify-center p-4 md:p-8 min-h-screen">
        <div className="w-full max-w-lg">
          {/* Logo & Hero Section */}
          <div className="text-center mb-8 login-card-enter" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <div className="relative inline-flex items-center justify-center mb-4">
              <div className="absolute w-24 h-24 rounded-3xl bg-gradient-to-br from-indigo-500/20 via-cyan-400/10 to-emerald-400/10 blur-2xl login-hero-orb" />
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-[2px] shadow-2xl shadow-indigo-600/25 relative login-glow-card">
                <div className="w-full h-full bg-slate-950/80 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  <Brain className="w-10 h-10 text-indigo-300" />
                </div>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-950 flex items-center justify-center data-live-dot">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                </div>
                <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-cyan-400 rounded-full border-2 border-slate-950 flex items-center justify-center">
                  <div className="w-1 h-1 bg-white rounded-full" />
                </div>
              </div>
            </div>
            <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2 stat-animate">
              StockSense
            </h1>
            <p className="text-sm text-slate-400 font-medium mb-1 stat-animate" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
              AI-Powered <span className="login-shimmer-text font-bold">3D Inventory Intelligence</span>
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 stat-animate" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 data-live-dot" />
              System Online · v3.8
            </div>
          </div>

          {/* Auth Card */}
          <div className="login-glass-card login-glow-card rounded-3xl shadow-2xl shadow-indigo-900/20 p-8 relative overflow-hidden login-card-enter" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            {/* Animated gradient accent line */}
            <div className="absolute top-0 left-0 right-0 h-[3px] overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 bg-[length:200%_100%] animate-[shimmer_3s_linear_infinite]" />
            </div>

            {/* Subtle inner glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-transparent via-indigo-400/10 to-transparent blur-xl" />

            {/* Tab Navigation */}
            <div className="flex items-center justify-center gap-1 mb-8 relative">
              <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-200 -translate-y-1/2" />
              {tabs.map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setMode(tab.label === 'Sign In' ? 'login' : tab.label === 'Create Account' ? 'signup' : 'forgot')}
                  className={`relative z-10 flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-full transition-all ${
                    (mode === 'login' && tab.label === 'Sign In') ||
                    (mode === 'signup' && tab.label === 'Create Account') ||
                    (mode === 'forgot' && tab.label === 'Reset Password')
                      ? 'text-white bg-white/10 ring-1 ring-white/10 shadow-lg'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Live Stats Bar */}
            <div className="flex items-center justify-center gap-6 mb-8 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <div className="flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                <span className="text-[11px] text-slate-500 font-medium">99.7% Uptime</span>
              </div>
              <div className="w-px h-3 bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-[11px] text-slate-500 font-medium">Real-time Sync</span>
              </div>
              <div className="w-px h-3 bg-slate-200" />
              <div className="flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-[11px] text-slate-500 font-medium">AI Engine Active</span>
              </div>
            </div>

            {/* ===== LOGIN FORM ===== */}
            {mode === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4 login-fade-in">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    Work Email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="manager@stocksense.io" required
                      className="w-full pl-11 pr-4 py-3 bg-white/70 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all group-hover:border-slate-300"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <LockKeyhole className="w-3.5 h-3.5 text-indigo-500" />
                    Password
                  </label>
                  <div className="relative group">
                    <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input
                      type={showPassword ? 'text' : 'password'} value={password}
                      onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required
                      className="w-full pl-11 pr-12 py-3 bg-white/70 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all group-hover:border-slate-300"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-3 text-slate-400 hover:text-indigo-500 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs text-slate-500 cursor-pointer hover:text-indigo-600 transition-colors">
                    <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
                    Remember me
                  </label>
                  <button type="button" onClick={() => setMode('forgot')}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-500 transition-colors">
                    Forgot password?
                  </button>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 hover:shadow-indigo-600/40 login-shimmer-btn">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Fingerprint className="w-4 h-4" />
                      <span>Authenticate</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200" /></div>
                  <div className="relative flex justify-center text-xs text-slate-400"><span>or try demo</span></div>
                </div>

                {/* Demo Access */}
                <div className="grid grid-cols-3 gap-2">
                  <button type="button" onClick={() => handleDemoLogin('admin')}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 hover:border-purple-300 rounded-xl text-xs font-semibold text-purple-700 transition-all group">
                    <div className="w-9 h-9 rounded-lg bg-purple-100 group-hover:bg-purple-200 flex items-center justify-center transition-colors">
                      <Shield className="w-4.5 h-4.5 text-purple-500" />
                    </div>
                    <div className="text-center leading-tight">
                      <div className="text-purple-900">Admin Demo</div>
                      <div className="text-[9px] text-purple-500 font-normal">Users & Access</div>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleDemoLogin('manager')}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 hover:border-indigo-300 rounded-xl text-xs font-semibold text-indigo-700 transition-all group">
                    <div className="w-9 h-9 rounded-lg bg-indigo-100 group-hover:bg-indigo-200 flex items-center justify-center transition-colors">
                      <Shield className="w-4.5 h-4.5 text-indigo-500" />
                    </div>
                    <div className="text-center leading-tight">
                      <div className="text-indigo-900">Manager Demo</div>
                      <div className="text-[9px] text-indigo-500 font-normal">Full ERP Access</div>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleDemoLogin('staff')}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 hover:border-amber-300 rounded-xl text-xs font-semibold text-amber-700 transition-all group">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 group-hover:bg-amber-200 flex items-center justify-center transition-colors">
                      <Truck className="w-4.5 h-4.5 text-amber-500" />
                    </div>
                    <div className="text-center leading-tight">
                      <div className="text-amber-900">Staff Demo</div>
                      <div className="text-[9px] text-amber-500 font-normal">Floor Operations</div>
                    </div>
                  </button>
                </div>
              </form>
            )}

            {/* ===== SIGNUP FORM ===== */}
            {mode === 'signup' && (
              <form onSubmit={handleSignupSubmit} className="space-y-4 login-fade-in">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-indigo-500" />
                    Full Name
                  </label>
                  <div className="relative group">
                    <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Johnson" required
                      className="w-full pl-11 pr-4 py-3 bg-white/70 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all group-hover:border-slate-300" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-500" />
                    Work Email
                  </label>
                  <div className="relative group">
                    <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@company.com" required
                      className="w-full pl-11 pr-4 py-3 bg-white/70 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all group-hover:border-slate-300" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Role</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button type="button" onClick={() => setRole('manager')}
                        className={`py-2 rounded-lg border text-xs font-semibold transition-all ${role === 'manager' ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                        <Shield className="w-3 h-3 inline mr-1" /> Manager
                      </button>
                      <button type="button" onClick={() => setRole('staff')}
                        className={`py-2 rounded-lg border text-xs font-semibold transition-all ${role === 'staff' ? 'border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-200' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                        <Truck className="w-3 h-3 inline mr-1" /> Staff
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Warehouse</label>
                    <select value={warehouseId} onChange={(e) => setWarehouseId(e.target.value)}
                      className="w-full px-3 py-3 bg-white/70 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:border-indigo-400">
                      {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-600/25 transition-all disabled:opacity-50 login-shimmer-btn">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Create Account</span>
                      <ArrowUpRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* ===== FORGOT PASSWORD ===== */}
            {mode === 'forgot' && (
              <form onSubmit={generatedOtp ? handleVerifyOtp : handleRequestOtp} className="space-y-4 login-fade-in">
                {!generatedOtp ? (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-indigo-500" />
                        Registered Email
                      </label>
                      <div className="relative group">
                        <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                          placeholder="manager@stocksense.io" required
                          className="w-full pl-11 pr-4 py-3 bg-white/70 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all group-hover:border-slate-300" />
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 text-xs text-indigo-700 flex items-start gap-2">
                      <KeyRound className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                      <span>Enter your work email to receive a 6-digit verification code for password reset.</span>
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 login-shimmer-btn">
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <KeyRound className="w-4 h-4" />
                          <span>Send Verification Code</span>
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                      <div className="text-[11px] text-emerald-700 mb-1">Verification Code Sent!</div>
                      <div className="text-lg font-mono font-bold text-emerald-900 tracking-widest">{generatedOtp}</div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">Enter 6-Digit Code</label>
                      <input type="text" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="000000" required
                        className="w-full px-4 py-3 bg-white/70 border border-slate-200 rounded-xl text-center font-mono text-lg tracking-widest text-slate-800 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 login-shimmer-btn">
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Verify & Reset</span>
                        </>
                      )}
                    </button>
                  </>
                )}
              </form>
            )}

            {/* AI Features Footer */}
            <div className="mt-6 pt-4 border-t border-slate-100/80">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Cpu, label: 'AI Analytics', cls: 'bg-indigo-50 border-indigo-100 text-indigo-500' },
                  { icon: Sparkles, label: 'Smart Routing', cls: 'bg-cyan-50 border-cyan-100 text-cyan-500' },
                  { icon: Zap, label: 'Real-time Sync', cls: 'bg-emerald-50 border-emerald-100 text-emerald-500' }
                ].map((feature, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-default">
                    <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${feature.cls}`}>
                      <feature.icon className="w-4 h-4" />
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-6 login-card-enter" style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/70 border border-slate-200 text-[11px] text-slate-500 backdrop-blur-sm">
              <Wifi className="w-3 h-3 text-emerald-500" />
              <span>Secure Connection · 256-bit SSL</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              StockSense v3.8 · AI Inventory Intelligence Platform · © 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
