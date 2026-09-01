import { useState } from 'react';
import {
  Home, CalendarClock, Wallet, Award, Clock, Heart, Settings, ShieldCheck,
  Check, X, Star, MapPin, Briefcase, TrendingUp, Scale, PiggyBank, Users,
  CheckCircle2, Droplets, Zap, Hammer, Car, HeartHandshake, Sparkles,
} from 'lucide-react';
import { AppShell } from './AppShell';
import { Avatar, Badge, RatingStars, VerifiedBadge, StatTile, ProgressBar, EmptyState } from './ui';
import { WORKERS, COOP_SUMMARY } from '@/data';
import { useBookings } from '@/store';
import type { Role, Booking, BookingStatus } from '@/types';

const worker = WORKERS[0]; // Rajesh Kumar
const WORKER = { name: 'Rajesh Kumar', subtitle: 'Bharat Seva Cooperative', initials: 'RK', color: 'bg-primary-600' };

const NAV = [
  { id: 'home', label: 'Dashboard', icon: <Home className="h-5 w-5" /> },
  { id: 'jobs', label: 'Jobs', icon: <CalendarClock className="h-5 w-5" /> },
  { id: 'earnings', label: 'Earnings', icon: <Wallet className="h-5 w-5" /> },
  { id: 'coop', label: 'Cooperative Economics', icon: <Scale className="h-5 w-5" /> },
  { id: 'welfare', label: 'My Benefits', icon: <Heart className="h-5 w-5" /> },
  { id: 'skills', label: 'Skills & Certificates', icon: <Award className="h-5 w-5" /> },
  { id: 'availability', label: 'Availability', icon: <Clock className="h-5 w-5" /> },
];

export function WorkerDashboard({ role, onExit, user }: { role: Role; onExit: () => void; user?: { name: string; mobile: string; email?: string; pendingVerification?: boolean } }) {
  void role;
  const workerName = user?.name ?? WORKER.name;
  const workerInitials = user?.name?.split(' ').map((w) => w[0]).join('').slice(0, 2) ?? WORKER.initials;
  const WORKER_USER = { ...WORKER, name: activeWorker.name, initials: activeWorker.initials };
  const isPending = user?.pendingVerification ?? false;
  const [active, setActive] = useState('home');

  const [activeWorker, setActiveWorker] = useState<any>(null);
  useEffect(() => {
    workersApi.getMe().then(data => {
      if (data) {
        setActiveWorker({
           id: data._id,
           name: data.name,
           trade: data.serviceCategory,
           rating: data.rating || 4.8,
           experienceYears: data.experienceYears || 3,
           initials: data.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2),
           available: data.availabilityStatus === 'AVAILABLE',
           earningsMonth: 24500,
           jobsCompleted: 156,
           currentWorkload: data.currentWorkload || 60,
           recentJobs: data.recentJobs || 12,
        });
      }
    }).catch(console.error);
  }, []);

  if (!activeWorker) return <div className="flex h-screen items-center justify-center"><div className="text-ink-500">Loading dashboard...</div></div>;
  return (
    <AppShell role="worker" nav={NAV} active={active} onNavigate={setActive} onExit={onExit} user={WORKER_USER}>
      {active === 'home' && <WorkerHome onNavigate={setActive} isPending={isPending} worker={activeWorker} />}
      {active === 'jobs' && <WorkerJobs worker={activeWorker} />}
      {active === 'earnings' && <WorkerEarnings worker={activeWorker} />}
      {active === 'coop' && <CooperativeEconomics worker={activeWorker} />}
      {active === 'welfare' && <WorkerWelfare worker={activeWorker} />}
      {active === 'skills' && <WorkerSkills worker={activeWorker} />}
      {active === 'availability' && <WorkerAvailability worker={activeWorker} />}
    </AppShell>
  );
}

