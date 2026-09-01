import { useState } from 'react';
import {
  Handshake, User, HardHat, ArrowRight, ArrowLeft, Mail, Phone, Lock, UserCircle,
  X, Loader2, ShieldCheck, Sparkles, Scale, TrendingUp, MapPin,
} from 'lucide-react';
import { SERVICE_CATEGORIES, AREAS } from '@/data';
import type { Role, ServiceCategory } from '@/types';
import { authApi } from '@/lib/api';
import { saveSession } from '@/lib/auth';

interface AuthUser {
  name: string;
  mobile: string;
  email?: string;
  role: Role;
  category?: ServiceCategory;
  skills?: string[];
  experience?: number;
  serviceArea?: string;
  pendingVerification?: boolean;
}

export function AuthScreen({
  role,
  onBack,
  onSuccess,
}: {
  role: Role;
  onBack: () => void;
  onSuccess: (user: AuthUser) => void;
}) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Login fields
  const [loginId, setLoginId] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Signup fields
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState<ServiceCategory>('Plumbing');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [serviceArea, setServiceArea] = useState(AREAS[0]);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  const isWorker = role === 'worker';

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!loginId.trim() || !loginPass.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login({
        [loginId.includes('@') ? 'email' : 'phone']: loginId.trim(),
        password: loginPass,
        role,
      });
      saveSession(data.token, data.user);
      onSuccess({
        name: data.user.name,
        mobile: data.user.phone,
        email: data.user.email,
        role,
        pendingVerification: false,
      });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !mobile.trim() || !password.trim()) return;
    if (isWorker && !skills.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.register({
        name: name.trim(),
        phone: mobile.trim(),
        email: email.trim() || undefined,
        password,
        role,
        skills: isWorker ? skills : undefined,
        primaryService: isWorker ? category : undefined,
        experience: isWorker ? parseInt(experience) || 0 : undefined,
        serviceArea: isWorker ? serviceArea : undefined,
      });
      saveSession(data.token, data.user);
      onSuccess({
        name: data.user.name,
        mobile: data.user.phone,
        email: data.user.email,
        role,
        category: isWorker ? category : undefined,
        skills: isWorker ? skills.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
        experience: isWorker ? parseInt(experience) || 0 : undefined,
        serviceArea: isWorker ? serviceArea : undefined,
        pendingVerification: isWorker,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const accent = isWorker ? 'secondary' : 'primary';
  const accentBg = isWorker ? 'from-secondary-600 to-secondary-500' : 'from-primary-700 to-primary-600';
  const accentBtn = isWorker ? 'bg-secondary-600 hover:bg-secondary-700' : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-ink-50/50 via-white to-white">
      {/* Header */}
      <header className="border-b border-ink-200/60 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <button onClick={onBack} className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-500 transition hover:text-ink-700">
            <ArrowLeft className="h-4 w-4" /> Back to roles
          </button>
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary-600 text-white">
              <Handshake className="h-5 w-5" />
            </div>
            <p className="font-display text-base font-bold text-ink-900">SahkaarServe</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-5 py-10">
        {/* Role banner */}
        <div className={`mb-6 flex items-center gap-3 rounded-2xl bg-gradient-to-r ${accentBg} p-4 text-white`}>
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-white/20">
            {isWorker ? <HardHat className="h-6 w-6" /> : <User className="h-6 w-6" />}
          </div>
          <div>
            <p className="font-display text-lg font-bold">{isWorker ? 'Cooperative Worker' : 'Customer'} Portal</p>
            <p className="text-sm text-white/80">{isWorker ? 'Manage jobs, availability and earnings' : 'Find and book service professionals'}</p>
          </div>
        </div>

        {/* Mode toggle */}
        <div className="mb-5 flex rounded-xl bg-ink-100 p-1">
          <button
            onClick={() => setMode('login')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
          >
            Login
          </button>
          <button
            onClick={() => setMode('signup')}
            className={`flex-1 rounded-lg py-2 text-sm font-semibold transition ${mode === 'signup' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
          >
            Sign Up
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin} className="card-md space-y-4 p-5">
            <div>
              <label className="text-sm font-semibold text-ink-700">Mobile or Email</label>
              <div className="relative mt-1.5">
                {loginId.includes('@') ? <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" /> : <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />}
                <input
                  value={loginId}
                  onChange={(e) => { setLoginId(e.target.value); setError(null); }}
                  className="input-field pl-9"
                  placeholder="mobile number or email"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-semibold text-ink-700">Password</label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input
                  type="password"
                  value={loginPass}
                  onChange={(e) => { setLoginPass(e.target.value); setError(null); }}
                  className="input-field pl-9"
                  placeholder="••••••••"
                />
              </div>
            </div>
            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
                {error}
              </div>
            )}
            <div className="rounded-xl bg-ink-50 p-3 text-xs text-ink-500">
              Demo: phone <strong>9900000001</strong> / password <strong>demo1234</strong> (Customer)<br />
              Worker: phone <strong>9801000001</strong> / password <strong>worker1234</strong>
            </div>
            <button type="submit" disabled={loading || !loginId.trim() || !loginPass.trim()} className={`btn-primary w-full ${accentBtn}`}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Logging in…</> : <><ShieldCheck className="h-4 w-4" /> Login</>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="card-md space-y-4 p-5">
            <div>
              <label className="text-sm font-semibold text-ink-700">Full Name</label>
              <div className="relative mt-1.5">
                <UserCircle className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input value={name} onChange={(e) => setName(e.target.value)} className="input-field pl-9" placeholder="Your full name" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-ink-700">Mobile Number</label>
              <div className="relative mt-1.5">
                <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input value={mobile} onChange={(e) => setMobile(e.target.value)} className="input-field pl-9" placeholder="10-digit mobile number" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-ink-700">Email <span className="font-normal text-ink-400">(optional)</span></label>
              <div className="relative mt-1.5">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field pl-9" placeholder="your@email.com" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-ink-700">Password / OTP</label>
              <div className="relative mt-1.5">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pl-9" placeholder="Create a password" />
              </div>
            </div>

            {/* Worker-specific fields */}
            {isWorker && (
              <>
                <div className="border-t border-ink-100 pt-3">
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-ink-400">Service Details</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-ink-700">Service Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value as ServiceCategory)} className="input-field mt-1.5">
                    {SERVICE_CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-ink-700">Skills</label>
                  <input value={skills} onChange={(e) => setSkills(e.target.value)} className="input-field mt-1.5" placeholder="e.g. Pipe repair, leak fixing, fittings" />
                  <p className="mt-1 text-xs text-ink-400">Comma-separated list of your skills</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-semibold text-ink-700">Experience (years)</label>
                    <input type="number" value={experience} onChange={(e) => setExperience(e.target.value)} className="input-field mt-1.5" placeholder="5" min="0" />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-ink-700">Service Area</label>
                    <select value={serviceArea} onChange={(e) => setServiceArea(e.target.value)} className="input-field mt-1.5">
                      {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                </div>

                <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700">
                  <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
                  New workers start with <strong>Verification Pending</strong> status. The cooperative admin will review your identity, skills and references before approval.
                </div>
              </>
            )}

            {error && (
              <div className="rounded-xl bg-red-50 p-3 text-xs font-medium text-red-700">
                {error}
              </div>
            )}
            <button type="submit" disabled={loading || !name.trim() || !mobile.trim() || !password.trim() || (isWorker && !skills.trim())} className={`btn-primary w-full ${accentBtn}`}>
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account…</> : <><UserCircle className="h-4 w-4" /> Sign Up</>}
            </button>
          </form>
        )}

        {/* Trust badges */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs">
          <span className="chip bg-white text-ink-600 ring-1 ring-ink-200"><ShieldCheck className="h-3.5 w-3.5 text-primary-600" /> Verified Workers</span>
          <span className="chip bg-white text-ink-600 ring-1 ring-ink-200"><Scale className="h-3.5 w-3.5 text-teal-600" /> Fair Allocation</span>
          <span className="chip bg-white text-ink-600 ring-1 ring-ink-200"><TrendingUp className="h-3.5 w-3.5 text-primary-600" /> Demand Forecasting</span>
        </div>
      </main>
    </div>
  );
}
