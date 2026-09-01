import { useState } from 'react';
import { Handshake, User, HardHat, ArrowRight, Sparkles, Scale, TrendingUp, MapPin, ShieldCheck, Lock, Mail, X, Loader2, Phone } from 'lucide-react';
import type { Role } from '@/types';
import { authApi } from '@/lib/api';
import { saveSession } from '@/lib/auth';

export function RoleSelect({ onSelect, onAdminLogin }: { onSelect: (role: Role) => void; onAdminLogin: (user?: any) => void }) {
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const roles: { id: Role; title: string; desc: string; icon: typeof User; accent: string }[] = [
    {
      id: 'customer',
      title: 'Customer',
      desc: 'Find and book service professionals.',
      icon: User,
      accent: 'from-primary-500 to-primary-700',
    },
    {
      id: 'worker',
      title: 'Cooperative Worker',
      desc: 'Manage jobs, availability and earnings.',
      icon: HardHat,
      accent: 'from-secondary-500 to-secondary-700',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50/40 via-white to-white">
      {/* Top nav */}
      <header className="border-b border-ink-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-600 text-white shadow-sm">
              <Handshake className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-lg font-bold leading-none text-ink-900">SahkaarServe</p>
              <p className="text-[11px] font-medium text-ink-500">Cooperative Service Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden chip bg-primary-50 text-primary-700 ring-1 ring-primary-200 sm:inline-flex">
              <Sparkles className="h-3.5 w-3.5" /> SIH 2026 Prototype
            </span>
            <button
              onClick={() => setShowAdminLogin(true)}
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-ink-500 transition hover:bg-ink-100 hover:text-ink-700"
            >
              <Lock className="h-3.5 w-3.5" /> Cooperative Login
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:py-16">
        {/* Hero */}
        <div className="mx-auto max-w-2xl text-center animate-fade-in">
          <span className="chip bg-primary-50 text-primary-700 ring-1 ring-primary-200">
            <Scale className="h-3.5 w-3.5" /> Fair-job allocation · Cooperative-first
          </span>
          <h1 className="mt-4 font-display text-3xl font-extrabold leading-tight text-ink-900 sm:text-4xl">
            Empowering Cooperative Workers.<br className="hidden sm:block" /> Simplifying Community Services.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base text-ink-600">
            SahkaarServe is a cooperative-owned digital service ecosystem — not another marketplace. AI-powered service understanding, fair-job allocation, demand forecasting and worker welfare, built around cooperative economics.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 text-xs">
            <span className="chip bg-white text-ink-600 ring-1 ring-ink-200"><TrendingUp className="h-3.5 w-3.5 text-primary-600" /> Demand Forecasting</span>
            <span className="chip bg-white text-ink-600 ring-1 ring-ink-200"><MapPin className="h-3.5 w-3.5 text-secondary-600" /> Community Heatmaps</span>
            <span className="chip bg-white text-ink-600 ring-1 ring-ink-200"><Scale className="h-3.5 w-3.5 text-teal-600" /> Fair Allocation Engine</span>
            <span className="chip bg-white text-ink-600 ring-1 ring-ink-200"><ShieldCheck className="h-3.5 w-3.5 text-primary-600" /> Verified Workers</span>
          </div>
        </div>

        {/* Role cards */}
        <p className="mt-12 mb-5 text-center text-sm font-semibold text-ink-700">Choose a demo role to continue</p>
        <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
          {roles.map((r, i) => (
            <button
              key={r.id}
              onClick={() => onSelect(r.id)}
              className="group card-md relative overflow-hidden p-6 text-left transition-all duration-300 hover:-translate-y-1 hover:shadow-card-lg animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${r.accent} text-white shadow-sm`}>
                <r.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold text-ink-900">{r.title}</h3>
              <p className="mt-1 text-sm text-ink-600">{r.desc}</p>
              <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-primary-600 transition group-hover:gap-2.5">
                Continue as {r.title} <ArrowRight className="h-4 w-4" />
              </div>
            </button>
          ))}
        </div>

        <p className="mt-10 text-center text-xs text-ink-400">
          Hackathon demonstration prototype · Simulated workflows & mock data · No real payments or external APIs
        </p>
      </main>

      {showAdminLogin && <AdminLoginModal onClose={() => setShowAdminLogin(false)} onSuccess={onAdminLogin} />}
    </div>
  );
}

function AdminLoginModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: (user?: any) => void }) {
  const [loginId, setLoginId] = useState('9000000000');
  const [password, setPassword] = useState('admin2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!loginId.trim() || !password.trim()) {
      setError('Please enter both credentials.');
      return;
    }
    setLoading(true);
    try {
      const data = await authApi.login({
        [loginId.includes('@') ? 'email' : 'phone']: loginId.trim(),
        password,
        role: 'admin',
      });
      saveSession(data.token, data.user);
      onSuccess(data.user);
    } catch (err: any) {
      setError(err.message || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md animate-scale-in">
        <div className="card-md overflow-hidden">
          <div className="flex items-center justify-between bg-gradient-to-r from-teal-700 to-teal-600 px-5 py-4 text-white">
            <div className="flex items-center gap-2.5">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/20"><ShieldCheck className="h-5 w-5" /></div>
              <div>
                <p className="font-display text-sm font-bold">Cooperative Administrator Login</p>
                <p className="text-xs text-teal-100">Restricted access · Staff only</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1 text-white/80 transition hover:bg-white/20"><X className="h-5 w-5" /></button>
          </div>
          <form onSubmit={handleLogin} className="space-y-4 p-5">
            <div>
              <label className="text-sm font-semibold text-ink-700">Phone or Email</label>
              <div className="relative mt-1.5">
                {loginId.includes('@') ? <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /> : <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />}
                <input
                  value={loginId}
                  onChange={(e) => { setLoginId(e.target.value); setError(''); }}
                  className="input-field pl-9"
                  placeholder="9000000000 or admin@sahkaar.coop"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-ink-700">Password</label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="input-field pl-9"
                  placeholder="••••••••"
                />
              </div>
            </div>
            {error && <p className="text-xs font-medium text-danger">{error}</p>}
            <div className="rounded-xl bg-ink-50 p-3 text-xs text-ink-500">
              Demo — phone: <strong>9000000000</strong> / password: <strong>admin2026</strong>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full bg-teal-600 hover:bg-teal-700">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Authenticating…</> : <><ShieldCheck className="h-4 w-4" /> Login as Administrator</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