function WorkerHome({ onNavigate, isPending }: { onNavigate: (id: string) => void; isPending: boolean }) {
  const { bookings } = useBookings();
  const myJobs = bookings.filter((b) => b.workerId === worker.id);
  const todayJobs = myJobs.filter((b) => b.status !== 'Completed' && b.status !== 'Rejected' && b.status !== 'Rated' && b.status !== 'Paid');
  const upcoming = myJobs.filter((b) => b.status === 'Requested' || b.status === 'Accepted');
  const completedJobs = myJobs.filter((b) => b.status === 'Rated' || b.status === 'Paid' || b.status === 'Completed').slice(0, 3);
  const [available, setAvailable] = useState(worker.available);

  return (
    <div className="space-y-6">
      {/* Greeting + profile */}
      <div className="card-md overflow-hidden">
        <div className="bg-gradient-to-br from-secondary-700 to-secondary-600 p-6 text-white">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar initials={worker.initials} color="bg-white/20" size="lg" />
              <div>
                <p className="text-sm text-secondary-100">Welcome back,</p>
                <h1 className="font-display text-2xl font-bold">{worker.name}</h1>
                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-secondary-100">
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3.5 w-3.5" /> {worker.trade}</span>
                  <span>•</span>
                  <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {worker.rating}</span>
                  <span>•</span>
                  <span>{worker.experienceYears} yrs exp</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setAvailable((a) => !a)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${available ? 'bg-primary-500 text-white' : 'bg-white/20 text-white'}`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${available ? 'bg-white' : 'bg-white/50'}`} />
              {available ? 'Available' : 'Unavailable'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Today's jobs" value={todayJobs.length} sub={`${todayJobs.filter((j) => j.status === 'Requested').length} pending`} icon={<CalendarClock className="h-4 w-4" />} />
        <StatTile label="Upcoming jobs" value={upcoming.length} icon={<Clock className="h-4 w-4" />} accent="secondary" />
        <StatTile label="This month earnings" value={`₹${(worker.earningsMonth / 1000).toFixed(1)}k`} sub="↑ 12% vs last month" icon={<Wallet className="h-4 w-4" />} accent="teal" />
        <StatTile label="Rating" value={worker.rating} sub={`${worker.jobsCompleted} jobs`} icon={<Star className="h-4 w-4" />} accent="accent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <SectionRow title="Today's jobs" action={<button onClick={() => onNavigate('jobs')} className="btn-ghost text-xs">View all</button>} />
            {todayJobs.length > 0 ? (
              <div className="space-y-3">
                {todayJobs.map((j) => <JobCard key={j.id} job={j} />)}
              </div>
            ) : (
              <div className="card p-6"><EmptyState icon={<CalendarClock className="h-6 w-6" />} title="No jobs today" subtitle="New jobs will appear here as customers request services." /></div>
            )}
          </div>

          <div>
            <SectionRow title="Upcoming jobs" />
            {upcoming.length > 0 ? (
              <div className="space-y-3">{upcoming.map((j) => <JobCard key={j.id} job={j} compact />)}</div>
            ) : (
              <div className="card p-6"><EmptyState icon={<Clock className="h-6 w-6" />} title="No upcoming jobs" /></div>
            )}
          </div>

          <div>
            <SectionRow title="Recently completed" />
            <div className="space-y-3">
              {completedJobs.map((j) => <JobCard key={j.id} job={j} compact />)}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-md p-5">
            <p className="text-xs font-semibold text-ink-500">Current workload</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="font-display text-3xl font-bold text-ink-900">{worker.currentWorkload}%</p>
              <Badge variant={worker.currentWorkload > 70 ? 'warning' : 'success'}>{worker.currentWorkload > 70 ? 'High' : 'Healthy'}</Badge>
            </div>
            <ProgressBar value={worker.currentWorkload} color={worker.currentWorkload > 70 ? 'bg-amber-500' : 'bg-primary-500'} />
            <p className="mt-2 text-xs text-ink-500">{worker.recentJobs} jobs in the last 7 days. Fair Allocation Engine is balancing your load.</p>
          </div>

          <div className="card-md p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary-600" />
              <p className="font-display text-sm font-bold text-ink-900">Verification status</p>
            </div>
            {isPending ? (
              <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                <Clock className="mr-1 inline h-4 w-4" />
                Verification Pending — awaiting cooperative admin review.
              </div>
            ) : (
              <>
                <div className="mt-3 space-y-2">
                  <VerifyRow label="Identity / contact check" done />
                  <VerifyRow label="Skill assessment (practical)" done />
                  <VerifyRow label="Cooperative review" done />
                  <VerifyRow label="References / previous work" done />
                </div>
                <VerifiedBadge label="✓ Cooperative Verified" />
              </>
            )}
          </div>

          <button onClick={() => onNavigate('coop')} className="card-md group w-full p-5 text-left transition hover:-translate-y-0.5 hover:shadow-card-lg">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-teal-50 text-teal-600"><Scale className="h-5 w-5" /></div>
              <div className="flex-1">
                <p className="font-display text-sm font-bold text-ink-900">Cooperative Economics</p>
                <p className="text-xs text-ink-500">See how your earnings are shared fairly.</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function VerifyRow({ label, done }: { label: string; done?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-600">{label}</span>
      {done ? <CheckCircle2 className="h-4 w-4 text-primary-600" /> : <Clock className="h-4 w-4 text-ink-400" />}
    </div>
  );
}

function SectionRow({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="section-title">{title}</h2>
      {action}
    </div>
  );
}

function JobCard({ job, compact }: { job: Booking; compact?: boolean }) {
  const { updateStatus, advanceStatus } = useBookings();
  const isPending = job.status === 'Requested';

  return (
    <div className="card-md p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className={`grid h-10 w-10 place-items-center rounded-xl ${job.isEmergency ? 'bg-red-50 text-danger' : 'bg-primary-50 text-primary-600'}`}>
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-sm font-bold text-ink-900">{job.service} — {job.subService}</p>
            <p className="text-xs text-ink-500">{job.id} · {job.customerName}</p>
            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-500">
              <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {job.date} · {job.time}</span>
              <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
              {job.isEmergency && <Badge variant="danger">Emergency</Badge>}
            </div>
          </div>
        </div>
        <div className="text-right">
          <p className="font-display text-base font-bold text-ink-900">₹{job.cost}</p>
          <StatusPill status={job.status} />
        </div>
      </div>

      {!compact && (
        <div className="mt-3 flex items-center gap-2">
          {isPending ? (
            <>
              <button onClick={() => updateStatus(job.id, 'Accepted')} className="btn-primary flex-1"><Check className="h-4 w-4" /> Accept</button>
              <button onClick={() => updateStatus(job.id, 'Rejected')} className="btn-secondary flex-1"><X className="h-4 w-4" /> Reject</button>
            </>
          ) : job.status !== 'Completed' && job.status !== 'Rejected' ? (
            <button onClick={() => advanceStatus(job.id)} className="btn-primary w-full">Advance status <Check className="h-4 w-4" /></button>
          ) : (
            <div className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-primary-50 py-2 text-sm font-semibold text-primary-700">
              <CheckCircle2 className="h-4 w-4" /> {job.status === 'Completed' ? 'Completed' : 'Rejected'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    Requested: 'bg-ink-100 text-ink-600', Accepted: 'bg-secondary-50 text-secondary-700',
    'On the Way': 'bg-amber-50 text-amber-700', 'Service Started': 'bg-secondary-100 text-secondary-800',
    Completed: 'bg-primary-50 text-primary-700', Rejected: 'bg-red-50 text-red-600',
  };
  return <span className={`chip ${map[status] ?? 'bg-ink-100 text-ink-600'}`}>{status}</span>;
}

function WorkerJobs() {
  const { bookings } = useBookings();
  const myJobs = bookings.filter((b) => b.workerId === worker.id);
  const [tab, setTab] = useState<'today' | 'upcoming' | 'history'>('today');
  const today = myJobs.filter((b) => b.status !== 'Completed' && b.status !== 'Rejected');
  const upcoming = myJobs.filter((b) => b.status === 'Requested');
  const history = myJobs.filter((b) => b.status === 'Completed');

  const list = tab === 'today' ? today : tab === 'upcoming' ? upcoming : history;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">Jobs</h1>
        <p className="mt-1 text-sm text-ink-600">Accept, reject and track your service requests.</p>
      </div>
      <div className="flex gap-2">
        {(['today', 'upcoming', 'history'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`rounded-lg px-3.5 py-2 text-sm font-semibold capitalize transition ${tab === t ? 'bg-primary-600 text-white' : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50'}`}>
            {t} ({t === 'today' ? today.length : t === 'upcoming' ? upcoming.length : history.length})
          </button>
        ))}
      </div>
      {list.length > 0 ? (
        <div className="space-y-3">{list.map((j) => <JobCard key={j.id} job={j} />)}</div>
      ) : (
        <div className="card p-6"><EmptyState icon={<CalendarClock className="h-6 w-6" />} title={`No ${tab} jobs`} /></div>
      )}
    </div>
  );
}

function WorkerEarnings() {
  const monthlyData = [
    { month: 'Feb', value: 14200 }, { month: 'Mar', value: 15800 }, { month: 'Apr', value: 13100 },
    { month: 'May', value: 16900 }, { month: 'Jun', value: 17200 }, { month: 'Jul', value: 18450 },
  ];
  const max = Math.max(...monthlyData.map((d) => d.value));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">Earnings</h1>
        <p className="mt-1 text-sm text-ink-600">Your cooperative-first income breakdown.</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="This month" value={`₹${(worker.earningsMonth / 1000).toFixed(1)}k`} sub="↑ 12% vs last" icon={<Wallet className="h-4 w-4" />} />
        <StatTile label="Jobs completed" value={worker.jobsCompleted} icon={<CheckCircle2 className="h-4 w-4" />} accent="secondary" />
        <StatTile label="Avg / job" value={`₹${Math.round(worker.earningsMonth / 22)}`} icon={<TrendingUp className="h-4 w-4" />} accent="teal" />
        <StatTile label="Welfare fund" value={`₹${worker.welfareContribution}`} sub="This month" icon={<PiggyBank className="h-4 w-4" />} accent="accent" />
      </div>

      <div className="card-md p-5">
        <p className="text-sm font-semibold text-ink-700">Monthly earnings</p>
        <div className="mt-4 flex items-end gap-3" style={{ height: 180 }}>
          {monthlyData.map((d) => (
            <div key={d.month} className="flex flex-1 flex-col items-center gap-2">
              <div className="flex w-full flex-1 items-end justify-center">
                <div className="w-full max-w-[36px] rounded-t-lg bg-gradient-to-t from-primary-600 to-primary-400 transition-all duration-700" style={{ height: `${(d.value / max) * 100}%` }} title={`₹${d.value}`} />
              </div>
              <span className="text-[10px] font-medium text-ink-500">{d.month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card-md p-5">
        <p className="text-sm font-semibold text-ink-700">Recent payouts</p>
        <div className="mt-3 divide-y divide-ink-100">
          {[
            { id: 'SS1018', date: 'Yesterday', amount: 500, status: 'Paid' },
            { id: 'SS1023', date: '3 days ago', amount: 1400, status: 'Paid' },
            { id: 'SS1011', date: '5 days ago', amount: 450, status: 'Paid' },
            { id: 'SS1005', date: 'Last week', amount: 680, status: 'Paid' },
          ].map((p) => (
            <div key={p.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-ink-900">#{p.id}</p>
                <p className="text-xs text-ink-500">{p.date}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="success">{p.status}</Badge>
                <p className="font-display text-sm font-bold text-ink-900">+₹{p.amount}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function CooperativeEconomics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">Cooperative Economics</h1>
        <p className="mt-1 text-sm text-ink-600">See how your service income is transparently shared.</p>
      </div>

      <div className="card-md overflow-hidden">
        <div className="bg-gradient-to-br from-primary-700 to-primary-600 p-5 text-white">
          <p className="text-sm text-primary-100">Example Service Amount</p>
          <p className="font-display text-3xl font-bold">₹1,000</p>
        </div>
        <div className="p-5 space-y-3">
          <EconRow label="Total Service Amount" value="₹1,000" />
          <EconRow label="Your Earnings" value="₹850" highlight="text-primary-700" />
          <EconRow label="Cooperative Contribution" value="₹100" sub="10% — operations & platform" />
          <EconRow label="Worker Welfare Fund" value="₹50" sub="5% — health, insurance, tools" />
          <div className="border-t border-ink-100 pt-3">
            <div className="flex items-center justify-between">
              <span className="font-display text-sm font-bold text-ink-900">You Receive</span>
              <span className="font-display text-2xl font-bold text-primary-700">₹850</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card-md border-teal-200 bg-teal-50/40 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-teal-600 text-white"><Scale className="h-5 w-5" /></div>
          <div>
            <p className="font-display text-sm font-bold text-teal-800">Transparent income sharing</p>
            <p className="mt-1 text-sm text-ink-700">Your service income is transparently divided between your earnings, cooperative contribution and worker welfare support.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EconRow({ label, value, sub, highlight }: { label: string; value: string; sub?: string; highlight?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-ink-700">{label}</p>
        {sub && <p className="text-[10px] text-ink-400">{sub}</p>}
      </div>
      <p className={`font-display text-sm font-bold ${highlight ?? 'text-ink-900'}`}>{value}</p>
    </div>
  );
}

function WorkerWelfare() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">My Cooperative Benefits</h1>
        <p className="mt-1 text-sm text-ink-600">As a verified cooperative member, you receive benefits beyond your earnings.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Earnings this month" value={`₹${(worker.earningsMonth / 1000).toFixed(1)}k`} icon={<Wallet className="h-4 w-4" />} />
        <StatTile label="Welfare contribution" value={`₹${worker.welfareContribution}`} sub="Auto-saved" icon={<PiggyBank className="h-4 w-4" />} accent="teal" />
        <StatTile label="Coop contribution" value={`₹${worker.coopContribution}`} sub="10% share" icon={<Users className="h-4 w-4" />} accent="secondary" />
        <StatTile label="Total benefits" value={`₹${(worker.welfareContribution * 6).toLocaleString()}`} sub="This year" icon={<Heart className="h-4 w-4" />} accent="accent" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {[
          { icon: HeartHandshake, title: 'Health Insurance', desc: 'Family health coverage funded by the welfare pool.', value: 'Active', color: 'bg-pink-50 text-pink-600' },
          { icon: ShieldCheck, title: 'Accident Cover', desc: 'On-the-job accident protection while working.', value: '₹2L cover', color: 'bg-primary-50 text-primary-600' },
          { icon: Award, title: 'Skill Upgradation', desc: 'Free certification courses through the cooperative.', value: '3 courses', color: 'bg-secondary-50 text-secondary-600' },
          { icon: PiggyBank, title: 'Savings Fund', desc: 'Mandatory welfare contribution grows your savings.', value: `₹${(worker.welfareContribution * 6).toLocaleString()}`, color: 'bg-teal-50 text-teal-600' },
          { icon: Sparkles, title: 'Tool Subsidy', desc: '50% subsidy on professional tools and equipment.', value: 'Up to ₹5k', color: 'bg-amber-50 text-amber-600' },
          { icon: Users, title: 'Cooperative Voting', desc: 'Vote on cooperative decisions and policies.', value: '1 share', color: 'bg-indigo-50 text-indigo-600' },
        ].map((b) => (
          <div key={b.title} className="card-md p-5">
            <div className="flex items-start gap-3">
              <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${b.color}`}><b.icon className="h-5 w-5" /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <p className="font-display text-sm font-bold text-ink-900">{b.title}</p>
                  <Badge variant="success">{b.value}</Badge>
                </div>
                <p className="mt-1 text-sm text-ink-600">{b.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WorkerSkills() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">Skills & Certificates</h1>
        <p className="mt-1 text-sm text-ink-600">Your verified skills and professional certifications.</p>
      </div>

      <div className="card-md p-5">
        <p className="text-sm font-semibold text-ink-700">Skills</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {worker.skills.map((s, i) => (
            <span key={s} className={`chip ${i === 0 ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-200' : 'bg-ink-100 text-ink-700'}`}>
              <Check className="h-3 w-3" /> {s}
            </span>
          ))}
        </div>
      </div>

      <div className="card-md p-5">
        <p className="text-sm font-semibold text-ink-700">Certifications</p>
        <div className="mt-3 space-y-3">
          {worker.certifications.map((c, i) => (
            <div key={c} className="flex items-center gap-3 rounded-xl border border-ink-200 p-3.5">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600"><Award className="h-5 w-5" /></div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink-900">{c}</p>
                <p className="text-xs text-ink-500">Issued by {worker.cooperative}</p>
              </div>
              <Badge variant="success" icon={<ShieldCheck className="h-3 w-3" />}>Verified</Badge>
            </div>
          ))}
        </div>
      </div>

      <div className="card-md p-5">
        <p className="text-sm font-semibold text-ink-700">Service categories</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { icon: Droplets, label: 'Plumbing' },
            { icon: Zap, label: 'Electrical Basics' },
            { icon: Hammer, label: 'Carpentry Basics' },
            { icon: Car, label: 'Driving' },
            { icon: HeartHandshake, label: 'Eldercare' },
            { icon: Sparkles, label: 'Cleaning' },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-2 rounded-xl border border-ink-200 p-3">
              <s.icon className="h-4 w-4 text-ink-500" />
              <span className="text-sm font-medium text-ink-700">{s.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function WorkerAvailability() {
  const [available, setAvailable] = useState(worker.available);
  const [availableNow, setAvailableNow] = useState(worker.availableNow);
  const slots = ['9–11 AM', '11–1 PM', '1–3 PM', '3–5 PM', '5–7 PM'];
  const [selected, setSelected] = useState<string[]>(['11–1 PM', '3–5 PM', '5–7 PM']);

  function toggle(slot: string) {
    setSelected((s) => (s.includes(slot) ? s.filter((x) => x !== slot) : [...s, slot]));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">Availability</h1>
        <p className="mt-1 text-sm text-ink-600">Control when you receive job assignments. The Fair Allocation Engine respects your preferences.</p>
      </div>

      <div className="card-md p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className={`grid h-12 w-12 place-items-center rounded-xl ${available ? 'bg-primary-50 text-primary-600' : 'bg-ink-100 text-ink-500'}`}>
              <span className={`h-3.5 w-3.5 rounded-full ${available ? 'bg-primary-500' : 'bg-ink-400'}`} />
            </div>
            <div>
              <p className="font-display text-sm font-bold text-ink-900">Availability status</p>
              <p className="text-xs text-ink-500">{available ? 'You are receiving job requests' : 'You are currently unavailable'}</p>
            </div>
          </div>
          <button onClick={() => setAvailable((a) => !a)} className={`relative h-8 w-14 rounded-full transition ${available ? 'bg-primary-600' : 'bg-ink-300'}`}>
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${available ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-xl bg-ink-50 p-3">
          <div>
            <p className="text-sm font-semibold text-ink-700">Available for emergency dispatch</p>
            <p className="text-xs text-ink-500">Receive urgent high-priority jobs immediately</p>
          </div>
          <button onClick={() => setAvailableNow((a) => !a)} className={`relative h-8 w-14 rounded-full transition ${availableNow ? 'bg-red-500' : 'bg-ink-300'}`}>
            <span className={`absolute top-1 h-6 w-6 rounded-full bg-white transition-all ${availableNow ? 'left-7' : 'left-1'}`} />
          </button>
        </div>
      </div>

      <div className="card-md p-5">
        <p className="text-sm font-semibold text-ink-700">Today's time slots</p>
        <p className="mt-0.5 text-xs text-ink-500">Select when you're free to accept jobs</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          {slots.map((slot) => (
            <button
              key={slot}
              onClick={() => toggle(slot)}
              className={`rounded-xl border-2 p-3 text-sm font-semibold transition ${selected.includes(slot) ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-ink-200 bg-white text-ink-600 hover:border-ink-300'}`}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      <div className="card-md p-5">
        <div className="flex items-center gap-2">
          <Scale className="h-5 w-5 text-teal-600" />
          <p className="font-display text-sm font-bold text-ink-900">Fair Allocation impact</p>
        </div>
        <div className="mt-3 space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-xs"><span className="text-ink-600">Your current workload</span><span className="font-bold text-ink-900">{worker.currentWorkload}%</span></div>
            <ProgressBar value={worker.currentWorkload} color="bg-amber-500" />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs"><span className="text-ink-600">Recent jobs (7 days)</span><span className="font-bold text-ink-900">{worker.recentJobs}</span></div>
            <ProgressBar value={worker.recentJobs} color="bg-secondary-500" />
          </div>
          <p className="rounded-xl bg-teal-50 p-3 text-xs text-teal-700">
            <Sparkles className="mr-1 inline h-3.5 w-3.5" />
            Because your recent workload is high, the Fair Allocation Engine may route some jobs to other qualified workers to keep distribution fair across the cooperative.
          </p>
        </div>
      </div>
    </div>
  );
}
