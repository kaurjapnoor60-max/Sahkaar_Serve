import { useState } from 'react';
import {
  Home, Users, CalendarClock, Map, TrendingUp, Scale, Sparkles,
  ShieldCheck, Star, Briefcase, Activity, Zap, ArrowUpRight, ArrowDownRight,
  CheckCircle2, Clock, MapPin, Wallet, PiggyBank, Navigation,
} from 'lucide-react';
import { AppShell } from './AppShell';
import { Avatar, Badge, RatingStars, VerifiedBadge, StatTile, ProgressBar, EmptyState } from './ui';
import { WeeklyDemandChart, ForecastChart, HeatmapGrid, DonutChart } from './charts';
import { WORKERS, COOP_SUMMARY, SERVICE_CATEGORIES } from '@/data';
import { useBookings } from '@/store';
import type { Role } from '@/types';

const ADMIN = { name: 'Admin Office', subtitle: 'Bharat Seva Cooperative', initials: 'AO', color: 'bg-teal-600' };

const NAV = [
  { id: 'home', label: 'Overview', icon: <Home className="h-5 w-5" /> },
  { id: 'workers', label: 'Workers', icon: <Users className="h-5 w-5" /> },
  { id: 'bookings', label: 'Bookings', icon: <CalendarClock className="h-5 w-5" /> },
  { id: 'demand', label: 'Demand Heatmap', icon: <Map className="h-5 w-5" /> },
  { id: 'forecast', label: 'Demand Forecasting', icon: <TrendingUp className="h-5 w-5" /> },
  { id: 'allocation', label: 'AI Workforce Allocation', icon: <Sparkles className="h-5 w-5" /> },
  { id: 'economics', label: 'Cooperative Economics', icon: <Scale className="h-5 w-5" /> },
];

export function AdminDashboard({ role, onExit }: { role: Role; onExit: () => void }) {
  void role;
  const [active, setActive] = useState('home');
  return (
    <AppShell role="admin" nav={NAV} active={active} onNavigate={setActive} onExit={onExit} user={ADMIN}>
      {active === 'home' && <AdminHome onNavigate={setActive} />}
      {active === 'workers' && <AdminWorkers />}
      {active === 'bookings' && <AdminBookings />}
      {active === 'demand' && <AdminDemand />}
      {active === 'forecast' && <AdminForecast />}
      {active === 'allocation' && <AdminAllocation />}
      {active === 'economics' && <AdminEconomics />}
    </AppShell>
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

function AdminHome({ onNavigate }: { onNavigate: (id: string) => void }) {
  const { bookings } = useBookings();
  const active = bookings.filter((b) => b.status !== 'Completed' && b.status !== 'Rejected');
  const completed = bookings.filter((b) => b.status === 'Completed');
  const totalRating = (WORKERS.reduce((a, w) => a + w.rating, 0) / WORKERS.length).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="card-md overflow-hidden">
        <div className="bg-gradient-to-br from-teal-700 to-teal-600 p-6 text-white">
          <p className="text-sm text-teal-100">Cooperative Operations Center</p>
          <h1 className="mt-1 font-display text-2xl font-bold">Bharat Seva Cooperative</h1>
          <p className="mt-1 text-sm text-teal-100/80">Real-time view of workers, demand and fair allocation across all service areas.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Active workers" value={WORKERS.filter((w) => w.available).length} sub={`of ${WORKERS.length} total`} icon={<Users className="h-4 w-4" />} />
        <StatTile label="Active bookings" value={active.length} sub={`${completed.length} completed`} icon={<Activity className="h-4 w-4" />} accent="secondary" />
        <StatTile label="Avg rating" value={totalRating} sub="Across all workers" icon={<Star className="h-4 w-4" />} accent="accent" />
        <StatTile label="Coop revenue" value={`₹${(COOP_SUMMARY.totalCoopRevenue / 1000).toFixed(0)}k`} sub="This month" icon={<Wallet className="h-4 w-4" />} accent="teal" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card-md p-5">
            <SectionRow title="Weekly demand trend" action={<button onClick={() => onNavigate('forecast')} className="btn-ghost text-xs">Forecast</button>} />
            <WeeklyDemandChart />
            <div className="mt-4 flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5 text-primary-600 font-semibold"><ArrowUpRight className="h-4 w-4" /> 28% peak on Saturday</span>
              <span className="text-ink-500">Avg 352 requests/day this week</span>
            </div>
          </div>

          <div className="card-md p-5">
            <SectionRow title="Recent bookings" action={<button onClick={() => onNavigate('bookings')} className="btn-ghost text-xs">View all</button>} />
            <div className="space-y-2">
              {bookings.slice(0, 4).map((b) => (
                <div key={b.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary-50 text-primary-600"><Briefcase className="h-4 w-4" /></div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{b.id} · {b.service}</p>
                    <p className="truncate text-xs text-ink-500">{b.workerName} · {b.customerName} · {b.location}</p>
                  </div>
                  <span className={`chip ${b.status === 'Completed' ? 'bg-primary-50 text-primary-700' : 'bg-ink-100 text-ink-600'}`}>{b.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="card-md p-5">
            <div className="flex items-center gap-2">
              <Scale className="h-5 w-5 text-teal-600" />
              <p className="font-display text-sm font-bold text-ink-900">Fair Allocation status</p>
            </div>
            <p className="mt-2 text-xs text-ink-500">Job distribution across active workers (last 7 days)</p>
            <div className="mt-3 space-y-2">
              {WORKERS.slice(0, 5).sort((a, b) => b.recentJobs - a.recentJobs).map((w) => (
                <div key={w.id}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="font-medium text-ink-700">{w.name}</span>
                    <span className="font-bold text-ink-900">{w.recentJobs} jobs</span>
                  </div>
                  <ProgressBar value={w.recentJobs} color={w.recentJobs > 35 ? 'bg-amber-500' : 'bg-primary-500'} />
                </div>
              ))}
            </div>
            <div className="mt-3 rounded-xl bg-teal-50 p-3 text-xs text-teal-700">
              <Sparkles className="mr-1 inline h-3.5 w-3.5" /> Engine actively balancing load — no worker exceeds 40% of allocation.
            </div>
          </div>

          <button onClick={() => onNavigate('demand')} className="card-md group w-full p-5 text-left transition hover:-translate-y-0.5 hover:shadow-card-lg">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary-50 text-secondary-600"><Map className="h-5 w-5" /></div>
              <div className="flex-1">
                <p className="font-display text-sm font-bold text-ink-900">Community Demand Heatmap</p>
                <p className="text-xs text-ink-500">See demand by area and service</p>
              </div>
            </div>
          </button>

          <button onClick={() => onNavigate('allocation')} className="card-md group w-full p-5 text-left transition hover:-translate-y-0.5 hover:shadow-card-lg">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary-50 text-primary-600"><Sparkles className="h-5 w-5" /></div>
              <div className="flex-1">
                <p className="font-display text-sm font-bold text-ink-900">AI Workforce Allocation</p>
                <p className="text-xs text-ink-500">Optimize worker deployment</p>
              </div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminWorkers() {
  const [search, setSearch] = useState('');
  const filtered = WORKERS.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()) || w.trade.toLowerCase().includes(search.toLowerCase()));
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">Workers</h1>
        <p className="mt-1 text-sm text-ink-600">Manage your cooperative's verified workforce.</p>
      </div>
      <div className="card-md p-4">
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or trade…" className="input-field" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {filtered.map((w) => (
          <div key={w.id} className="card-md p-5">
            <div className="flex items-start gap-4">
              <Avatar initials={w.initials} color={w.avatarColor} size="md" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-sm font-bold text-ink-900">{w.name}</p>
                  <VerifiedBadge label="Verified" />
                </div>
                <p className="text-xs text-ink-500">{w.trade} · {w.cooperative}</p>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600">
                  <RatingStars rating={w.rating} />
                  <span className="inline-flex items-center gap-1"><Briefcase className="h-3 w-3" /> {w.jobsCompleted} jobs</span>
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> {w.distanceKm} km</span>
                  <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {w.experienceYears} yrs</span>
                </div>
              </div>
              <Badge variant={w.available ? 'success' : 'neutral'}>{w.available ? 'Available' : 'Busy'}</Badge>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-3">
              <MiniStat label="Workload" value={`${w.currentWorkload}%`} />
              <MiniStat label="Recent jobs" value={`${w.recentJobs}`} />
              <MiniStat label="Earnings" value={`₹${(w.earningsMonth / 1000).toFixed(1)}k`} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {w.skills.slice(0, 3).map((s) => <span key={s} className="chip bg-ink-100 text-ink-600">{s}</span>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-ink-200 p-2.5">
      <p className="text-[10px] font-medium text-ink-500">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-ink-900">{value}</p>
    </div>
  );
}

function AdminBookings() {
  const { bookings, advanceStatus } = useBookings();
  const [filter, setFilter] = useState<string>('all');
  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">All Bookings</h1>
        <p className="mt-1 text-sm text-ink-600">Monitor and manage service requests across the cooperative.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {['all', 'Requested', 'Accepted', 'On the Way', 'Service Started', 'Completed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${filter === f ? 'bg-primary-600 text-white' : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50'}`}>
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>
      {filtered.length > 0 ? (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="card-md p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`grid h-10 w-10 place-items-center rounded-xl ${b.isEmergency ? 'bg-red-50 text-danger' : 'bg-primary-50 text-primary-600'}`}><Briefcase className="h-5 w-5" /></div>
                  <div>
                    <p className="font-display text-sm font-bold text-ink-900">{b.id} · {b.service} — {b.subService}</p>
                    <p className="text-xs text-ink-500">{b.customerName} → {b.workerName} · {b.date} {b.time}</p>
                    <p className="mt-0.5 text-xs text-ink-500">{b.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-display text-sm font-bold text-ink-900">₹{b.cost}</span>
                  <span className={`chip ${b.status === 'Completed' ? 'bg-primary-50 text-primary-700' : b.status === 'Requested' ? 'bg-ink-100 text-ink-600' : 'bg-secondary-50 text-secondary-700'}`}>{b.status}</span>
                </div>
              </div>
              {b.status !== 'Completed' && b.status !== 'Rejected' && (
                <button onClick={() => advanceStatus(b.id)} className="btn-secondary mt-3 text-xs">Advance status</button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-6"><EmptyState icon={<CalendarClock className="h-6 w-6" />} title="No bookings in this filter" /></div>
      )}
    </div>
  );
}

function AdminDemand() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">Community Demand Heatmap</h1>
        <p className="mt-1 text-sm text-ink-600">Service demand intensity by area and category — darker cells mean higher demand.</p>
      </div>
      <div className="card-md p-5">
        <HeatmapGrid />
        <div className="mt-4 flex items-center gap-3 text-xs text-ink-500">
          <span>Low</span>
          <div className="h-2 flex-1 rounded-full bg-gradient-to-r from-primary-50 to-primary-600" />
          <span>High</span>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICE_CATEGORIES.slice(0, 6).map((c) => {
          const Icon = c.icon;
          return (
            <div key={c.name} className="card p-4">
              <div className="flex items-center gap-2">
                <div className={`grid h-9 w-9 place-items-center rounded-lg ${c.bg} ${c.color}`}><span className="text-base">{Icon}</span></div>
                <p className="font-display text-sm font-bold text-ink-900">{c.name}</p>
              </div>
              <p className="mt-2 text-xs text-ink-500">Demand across areas</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminForecast() {
  const insights = [
    { icon: TrendingUp, title: 'Saturday peak predicted', desc: 'AI forecasts 540+ requests — pre-position 4 extra workers in Area A and C.', color: 'text-primary-600 bg-primary-50' },
    { icon: Zap, title: 'Electrical surge (Area D)', desc: 'Industrial zone shows 86 electrical requests — 14% above normal. Assign specialist.', color: 'text-accent-600 bg-accent-50' },
    { icon: Map, title: 'Cleaning demand rising', desc: 'Area B cleaning demand up 25% — recommend 2 additional cleaners on weekends.', color: 'text-secondary-600 bg-secondary-50' },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">AI Demand Forecasting</h1>
        <p className="mt-1 text-sm text-ink-600">Predictive model trained on cooperative service history to optimize worker deployment.</p>
      </div>
      <div className="card-md p-5">
        <SectionRow title="Predicted vs actual demand" action={<Badge variant="primary" icon={<Sparkles className="h-3 w-3" />}>AI Model</Badge>} />
        <ForecastChart />
        <div className="mt-4 grid grid-cols-3 gap-3">
          <ForecastStat label="Model accuracy" value="94.2%" trend="up" />
          <ForecastStat label="Next peak" value="Sat 540" trend="up" />
          <ForecastStat label="Suggested workers" value="+6" trend="up" />
        </div>
      </div>
      <div>
        <SectionRow title="AI insights & recommendations" />
        <div className="space-y-3">
          {insights.map((i) => (
            <div key={i.title} className="card-md flex items-start gap-4 p-4">
              <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${i.color}`}><i.icon className="h-5 w-5" /></div>
              <div>
                <p className="font-display text-sm font-bold text-ink-900">{i.title}</p>
                <p className="mt-0.5 text-sm text-ink-600">{i.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ForecastStat({ label, value, trend }: { label: string; value: string; trend: 'up' | 'down' }) {
  return (
    <div className="rounded-xl border border-ink-200 p-3">
      <p className="text-xs text-ink-500">{label}</p>
      <p className="mt-0.5 flex items-center gap-1 font-display text-base font-bold text-ink-900">
        {value}
        {trend === 'up' ? <ArrowUpRight className="h-3.5 w-3.5 text-primary-600" /> : <ArrowDownRight className="h-3.5 w-3.5 text-danger" />}
      </p>
    </div>
  );
}

function AdminAllocation() {
  const allocations = [
    { area: 'Area A — Greenwood Society', worker: 'Rajesh Kumar', trade: 'Plumbing', reason: 'High plumbing demand + low nearby alternatives', score: 92 },
    { area: 'Area C — Old Town', worker: 'Prakash Rao', trade: 'Carpentry', reason: 'Carpentry demand surge + closest available specialist', score: 88 },
    { area: 'Area D — Industrial Zone', worker: 'Vikram Patel', trade: 'Technical', reason: 'Appliance repair cluster + lowest workload in zone', score: 90 },
    { area: 'Area B — Lakeview Colony', worker: 'Sunita Devi', trade: 'Cleaning', reason: 'Weekend cleaning peak + fair rotation (low recent jobs)', score: 85 },
  ];
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">AI Workforce Allocation</h1>
        <p className="mt-1 text-sm text-ink-600">The AI suggests optimal worker deployment per area using demand forecast, skills, workload and fair distribution.</p>
      </div>

      <div className="card-md border-primary-200 bg-primary-50/40 p-5">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-600 text-white"><Scale className="h-5 w-5" /></div>
          <div>
            <p className="font-display text-sm font-bold text-primary-800">Fair Allocation Engine</p>
            <p className="mt-1 text-sm text-ink-700">Deployments balance demand coverage with fair job distribution. No single worker receives a disproportionate share — the engine penalizes over-allocated workers and rewards those with lower recent loads while maintaining quality thresholds.</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {allocations.map((a) => (
          <div key={a.area} className="card-md p-5">
            <div className="flex items-center justify-between">
              <Badge variant="secondary" icon={<MapPin className="h-3 w-3" />}>{a.area.replace('Area ', 'A')}</Badge>
              <Badge variant="primary" icon={<Sparkles className="h-3 w-3" />}>{a.score}% fit</Badge>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <Avatar initials={a.worker.split(' ').map((w) => w[0]).join('')} color="bg-primary-600" size="sm" />
              <div>
                <p className="text-sm font-bold text-ink-900">{a.worker}</p>
                <p className="text-xs text-ink-500">{a.trade}</p>
              </div>
            </div>
            <div className="mt-3 rounded-xl bg-ink-50 p-3 text-xs text-ink-600">
              <Navigation className="mr-1 inline h-3.5 w-3.5 text-primary-600" /> {a.reason}
            </div>
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs"><span className="text-ink-500">Allocation score</span><span className="font-bold text-ink-900">{a.score}%</span></div>
              <ProgressBar value={a.score} color="bg-primary-500" />
            </div>
          </div>
        ))}
      </div>

      <div className="card-md p-5">
        <p className="text-sm font-semibold text-ink-700">Workload distribution (all workers)</p>
        <div className="mt-4 space-y-2">
          {WORKERS.sort((a, b) => b.recentJobs - a.recentJobs).map((w) => (
            <div key={w.id}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="font-medium text-ink-700">{w.name} <span className="text-ink-400">· {w.trade}</span></span>
                <span className="font-bold text-ink-900">{w.recentJobs} recent · {w.currentWorkload}% load</span>
              </div>
              <ProgressBar value={w.recentJobs} color={w.recentJobs > 35 ? 'bg-amber-500' : w.recentJobs > 20 ? 'bg-primary-500' : 'bg-teal-500'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminEconomics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-xl font-bold text-ink-900">Cooperative Economics</h1>
        <p className="mt-1 text-sm text-ink-600">Cooperative-wide revenue, worker earnings and welfare fund overview.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatTile label="Total revenue" value={`₹${(COOP_SUMMARY.totalCoopRevenue / 1000).toFixed(0)}k`} sub="This month" icon={<Wallet className="h-4 w-4" />} />
        <StatTile label="Worker payouts" value={`₹${((COOP_SUMMARY.totalCoopRevenue * 0.82 / 1000)).toFixed(0)}k`} sub="82% to workers" icon={<Users className="h-4 w-4" />} accent="secondary" />
        <StatTile label="Welfare fund" value={`₹${((COOP_SUMMARY.totalCoopRevenue * 0.08 / 1000)).toFixed(0)}k`} sub="8% reserved" icon={<PiggyBank className="h-4 w-4" />} accent="teal" />
        <StatTile label="Avg income" value={`₹${(COOP_SUMMARY.avgWorkerIncome / 1000).toFixed(1)}k`} sub="Per worker" icon={<TrendingUp className="h-4 w-4" />} accent="accent" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card-md p-5">
          <p className="text-sm font-semibold text-ink-700">Revenue distribution</p>
          <div className="mt-5"><DonutChart /></div>
        </div>
        <div className="card-md p-5">
          <p className="text-sm font-semibold text-ink-700">Cooperative principles</p>
          <div className="mt-3 space-y-3">
            {[
              { t: 'Worker ownership', d: 'Workers are members, not gig contractors. They hold voting shares in the cooperative.' },
              { t: 'Fair revenue share', d: '82% of service revenue goes directly to workers — far above typical marketplaces.' },
              { t: 'Welfare first', d: '8% of all revenue funds health insurance, accident cover and skill development.' },
              { t: 'Transparent operations', d: '10% covers platform costs and cooperative administration — fully audited.' },
            ].map((p) => (
              <div key={p.t} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                <div>
                  <p className="text-sm font-semibold text-ink-900">{p.t}</p>
                  <p className="text-xs text-ink-600">{p.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-md p-5">
        <p className="text-sm font-semibold text-ink-700">Top earning workers this month</p>
        <div className="mt-3 space-y-2">
          {[...WORKERS].sort((a, b) => b.earningsMonth - a.earningsMonth).slice(0, 6).map((w, i) => (
            <div key={w.id} className="flex items-center gap-3 rounded-xl border border-ink-100 p-3">
              <span className="grid h-7 w-7 place-items-center rounded-full bg-ink-100 text-xs font-bold text-ink-600">{i + 1}</span>
              <Avatar initials={w.initials} color={w.avatarColor} size="sm" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-ink-900">{w.name}</p>
                <p className="text-xs text-ink-500">{w.trade}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-sm font-bold text-ink-900">₹{w.earningsMonth.toLocaleString()}</p>
                <p className="text-xs text-ink-500">+₹{w.welfareContribution} welfare</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
